import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertArticleSchema, insertKeywordSchema, insertImageStyleSchema, insertTargetAudienceSchema, insertLinkTableColumnSchema, insertSiteUrlSchema } from "@shared/schema";
import type { ContentOptimizationResult, ContentSuggestion } from "@shared/schema";
import crypto from "crypto";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import FirecrawlAppModule from "@mendable/firecrawl-js";
const FirecrawlApp = (FirecrawlAppModule as any).default || FirecrawlAppModule;

// OAuth state storage (in production, use Redis or similar)
const oauthStates = new Map<string, { timestamp: number }>();

// Google OAuth configuration
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GSC_SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"];
const GA_SCOPES = ["https://www.googleapis.com/auth/analytics.readonly"];

// Helper function to get valid GSC access token (auto-refresh if expired)
async function getValidGSCToken(): Promise<string | null> {
  const gscIntegration = await storage.getIntegration("gsc");
  if (!gscIntegration || gscIntegration.status !== "connected") {
    return null;
  }

  const config = (gscIntegration.config || {}) as { 
    accessToken?: string; 
    refreshToken?: string; 
    expiresAt?: number 
  };

  if (!config.accessToken) {
    return null;
  }

  // Check if token is expired or will expire in the next 5 minutes
  const isExpired = config.expiresAt && Date.now() > (config.expiresAt - 5 * 60 * 1000);
  
  if (!isExpired) {
    return config.accessToken;
  }

  // Token is expired, try to refresh
  if (!config.refreshToken) {
    console.log("[GSC] Access token expired but no refresh token available");
    return null;
  }

  console.log("[GSC] Access token expired, refreshing...");
  
  const clientId = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    console.error("[GSC] Missing OAuth credentials for token refresh");
    return null;
  }

  try {
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: config.refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("[GSC] Token refresh failed:", errorText);
      return null;
    }

    const tokens = await tokenResponse.json();
    
    // Update stored tokens
    await storage.upsertIntegration({
      name: "gsc",
      status: "connected",
      lastSync: new Date().toISOString(),
      config: JSON.stringify({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || config.refreshToken, // Keep old refresh token if not provided
        expiresAt: Date.now() + (tokens.expires_in * 1000),
      }),
    });

    console.log("[GSC] Token refreshed successfully");
    return tokens.access_token;
  } catch (error) {
    console.error("[GSC] Token refresh error:", error);
    return null;
  }
}

// Helper function to get valid GA access token (auto-refresh if expired)
async function getValidGAToken(): Promise<string | null> {
  const gaIntegration = await storage.getIntegration("ga");
  if (!gaIntegration || gaIntegration.status !== "connected") {
    return null;
  }

  const config = (gaIntegration.config || {}) as { 
    accessToken?: string; 
    refreshToken?: string; 
    expiresAt?: number;
    propertyId?: string;
  };

  if (!config.accessToken) {
    return null;
  }

  // Check if token is expired or will expire in the next 5 minutes
  const isExpired = config.expiresAt && Date.now() > (config.expiresAt - 5 * 60 * 1000);
  
  if (!isExpired) {
    return config.accessToken;
  }

  // Token is expired, try to refresh
  if (!config.refreshToken) {
    console.log("[GA] Access token expired but no refresh token available");
    return null;
  }

  console.log("[GA] Access token expired, refreshing...");
  
  const clientId = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    console.error("[GA] Missing OAuth credentials for token refresh");
    return null;
  }

  try {
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: config.refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("[GA] Token refresh failed:", errorText);
      return null;
    }

    const tokens = await tokenResponse.json();
    
    // Update stored tokens
    await storage.upsertIntegration({
      name: "ga",
      status: "connected",
      lastSync: new Date().toISOString(),
      config: JSON.stringify({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || config.refreshToken,
        expiresAt: Date.now() + (tokens.expires_in * 1000),
        propertyId: config.propertyId,
      }),
    });

    console.log("[GA] Token refreshed successfully");
    return tokens.access_token;
  } catch (error) {
    console.error("[GA] Token refresh error:", error);
    return null;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ============ STATS ============
  app.get("/api/stats", async (req, res) => {
    try {
      const articles = await storage.getArticles();
      const keywords = await storage.getKeywords();
      
      const publishedArticles = articles.filter(a => a.status === "published").length;
      const draftArticles = articles.filter(a => a.status === "draft").length;
      const avgSeoScore = articles.length > 0 
        ? Math.round(articles.reduce((sum, a) => sum + (a.seoScore || 0), 0) / articles.length)
        : 0;
      
      const totalClicks = keywords.reduce((sum, k) => sum + (k.clicks || 0), 0);
      const totalImpressions = keywords.reduce((sum, k) => sum + (k.impressions || 0), 0);
      const avgPosition = keywords.length > 0
        ? keywords.reduce((sum, k) => sum + (k.currentPosition || 0), 0) / keywords.length
        : 0;

      res.json({
        totalArticles: articles.length,
        publishedArticles,
        draftArticles,
        totalKeywords: keywords.length,
        avgSeoScore,
        totalClicks,
        totalImpressions,
        avgPosition: parseFloat(avgPosition.toFixed(1)),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // ============ ARTICLES ============
  app.get("/api/articles", async (req, res) => {
    try {
      const articles = await storage.getArticles();
      res.json(articles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch articles" });
    }
  });

  app.get("/api/articles/:id", async (req, res) => {
    try {
      const article = await storage.getArticle(req.params.id);
      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }
      res.json(article);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch article" });
    }
  });

  app.post("/api/articles", async (req, res) => {
    try {
      const parsed = insertArticleSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid article data", details: parsed.error });
      }
      
      // Handle duplicate titles by adding timestamp suffix if needed
      let title = parsed.data.title;
      let slug = parsed.data.slug || title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      
      // Check if an article with this title already exists
      const existingArticles = await storage.getArticles();
      const titleExists = existingArticles.some(a => a.title === title);
      
      if (titleExists) {
        // Add timestamp to make title unique
        const timestamp = new Date().toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        title = `${title} (${timestamp})`;
        slug = title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      }
      
      const article = await storage.createArticle({
        ...parsed.data,
        title,
        slug,
      });
      res.status(201).json(article);
    } catch (error) {
      res.status(500).json({ error: "Failed to create article" });
    }
  });

  app.patch("/api/articles/:id", async (req, res) => {
    try {
      const article = await storage.updateArticle(req.params.id, req.body);
      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }
      res.json(article);
    } catch (error) {
      res.status(500).json({ error: "Failed to update article" });
    }
  });

  app.delete("/api/articles/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteArticle(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Article not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete article" });
    }
  });

  // ============ KEYWORDS ============
  app.get("/api/keywords", async (req, res) => {
    try {
      const keywords = await storage.getKeywords();
      res.json(keywords);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch keywords" });
    }
  });

  app.get("/api/keywords/stats", async (req, res) => {
    try {
      const keywords = await storage.getKeywords();
      const totalClicks = keywords.reduce((sum, k) => sum + (k.clicks || 0), 0);
      const totalImpressions = keywords.reduce((sum, k) => sum + (k.impressions || 0), 0);
      const avgPosition = keywords.length > 0
        ? keywords.reduce((sum, k) => sum + (k.currentPosition || 0), 0) / keywords.length
        : 0;

      res.json({
        totalKeywords: keywords.length,
        totalClicks,
        totalImpressions,
        avgPosition: parseFloat(avgPosition.toFixed(1)),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch keyword stats" });
    }
  });

  app.post("/api/keywords", async (req, res) => {
    try {
      const { keyword } = req.body;
      if (!keyword) {
        return res.status(400).json({ error: "Keyword is required" });
      }
      
      const newKeyword = await storage.createKeyword({
        keyword,
        volume: null,
        difficulty: null,
        currentPosition: null,
        previousPosition: null,
        url: null,
        clicks: 0,
        impressions: 0,
        ctr: null,
      });
      res.status(201).json(newKeyword);
    } catch (error) {
      res.status(500).json({ error: "Failed to create keyword" });
    }
  });

  app.post("/api/keywords/sync", async (req, res) => {
    try {
      const gscIntegration = await storage.getIntegration("gsc");
      
      if (!gscIntegration || gscIntegration.status !== "connected") {
        return res.status(400).json({ 
          error: "Google Search Console not connected",
          message: "Please connect Google Search Console in the Integrations page to sync keywords.",
          requiresConnection: true
        });
      }

      // TODO: Implement actual GSC API call to fetch search queries
      return res.status(501).json({ 
        error: "GSC API integration pending",
        message: "Google Search Console API integration is being set up."
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to sync keywords" });
    }
  });

  // ============ PERFORMANCE (GSC Data) ============
  app.get("/api/performance/stats", async (req, res) => {
    try {
      const gscIntegration = await storage.getIntegration("gsc");
      
      if (!gscIntegration || gscIntegration.status !== "connected") {
        return res.status(400).json({ 
          error: "Google Search Console not connected",
          message: "Please connect Google Search Console in the Integrations page to view performance stats.",
          requiresConnection: true
        });
      }

      const config = (gscIntegration.config || {}) as { accessToken?: string; refreshToken?: string; expiresAt?: number };
      if (!config.accessToken) {
        return res.status(400).json({ 
          error: "GSC tokens missing",
          message: "Please reconnect Google Search Console.",
          requiresConnection: true
        });
      }

      // Get date range (last 30 days)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const formatDate = (d: Date) => d.toISOString().split('T')[0];

      // Call GSC API for aggregate stats (no dimensions = totals)
      const gscResponse = await fetch(
        "https://www.googleapis.com/webmasters/v3/sites/https%3A%2F%2Fwww.psychicsource.com%2F/searchAnalytics/query",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${config.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            startDate: formatDate(startDate),
            endDate: formatDate(endDate),
            rowLimit: 1,
          }),
        }
      );

      if (!gscResponse.ok) {
        const errorText = await gscResponse.text();
        console.error("GSC API error (stats):", errorText);
        return res.status(gscResponse.status).json({ 
          error: "GSC API error",
          message: `Failed to fetch stats: ${errorText}`
        });
      }

      const gscData = await gscResponse.json();
      const row = gscData.rows?.[0] || {};

      res.json({
        totalClicks: row.clicks || 0,
        totalImpressions: row.impressions || 0,
        avgCtr: parseFloat(((row.ctr || 0) * 100).toFixed(2)),
        avgPosition: parseFloat((row.position || 0).toFixed(1)),
      });
    } catch (error) {
      console.error("Performance stats error:", error);
      res.status(500).json({ error: "Failed to fetch performance stats" });
    }
  });

  app.get("/api/performance/chart", async (req, res) => {
    try {
      // Use auto-refresh token function
      const accessToken = await getValidGSCToken();
      
      if (!accessToken) {
        return res.status(400).json({ 
          error: "Google Search Console not connected",
          message: "Please connect Google Search Console in the Integrations page to view performance data.",
          requiresConnection: true
        });
      }

      // Get date range (last 30 days by default)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const formatDate = (d: Date) => d.toISOString().split('T')[0];

      // Call Google Search Console API
      const gscResponse = await fetch(
        "https://www.googleapis.com/webmasters/v3/sites/https%3A%2F%2Fwww.psychicsource.com%2F/searchAnalytics/query",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            startDate: formatDate(startDate),
            endDate: formatDate(endDate),
            dimensions: ["date"],
            rowLimit: 30,
          }),
        }
      );

      if (!gscResponse.ok) {
        const errorText = await gscResponse.text();
        console.error("GSC API error:", errorText);
        
        return res.status(gscResponse.status).json({ 
          error: "GSC API error",
          message: `Failed to fetch data from Google Search Console: ${errorText}`
        });
      }

      const gscData = await gscResponse.json();
      
      // Transform GSC response to chart format
      const chartData = (gscData.rows || []).map((row: any) => ({
        date: row.keys[0],
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: (row.ctr || 0) * 100,
        position: row.position || 0,
      }));

      res.json(chartData);
    } catch (error) {
      console.error("Performance chart error:", error);
      res.status(500).json({ error: "Failed to fetch chart data" });
    }
  });

  app.get("/api/performance/top-pages", async (req, res) => {
    try {
      // Use auto-refresh token function
      const accessToken = await getValidGSCToken();
      
      if (!accessToken) {
        return res.status(400).json({ 
          error: "Google Search Console not connected",
          message: "Please connect Google Search Console in the Integrations page to view top pages.",
          requiresConnection: true
        });
      }

      // Get date range (last 30 days)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const formatDate = (d: Date) => d.toISOString().split('T')[0];

      // Call GSC API for top pages
      const gscResponse = await fetch(
        "https://www.googleapis.com/webmasters/v3/sites/https%3A%2F%2Fwww.psychicsource.com%2F/searchAnalytics/query",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            startDate: formatDate(startDate),
            endDate: formatDate(endDate),
            dimensions: ["page"],
            rowLimit: 10,
          }),
        }
      );

      if (!gscResponse.ok) {
        const errorText = await gscResponse.text();
        console.error("GSC API error (top-pages):", errorText);
        return res.status(gscResponse.status).json({ 
          error: "GSC API error",
          message: `Failed to fetch top pages: ${errorText}`
        });
      }

      const gscData = await gscResponse.json();
      
      const topPages = (gscData.rows || []).map((row: any) => ({
        url: row.keys[0],
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: (row.ctr || 0) * 100,
        position: row.position || 0,
      }));

      res.json(topPages);
    } catch (error) {
      console.error("Top pages error:", error);
      res.status(500).json({ error: "Failed to fetch top pages" });
    }
  });

  // ============ ANALYTICS (GA Data) ============
  app.get("/api/analytics", async (req, res) => {
    try {
      const gaIntegration = await storage.getIntegration("ga");
      
      if (!gaIntegration) {
        return res.status(400).json({ 
          error: "Google Analytics not configured",
          message: "Please connect Google Analytics in the Integrations page.",
          requiresConnection: true
        });
      }

      if (gaIntegration.status !== "connected") {
        return res.status(400).json({ 
          error: "Google Analytics not connected",
          message: "Please connect Google Analytics in the Integrations page.",
          requiresConnection: true
        });
      }

      const config = (gaIntegration.config || {}) as { 
        accessToken?: string; 
        refreshToken?: string;
        propertyId?: string;
      };

      if (!config.propertyId) {
        return res.status(400).json({ 
          error: "GA Property ID not set",
          message: "Please set your GA4 Property ID in the Integrations page.",
          needsPropertyId: true
        });
      }

      // Get valid access token (with auto-refresh)
      const accessToken = await getValidGAToken();
      if (!accessToken) {
        return res.status(401).json({ 
          error: "Google Analytics authentication failed",
          message: "Please reconnect Google Analytics.",
          requiresConnection: true
        });
      }

      // Parse date range from query
      const dateRange = (req.query.dateRange as string) || "30d";
      const days = parseInt(dateRange.replace("d", ""), 10) || 30;

      // Use the access token directly with fetch for GA4 Data API
      const propertyId = config.propertyId;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const endDate = new Date();
      
      const formatDate = (d: Date) => d.toISOString().split("T")[0];

      // Fetch main metrics
      const metricsResponse = await fetch(
        `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dateRanges: [{ startDate: formatDate(startDate), endDate: formatDate(endDate) }],
            metrics: [
              { name: "screenPageViews" },
              { name: "totalUsers" },
              { name: "bounceRate" },
              { name: "averageSessionDuration" },
            ],
          }),
        }
      );

      if (!metricsResponse.ok) {
        const errorText = await metricsResponse.text();
        console.error("[GA] Metrics API error:", errorText);
        return res.status(metricsResponse.status).json({ 
          error: "GA API error",
          message: `Failed to fetch analytics: ${errorText}`
        });
      }

      const metricsData = await metricsResponse.json();
      const metricValues = metricsData.rows?.[0]?.metricValues || [];
      
      const pageViews = parseInt(metricValues[0]?.value || "0", 10);
      const uniqueVisitors = parseInt(metricValues[1]?.value || "0", 10);
      const bounceRate = parseFloat(metricValues[2]?.value || "0") * 100;
      const avgSessionSeconds = parseFloat(metricValues[3]?.value || "0");
      const avgSessionMinutes = Math.floor(avgSessionSeconds / 60);
      const avgSessionSecs = Math.floor(avgSessionSeconds % 60);
      const avgSessionDuration = `${avgSessionMinutes}:${avgSessionSecs.toString().padStart(2, "0")}`;

      // Fetch top pages
      const pagesResponse = await fetch(
        `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dateRanges: [{ startDate: formatDate(startDate), endDate: formatDate(endDate) }],
            dimensions: [{ name: "pagePath" }],
            metrics: [{ name: "screenPageViews" }],
            limit: 10,
            orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
          }),
        }
      );

      let topPages: { page: string; views: number }[] = [];
      if (pagesResponse.ok) {
        const pagesData = await pagesResponse.json();
        topPages = (pagesData.rows || []).map((row: any) => ({
          page: row.dimensionValues?.[0]?.value || "/",
          views: parseInt(row.metricValues?.[0]?.value || "0", 10),
        }));
      }

      // Fetch traffic sources
      const sourcesResponse = await fetch(
        `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dateRanges: [{ startDate: formatDate(startDate), endDate: formatDate(endDate) }],
            dimensions: [{ name: "sessionSource" }],
            metrics: [{ name: "sessions" }],
            limit: 5,
            orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
          }),
        }
      );

      let trafficSources: { source: string; value: number }[] = [];
      if (sourcesResponse.ok) {
        const sourcesData = await sourcesResponse.json();
        trafficSources = (sourcesData.rows || []).map((row: any) => ({
          source: row.dimensionValues?.[0]?.value || "Unknown",
          value: parseInt(row.metricValues?.[0]?.value || "0", 10),
        }));
      }

      // Fetch daily chart data
      const chartResponse = await fetch(
        `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dateRanges: [{ startDate: formatDate(startDate), endDate: formatDate(endDate) }],
            dimensions: [{ name: "date" }],
            metrics: [
              { name: "screenPageViews" },
              { name: "totalUsers" },
            ],
            orderBys: [{ dimension: { dimensionName: "date" }, desc: false }],
          }),
        }
      );

      let chartData: { date: string; views: number; visitors: number }[] = [];
      if (chartResponse.ok) {
        const chartRawData = await chartResponse.json();
        chartData = (chartRawData.rows || []).map((row: any) => {
          const dateStr = row.dimensionValues?.[0]?.value || "";
          const formattedDate = dateStr.length === 8 
            ? `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
            : dateStr;
          return {
            date: formattedDate,
            views: parseInt(row.metricValues?.[0]?.value || "0", 10),
            visitors: parseInt(row.metricValues?.[1]?.value || "0", 10),
          };
        });
      }

      // Update last sync time
      await storage.upsertIntegration({
        name: "ga",
        status: "connected",
        lastSync: new Date().toISOString(),
        config: JSON.stringify(config),
      });

      res.json({
        pageViews,
        uniqueVisitors,
        bounceRate: Math.round(bounceRate * 10) / 10,
        avgSessionDuration,
        topPages,
        trafficSources,
        chartData,
      });
    } catch (error) {
      console.error("[GA] Analytics error:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // ============ CONTENT ANALYSIS ============
  app.post("/api/content/analyze", async (req, res) => {
    try {
      const { content, targetKeyword } = req.body;
      
      if (!content) {
        return res.status(400).json({ error: "Content is required" });
      }

      // Calculate basic metrics
      const wordCount = content.split(/\s+/).filter(Boolean).length;
      const sentences = content.split(/[.!?]+/).filter(Boolean);
      const avgWordsPerSentence = wordCount / (sentences.length || 1);
      
      // Simple readability calculation
      const readabilityScore = Math.min(100, Math.max(0, 
        100 - Math.abs(avgWordsPerSentence - 15) * 3
      ));

      // SEO score based on various factors
      let seoScore = 50;
      
      // Keyword presence
      if (targetKeyword && content.toLowerCase().includes(targetKeyword.toLowerCase())) {
        seoScore += 15;
      }
      
      // Word count optimization
      if (wordCount >= 1000) seoScore += 10;
      if (wordCount >= 2000) seoScore += 5;
      
      // Heading structure
      const h1Count = (content.match(/^#\s/gm) || []).length;
      const h2Count = (content.match(/^##\s/gm) || []).length;
      const h3Count = (content.match(/^###\s/gm) || []).length;
      
      if (h1Count === 1) seoScore += 5;
      if (h2Count >= 2) seoScore += 5;
      if (h3Count >= 1) seoScore += 5;
      
      // Calculate keyword density
      const keywordDensity = targetKeyword 
        ? ((content.toLowerCase().split(targetKeyword.toLowerCase()).length - 1) / wordCount * 100)
        : 0;
      
      if (keywordDensity >= 0.5 && keywordDensity <= 2.5) seoScore += 5;

      const optimization: ContentOptimizationResult = {
        seoScore: Math.min(100, seoScore),
        readabilityScore: Math.round(readabilityScore),
        wordCount,
        keywordDensity: parseFloat(keywordDensity.toFixed(2)),
        headingStructure: { h1: h1Count, h2: h2Count, h3: h3Count },
        suggestions: [],
      };

      // Generate suggestions
      const suggestions: Partial<ContentSuggestion>[] = [];
      
      if (wordCount < 1000) {
        suggestions.push({
          type: "structure",
          suggestion: `Content is ${wordCount} words. Consider expanding to at least 1,000 words for better SEO performance.`,
          priority: "high",
          applied: false,
        });
      }
      
      if (targetKeyword && keywordDensity < 0.5) {
        suggestions.push({
          type: "keyword",
          suggestion: `Target keyword "${targetKeyword}" density is low (${keywordDensity.toFixed(1)}%). Try including it 2-3 more times naturally.`,
          priority: "medium",
          applied: false,
        });
      }
      
      if (h1Count === 0) {
        suggestions.push({
          type: "structure",
          suggestion: "Add a main heading (H1) at the beginning of your content.",
          priority: "high",
          applied: false,
        });
      }
      
      if (h2Count < 2) {
        suggestions.push({
          type: "structure",
          suggestion: "Add more subheadings (H2) to break up your content and improve readability.",
          priority: "medium",
          applied: false,
        });
      }
      
      if (avgWordsPerSentence > 25) {
        suggestions.push({
          type: "readability",
          suggestion: "Your sentences are quite long. Try breaking them into shorter, more digestible sentences.",
          priority: "low",
          applied: false,
        });
      }

      res.json({
        optimization,
        suggestions: suggestions.map((s, i) => ({ ...s, id: `suggestion-${i}` })),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to analyze content" });
    }
  });

  // ============ CONTENT AUDIT ============
  app.get("/api/content/audit", async (req, res) => {
    try {
      const articles = await storage.getArticles();
      const now = new Date();
      
      const auditItems = articles
        .map(article => {
          const issues: { type: string; description: string; priority: "high" | "medium" | "low" }[] = [];
          const updatedAt = new Date(article.updatedAt);
          const daysOld = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));
          
          // Check for outdated content
          if (daysOld > 90) {
            issues.push({
              type: "outdated",
              description: `Content hasn't been updated in ${daysOld} days`,
              priority: daysOld > 180 ? "high" : "medium",
            });
          }
          
          // Check for low SEO score
          if (article.seoScore && article.seoScore < 60) {
            issues.push({
              type: "low_seo_score",
              description: `SEO score is ${article.seoScore}/100`,
              priority: article.seoScore < 40 ? "high" : "medium",
            });
          }
          
          // Check for missing meta data
          if (!article.metaTitle || !article.metaDescription) {
            issues.push({
              type: "missing_keywords",
              description: "Missing meta title or description",
              priority: "medium",
            });
          }
          
          // Check for low word count
          if (article.wordCount && article.wordCount < 500) {
            issues.push({
              type: "low_performance",
              description: `Word count is only ${article.wordCount}`,
              priority: "low",
            });
          }

          return {
            article,
            issues,
            lastUpdated: article.updatedAt,
            daysOld,
          };
        })
        .filter(item => item.issues.length > 0)
        .sort((a, b) => {
          const aHighPriority = a.issues.some(i => i.priority === "high");
          const bHighPriority = b.issues.some(i => i.priority === "high");
          if (aHighPriority && !bHighPriority) return -1;
          if (!aHighPriority && bHighPriority) return 1;
          return b.daysOld - a.daysOld;
        });

      res.json(auditItems);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch content audit" });
    }
  });

  app.post("/api/content/audit/refresh", async (req, res) => {
    try {
      res.json({ success: true, message: "Content audit refreshed" });
    } catch (error) {
      res.status(500).json({ error: "Failed to refresh audit" });
    }
  });

  // ============ INTEGRATIONS ============
  app.get("/api/integrations", async (req, res) => {
    try {
      const integrations = await storage.getIntegrations();
      res.json(integrations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch integrations" });
    }
  });

  // GSC OAuth - Step 1: Get authorization URL
  app.get("/api/integrations/gsc/auth-url", async (req, res) => {
    try {
      const clientId = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID;
      if (!clientId) {
        return res.status(400).json({ 
          error: "Google Search Console not configured",
          message: "GOOGLE_SEARCH_CONSOLE_CLIENT_ID is not set in environment variables."
        });
      }

      // Generate state for CSRF protection
      const state = crypto.randomBytes(32).toString("hex");
      oauthStates.set(state, { timestamp: Date.now() });

      // Clean up old states (older than 10 minutes)
      const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
      for (const [key, value] of oauthStates.entries()) {
        if (value.timestamp < tenMinutesAgo) {
          oauthStates.delete(key);
        }
      }

      // Use x-forwarded-proto header for proper HTTPS detection behind reverse proxy
      const protocol = req.get("x-forwarded-proto") || req.protocol;
      const redirectUri = `${protocol}://${req.get("host")}/api/integrations/gsc/callback`;
      
      const authUrl = new URL(GOOGLE_AUTH_URL);
      authUrl.searchParams.set("client_id", clientId);
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", GSC_SCOPES.join(" "));
      authUrl.searchParams.set("access_type", "offline");
      authUrl.searchParams.set("prompt", "consent");
      authUrl.searchParams.set("state", state);

      res.json({ authUrl: authUrl.toString() });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate auth URL" });
    }
  });

  // GSC OAuth - Step 2: Handle callback
  app.get("/api/integrations/gsc/callback", async (req, res) => {
    try {
      const { code, state, error: oauthError } = req.query;

      if (oauthError) {
        return res.redirect(`/integrations?error=${encodeURIComponent(oauthError as string)}`);
      }

      if (!code || !state) {
        return res.redirect("/integrations?error=Missing+code+or+state");
      }

      // Verify state
      if (!oauthStates.has(state as string)) {
        return res.redirect("/integrations?error=Invalid+state+parameter");
      }
      oauthStates.delete(state as string);

      const clientId = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET;
      
      if (!clientId || !clientSecret) {
        return res.redirect("/integrations?error=OAuth+credentials+not+configured");
      }

      // Use x-forwarded-proto header for proper HTTPS detection behind reverse proxy
      const protocol = req.get("x-forwarded-proto") || req.protocol;
      const redirectUri = `${protocol}://${req.get("host")}/api/integrations/gsc/callback`;

      // Exchange code for tokens
      const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: code as string,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        console.error("Token exchange failed:", errorData);
        return res.redirect("/integrations?error=Token+exchange+failed");
      }

      const tokens = await tokenResponse.json();

      // Store tokens in integration config
      await storage.upsertIntegration({
        name: "gsc",
        status: "connected",
        lastSync: new Date().toISOString(),
        config: JSON.stringify({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: Date.now() + (tokens.expires_in * 1000),
        }),
      });

      res.redirect("/integrations?success=Google+Search+Console+connected");
    } catch (error) {
      console.error("OAuth callback error:", error);
      res.redirect("/integrations?error=OAuth+callback+failed");
    }
  });

  // GA OAuth - Step 1: Get authorization URL
  app.get("/api/integrations/ga/auth-url", async (req, res) => {
    try {
      const clientId = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID;
      if (!clientId) {
        return res.status(400).json({ 
          error: "Google OAuth not configured",
          message: "GOOGLE_SEARCH_CONSOLE_CLIENT_ID is not set in environment variables."
        });
      }

      const state = crypto.randomBytes(32).toString("hex");
      oauthStates.set(state, { timestamp: Date.now() });

      const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
      for (const [key, value] of oauthStates.entries()) {
        if (value.timestamp < tenMinutesAgo) {
          oauthStates.delete(key);
        }
      }

      const protocol = req.get("x-forwarded-proto") || req.protocol;
      const redirectUri = `${protocol}://${req.get("host")}/api/integrations/ga/callback`;
      
      const authUrl = new URL(GOOGLE_AUTH_URL);
      authUrl.searchParams.set("client_id", clientId);
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", GA_SCOPES.join(" "));
      authUrl.searchParams.set("access_type", "offline");
      authUrl.searchParams.set("prompt", "consent");
      authUrl.searchParams.set("state", state);

      res.json({ authUrl: authUrl.toString() });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate auth URL" });
    }
  });

  // GA OAuth - Step 2: Handle callback
  app.get("/api/integrations/ga/callback", async (req, res) => {
    try {
      const { code, state, error: oauthError, propertyId } = req.query;

      if (oauthError) {
        return res.redirect(`/integrations?error=${encodeURIComponent(oauthError as string)}`);
      }

      if (!code || !state) {
        return res.redirect("/integrations?error=Missing+code+or+state");
      }

      if (!oauthStates.has(state as string)) {
        return res.redirect("/integrations?error=Invalid+state+parameter");
      }
      oauthStates.delete(state as string);

      const clientId = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET;
      
      if (!clientId || !clientSecret) {
        return res.redirect("/integrations?error=OAuth+credentials+not+configured");
      }

      const protocol = req.get("x-forwarded-proto") || req.protocol;
      const redirectUri = `${protocol}://${req.get("host")}/api/integrations/ga/callback`;

      const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: code as string,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        console.error("GA Token exchange failed:", errorData);
        return res.redirect("/integrations?error=Token+exchange+failed");
      }

      const tokens = await tokenResponse.json();

      // Store tokens - user will need to provide property ID later
      await storage.upsertIntegration({
        name: "ga",
        status: "connected",
        lastSync: new Date().toISOString(),
        config: JSON.stringify({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: Date.now() + (tokens.expires_in * 1000),
          propertyId: null, // User will need to set this
        }),
      });

      res.redirect("/integrations?success=Google+Analytics+connected&needsPropertyId=true");
    } catch (error) {
      console.error("GA OAuth callback error:", error);
      res.redirect("/integrations?error=OAuth+callback+failed");
    }
  });

  // GA - Set property ID
  app.post("/api/integrations/ga/property", async (req, res) => {
    try {
      const { propertyId } = req.body;
      
      if (!propertyId) {
        return res.status(400).json({ error: "Property ID is required" });
      }

      const cleanPropertyId = String(propertyId).replace(/\D/g, "");
      if (cleanPropertyId.length < 6) {
        return res.status(400).json({ error: "Property ID must be a numeric value with at least 6 digits" });
      }

      const gaIntegration = await storage.getIntegration("ga");
      if (!gaIntegration || gaIntegration.status !== "connected") {
        return res.status(400).json({ error: "Google Analytics not connected. Please connect first." });
      }

      const config = (gaIntegration.config || {}) as any;
      
      await storage.upsertIntegration({
        name: "ga",
        status: "connected",
        lastSync: new Date().toISOString(),
        config: JSON.stringify({
          ...config,
          propertyId: cleanPropertyId,
        }),
      });

      res.json({ success: true, message: "Property ID saved" });
    } catch (error) {
      res.status(500).json({ error: "Failed to save property ID" });
    }
  });

  app.post("/api/integrations/:name/connect", async (req, res) => {
    try {
      const { name } = req.params;
      
      if (name === "gsc") {
        // For GSC, return the auth URL instead of connecting directly
        const clientId = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID;
        if (!clientId) {
          return res.status(400).json({ 
            error: "Google Search Console not configured",
            message: "GOOGLE_SEARCH_CONSOLE_CLIENT_ID is not set. Please add it to your secrets."
          });
        }
        
        // Generate auth URL and return it
        const state = crypto.randomBytes(32).toString("hex");
        oauthStates.set(state, { timestamp: Date.now() });
        
        // Use x-forwarded-proto header for proper HTTPS detection behind reverse proxy
        const protocol = req.get("x-forwarded-proto") || req.protocol;
        const redirectUri = `${protocol}://${req.get("host")}/api/integrations/gsc/callback`;
        
        const authUrl = new URL(GOOGLE_AUTH_URL);
        authUrl.searchParams.set("client_id", clientId);
        authUrl.searchParams.set("redirect_uri", redirectUri);
        authUrl.searchParams.set("response_type", "code");
        authUrl.searchParams.set("scope", GSC_SCOPES.join(" "));
        authUrl.searchParams.set("access_type", "offline");
        authUrl.searchParams.set("prompt", "consent");
        authUrl.searchParams.set("state", state);
        
        return res.json({ 
          requiresOAuth: true,
          authUrl: authUrl.toString(),
          message: "Please complete the OAuth flow to connect Google Search Console."
        });
      } else if (name === "ga") {
        // GA Data API requires OAuth
        const clientId = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID;
        if (!clientId) {
          return res.status(400).json({ 
            error: "Google OAuth not configured",
            message: "GOOGLE_SEARCH_CONSOLE_CLIENT_ID is not set. Please add it to your secrets."
          });
        }
        
        // Generate auth URL and return it
        const state = crypto.randomBytes(32).toString("hex");
        oauthStates.set(state, { timestamp: Date.now() });
        
        const protocol = req.get("x-forwarded-proto") || req.protocol;
        const redirectUri = `${protocol}://${req.get("host")}/api/integrations/ga/callback`;
        
        const authUrl = new URL(GOOGLE_AUTH_URL);
        authUrl.searchParams.set("client_id", clientId);
        authUrl.searchParams.set("redirect_uri", redirectUri);
        authUrl.searchParams.set("response_type", "code");
        authUrl.searchParams.set("scope", GA_SCOPES.join(" "));
        authUrl.searchParams.set("access_type", "offline");
        authUrl.searchParams.set("prompt", "consent");
        authUrl.searchParams.set("state", state);
        
        return res.json({ 
          requiresOAuth: true,
          authUrl: authUrl.toString(),
          message: "Please complete the OAuth flow to connect Google Analytics."
        });
      } else {
        res.status(404).json({ error: "Unknown integration" });
      }
    } catch (error) {
      console.error("Connect integration error:", error);
      res.status(500).json({ error: "Failed to connect integration" });
    }
  });

  app.post("/api/integrations/:name/disconnect", async (req, res) => {
    try {
      const { name } = req.params;
      
      await storage.upsertIntegration({
        name,
        status: "disconnected",
        lastSync: null,
        config: null,
      });
      
      res.json({ success: true, message: `Disconnected from ${name}` });
    } catch (error) {
      res.status(500).json({ error: "Failed to disconnect integration" });
    }
  });

  app.post("/api/integrations/:name/sync", async (req, res) => {
    try {
      const { name } = req.params;
      
      // Simulate sync operation
      await storage.upsertIntegration({
        name,
        status: "connected",
        lastSync: new Date().toISOString(),
        config: null,
      });
      
      res.json({ success: true, message: `Synced ${name} data` });
    } catch (error) {
      res.status(500).json({ error: "Failed to sync integration" });
    }
  });

  // Writing Styles endpoints
  app.get("/api/writing-styles", async (req, res) => {
    try {
      const styles = await storage.getWritingStyles();
      res.json(styles);
    } catch (error) {
      console.error("Error fetching writing styles:", error);
      res.status(500).json({ error: "Failed to fetch writing styles" });
    }
  });

  app.get("/api/writing-styles/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const style = await storage.getWritingStyle(id);
      if (!style) {
        return res.status(404).json({ error: "Writing style not found" });
      }
      res.json(style);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch writing style" });
    }
  });

  app.post("/api/writing-styles", async (req, res) => {
    try {
      const style = await storage.createWritingStyle(req.body);
      res.status(201).json(style);
    } catch (error) {
      console.error("Error creating writing style:", error);
      res.status(500).json({ error: "Failed to create writing style" });
    }
  });

  app.patch("/api/writing-styles/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const style = await storage.updateWritingStyle(id, req.body);
      if (!style) {
        return res.status(404).json({ error: "Writing style not found" });
      }
      res.json(style);
    } catch (error) {
      res.status(500).json({ error: "Failed to update writing style" });
    }
  });

  app.delete("/api/writing-styles/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteWritingStyle(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete writing style" });
    }
  });

  // Optimization Prompts endpoints
  app.get("/api/optimization-prompts", async (req, res) => {
    try {
      const prompts = await storage.getOptimizationPrompts();
      res.json(prompts);
    } catch (error) {
      console.error("Error fetching optimization prompts:", error);
      res.status(500).json({ error: "Failed to fetch optimization prompts" });
    }
  });

  app.get("/api/optimization-prompts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const prompt = await storage.getOptimizationPrompt(id);
      if (!prompt) {
        return res.status(404).json({ error: "Optimization prompt not found" });
      }
      res.json(prompt);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch optimization prompt" });
    }
  });

  app.post("/api/optimization-prompts", async (req, res) => {
    try {
      const prompt = await storage.createOptimizationPrompt(req.body);
      res.status(201).json(prompt);
    } catch (error) {
      console.error("Error creating optimization prompt:", error);
      res.status(500).json({ error: "Failed to create optimization prompt" });
    }
  });

  app.patch("/api/optimization-prompts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const prompt = await storage.updateOptimizationPrompt(id, req.body);
      if (!prompt) {
        return res.status(404).json({ error: "Optimization prompt not found" });
      }
      res.json(prompt);
    } catch (error) {
      res.status(500).json({ error: "Failed to update optimization prompt" });
    }
  });

  app.delete("/api/optimization-prompts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteOptimizationPrompt(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete optimization prompt" });
    }
  });

  // SEO Settings endpoints
  app.get("/api/seo-settings", async (req, res) => {
    try {
      const settings = await storage.getSeoSettings();
      res.json(settings || {
        metaTitleGuidelines: "Include primary keyword at the beginning. Keep it compelling and under 60 characters.",
        metaTitleMaxLength: 60,
        metaDescriptionGuidelines: "Summarize the page content with a clear call to action. Include primary keyword naturally.",
        metaDescriptionMaxLength: 160,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch SEO settings" });
    }
  });

  app.put("/api/seo-settings", async (req, res) => {
    try {
      const settings = await storage.upsertSeoSettings(req.body);
      res.json(settings);
    } catch (error) {
      console.error("Error saving SEO settings:", error);
      res.status(500).json({ error: "Failed to save SEO settings" });
    }
  });

  // Content Generation with OpenAI
  app.post("/api/content/generate", async (req, res) => {
    try {
      const { targetKeyword, wordCount, recommendedKeywords, suggestedSections, styleId, audienceId, provider = "anthropic" } = req.body;
      
      if (!targetKeyword) {
        return res.status(400).json({ error: "Target keyword is required" });
      }

      // Get writing style if provided
      let styleInstructions = "";
      if (styleId) {
        const style = await storage.getWritingStyle(styleId);
        if (style) {
          styleInstructions = `

CRITICAL WRITING STYLE REQUIREMENTS - YOU MUST FOLLOW THESE EXACTLY:
${style.guidelines || ""}
${style.exampleText ? `

Here is an example of the desired writing style to emulate:
${style.exampleText}` : ""}`;
        }
      }

      // Get target audience if provided
      let audienceInstructions = "";
      if (audienceId) {
        const audience = await storage.getTargetAudience(audienceId);
        if (audience) {
          audienceInstructions = `

TARGET AUDIENCE - Tailor your content specifically for this audience:
Audience: ${audience.name}
${audience.description ? `Description: ${audience.description}` : ""}
${audience.demographics ? `Demographics: ${audience.demographics}` : ""}
${audience.painPoints ? `Pain Points to Address: ${audience.painPoints}` : ""}
${audience.goals ? `Goals They Want to Achieve: ${audience.goals}` : ""}
${audience.tone ? `Preferred Tone: ${audience.tone}` : ""}

Write content that resonates with this audience, addressing their specific needs and using language that connects with them.`;
        }
      }

      // Build keywords and sections instructions
      let keywordsList = "";
      if (recommendedKeywords?.length) {
        keywordsList = `Include these related keywords/phrases naturally throughout the content: ${recommendedKeywords.join(", ")}`;
      }
      
      let sectionsGuidance = "";
      if (suggestedSections?.length) {
        sectionsGuidance = `

SUGGESTED CONTENT SECTIONS (use these as a guide for article structure):
${suggestedSections.map((s: string, i: number) => `${i + 1}. ${s}`).join("\n")}

Create dedicated sections for each of these topics, using them as H2 headings where appropriate.`;
      }

      const targetWordCount = wordCount || 1500;
      
      const systemPrompt = `You are an expert SEO content writer for Psychic Source, a spiritual wellness and psychic reading website.

ABSOLUTE RULES - VIOLATION OF THESE WILL RESULT IN REJECTION:

1. OUTPUT FORMAT: Write ONLY clean HTML. 
   - Use <h1>, <h2>, <h3> tags for headings - NEVER use markdown # or ### symbols
   - Use <p> tags for paragraphs
   - Use <ul>/<li> for lists
   - NEVER wrap output in code blocks or backticks
   - NEVER start with \`\`\`html or end with \`\`\`
   - Output raw HTML directly with no wrappers

2. WORD COUNT: You MUST write EXACTLY ${targetWordCount} words. This is a strict, non-negotiable requirement.
   - Plan your article structure to hit this target precisely
   - If I ask for 1500 words, write 1500 words - not 800, not 2500
   - Count words carefully as you write
${styleInstructions}${audienceInstructions}`;

      const userPrompt = `Write a comprehensive SEO-optimized article about "${targetKeyword}".

REQUIREMENTS:
- Primary keyword: "${targetKeyword}" - use naturally throughout (8-12 times)
${keywordsList ? `- ${keywordsList}` : ""}
- Word count: EXACTLY ${targetWordCount} words (count carefully!)
${sectionsGuidance}

STRUCTURE:
<h1>[Compelling title with keyword]</h1>
<p>[Engaging intro - 100-150 words]</p>
<h2>[Main section 1]</h2>
<p>[Content...]</p>
<h2>[Main section 2]</h2>
<p>[Content...]</p>
[Continue with 4-6 main sections...]
<h2>Conclusion</h2>
<p>[Wrap up - 100-150 words]</p>

Write the complete ${targetWordCount}-word article now. Output clean HTML only:`;

      // Set up SSE for streaming
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Calculate max tokens based on word count (roughly 1.5 tokens per word + buffer for HTML tags)
      const maxTokens = Math.min(16000, Math.max(4096, Math.ceil(targetWordCount * 2)));
      let fullContent = "";

      if (provider === "openai") {
        // Use OpenAI for content generation
        const openai = new OpenAI({
          apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
          baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
        });

        const stream = await openai.chat.completions.create({
          model: "gpt-4o",
          max_tokens: maxTokens,
          stream: true,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
        });

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            fullContent += content;
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
        }
      } else {
        // Use Anthropic Claude for content generation (default)
        const anthropic = new Anthropic({
          apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
          baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
        });

        const stream = anthropic.messages.stream({
          model: "claude-sonnet-4-5",
          max_tokens: maxTokens,
          system: systemPrompt,
          messages: [
            { role: "user", content: userPrompt }
          ],
        });

        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            const content = event.delta.text;
            if (content) {
              fullContent += content;
              res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
          }
        }
      }

      res.write(`data: ${JSON.stringify({ done: true, fullContent })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Content generation error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to generate content" });
      } else {
        res.write(`data: ${JSON.stringify({ error: "Content generation failed" })}\n\n`);
        res.end();
      }
    }
  });

  // Generate meta suggestions
  app.post("/api/content/meta-suggestions", async (req, res) => {
    try {
      const { title, content, targetKeyword } = req.body;
      
      if (!targetKeyword) {
        return res.status(400).json({ error: "Target keyword is required" });
      }

      // Get SEO settings for guidelines
      const seoSettings = await storage.getSeoSettings();
      const titleGuidelines = seoSettings?.metaTitleGuidelines || "Include primary keyword at the beginning. Keep it compelling and under 60 characters.";
      const descGuidelines = seoSettings?.metaDescriptionGuidelines || "Summarize the page content with a clear call to action. Include primary keyword naturally.";
      const titleMaxLen = seoSettings?.metaTitleMaxLength || 60;
      const descMaxLen = seoSettings?.metaDescriptionMaxLength || 160;

      const prompt = `Generate SEO meta tag suggestions for an article.

Article Title: ${title || "Not provided"}
Target Keyword: ${targetKeyword}
Full Article Content:
${content || "Not provided"}

Meta Title Guidelines: ${titleGuidelines}
Maximum title length: ${titleMaxLen} characters

Meta Description Guidelines: ${descGuidelines}
Maximum description length: ${descMaxLen} characters

Generate exactly 5 unique meta titles and 5 unique meta descriptions.

Respond in JSON format:
{
  "titles": ["title1", "title2", "title3", "title4", "title5"],
  "descriptions": ["desc1", "desc2", "desc3", "desc4", "desc5"]
}`;

      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an SEO expert. Generate compelling meta titles and descriptions that drive clicks while following best practices. Always respond with valid JSON."
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 1024,
      });

      const suggestions = JSON.parse(response.choices[0]?.message?.content || '{"titles":[],"descriptions":[]}');
      res.json(suggestions);
    } catch (error) {
      console.error("Meta suggestions error:", error);
      res.status(500).json({ error: "Failed to generate meta suggestions" });
    }
  });

  // ============ IMAGE STYLES ============
  app.get("/api/image-styles", async (req, res) => {
    try {
      const styles = await storage.getImageStyles();
      res.json(styles);
    } catch (error) {
      console.error("Error fetching image styles:", error);
      res.status(500).json({ error: "Failed to fetch image styles" });
    }
  });

  app.get("/api/image-styles/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const style = await storage.getImageStyle(id);
      if (!style) {
        return res.status(404).json({ error: "Image style not found" });
      }
      res.json(style);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch image style" });
    }
  });

  app.post("/api/image-styles", async (req, res) => {
    try {
      const parsed = insertImageStyleSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid image style data", details: parsed.error });
      }
      const style = await storage.createImageStyle(parsed.data);
      res.status(201).json(style);
    } catch (error) {
      console.error("Error creating image style:", error);
      res.status(500).json({ error: "Failed to create image style" });
    }
  });

  app.patch("/api/image-styles/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const style = await storage.updateImageStyle(id, req.body);
      if (!style) {
        return res.status(404).json({ error: "Image style not found" });
      }
      res.json(style);
    } catch (error) {
      res.status(500).json({ error: "Failed to update image style" });
    }
  });

  app.delete("/api/image-styles/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteImageStyle(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete image style" });
    }
  });

  // ============ TARGET AUDIENCES ============
  app.get("/api/target-audiences", async (req, res) => {
    try {
      const audiences = await storage.getTargetAudiences();
      res.json(audiences);
    } catch (error) {
      console.error("Error fetching target audiences:", error);
      res.status(500).json({ error: "Failed to fetch target audiences" });
    }
  });

  app.get("/api/target-audiences/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const audience = await storage.getTargetAudience(id);
      if (!audience) {
        return res.status(404).json({ error: "Target audience not found" });
      }
      res.json(audience);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch target audience" });
    }
  });

  app.post("/api/target-audiences", async (req, res) => {
    try {
      const parsed = insertTargetAudienceSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid target audience data", details: parsed.error });
      }
      const audience = await storage.createTargetAudience(parsed.data);
      res.status(201).json(audience);
    } catch (error) {
      console.error("Error creating target audience:", error);
      res.status(500).json({ error: "Failed to create target audience" });
    }
  });

  app.patch("/api/target-audiences/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const audience = await storage.updateTargetAudience(id, req.body);
      if (!audience) {
        return res.status(404).json({ error: "Target audience not found" });
      }
      res.json(audience);
    } catch (error) {
      res.status(500).json({ error: "Failed to update target audience" });
    }
  });

  app.delete("/api/target-audiences/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTargetAudience(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete target audience" });
    }
  });

  // ============ LINK TABLE COLUMNS (dynamic columns) ============
  app.get("/api/link-table-columns", async (req, res) => {
    try {
      const columns = await storage.getLinkTableColumns();
      res.json(columns);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch columns" });
    }
  });

  app.post("/api/link-table-columns", async (req, res) => {
    try {
      const validated = insertLinkTableColumnSchema.parse(req.body);
      const existingColumns = await storage.getLinkTableColumns();
      const nameExists = existingColumns.some(
        col => col.name.toLowerCase() === validated.name.toLowerCase()
      );
      if (nameExists) {
        return res.status(400).json({ error: "Column name already exists" });
      }
      const column = await storage.createLinkTableColumn(validated);
      res.status(201).json(column);
    } catch (error) {
      console.error("Error creating column:", error);
      res.status(500).json({ error: "Failed to create column" });
    }
  });

  app.patch("/api/link-table-columns/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const column = await storage.updateLinkTableColumn(id, req.body);
      res.json(column);
    } catch (error) {
      res.status(500).json({ error: "Failed to update column" });
    }
  });

  app.delete("/api/link-table-columns/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const rows = await storage.getSiteUrls();
      for (const row of rows) {
        const data = row.data as Record<string, string> | null;
        if (data && id in data) {
          const newData = { ...data };
          delete newData[id];
          await storage.updateSiteUrl(row.id, { data: newData });
        }
      }
      await storage.deleteLinkTableColumn(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete column" });
    }
  });

  // ============ SITE URLS (rows for internal linking) ============
  app.get("/api/site-urls", async (req, res) => {
    try {
      const urls = await storage.getSiteUrls();
      res.json(urls);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch site URLs" });
    }
  });

  app.get("/api/site-urls/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const url = await storage.getSiteUrl(id);
      if (!url) {
        return res.status(404).json({ error: "Site URL not found" });
      }
      res.json(url);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch site URL" });
    }
  });

  app.post("/api/site-urls", async (req, res) => {
    try {
      const validated = insertSiteUrlSchema.parse(req.body);
      const url = await storage.createSiteUrl(validated);
      res.status(201).json(url);
    } catch (error) {
      console.error("Error creating site URL:", error);
      res.status(500).json({ error: "Failed to create site URL" });
    }
  });

  app.patch("/api/site-urls/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const url = await storage.updateSiteUrl(id, req.body);
      res.json(url);
    } catch (error) {
      res.status(500).json({ error: "Failed to update site URL" });
    }
  });

  app.delete("/api/site-urls/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteSiteUrl(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete site URL" });
    }
  });

  // ============ IMAGE GENERATION (Gemini Nano Banana) ============
  app.post("/api/images/generate", async (req, res) => {
    try {
      const { prompt, styleId, imageType, provider = "gemini" } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      // Get image style if provided
      let stylePrompt = "";
      // Use aspectRatio from request body (passed from UI), default to 16:9
      let aspectRatio = req.body.aspectRatio || "16:9";
      if (styleId) {
        const style = await storage.getImageStyle(styleId);
        if (style) {
          stylePrompt = style.stylePrompt || "";
          if (style.additionalInstructions) {
            stylePrompt += " " + style.additionalInstructions;
          }
        }
      }

      const fullPrompt = stylePrompt 
        ? `${prompt}. Style: ${stylePrompt}. Aspect ratio: ${aspectRatio}`
        : `${prompt}. Aspect ratio: ${aspectRatio}`;

      // Check if S3 is configured
      const s3Configured = !!(process.env.AWS_S3_BUCKET && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

      if (provider === "openai") {
        // Use OpenAI gpt-image-1 for image generation
        const openai = new OpenAI({
          apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
          baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
        });

        // Map aspect ratio to OpenAI size
        let size: "1024x1024" | "1536x1024" | "1024x1536" = "1024x1024";
        if (aspectRatio === "16:9") {
          size = "1536x1024";
        } else if (aspectRatio === "9:16") {
          size = "1024x1536";
        }

        const response = await openai.images.generate({
          model: "gpt-image-1",
          prompt: fullPrompt,
          n: 1,
          size: size,
        });

        const imageData = response.data?.[0]?.b64_json;
        if (!imageData) {
          return res.status(500).json({ error: "No image data in OpenAI response" });
        }

        // Upload to S3 if configured
        if (s3Configured) {
          try {
            const { uploadImageToS3 } = await import("./s3");
            const s3Url = await uploadImageToS3(imageData, undefined, "image/png");
            console.log("[Image Generation] Uploaded to S3:", s3Url);
            return res.json({
              imageData: s3Url,
              imageUrl: s3Url,
              imageType: imageType || "featured",
              provider: "openai",
              storage: "s3",
            });
          } catch (s3Error) {
            console.error("[Image Generation] S3 upload failed, returning base64:", s3Error);
          }
        }

        res.json({
          imageData: `data:image/png;base64,${imageData}`,
          imageType: imageType || "featured",
          provider: "openai",
          storage: "base64",
        });
      } else {
        // Use Gemini for image generation (default)
        const { GoogleGenAI } = await import("@google/genai");
        
        const ai = new GoogleGenAI({
          apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
          httpOptions: {
            apiVersion: "",
            baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
          },
        });

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-image",
          contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
          config: {
            responseModalities: ["TEXT", "IMAGE"],
            imageConfig: {
              aspectRatio: aspectRatio || "16:9",
            },
          } as any,
        });

        const candidate = response.candidates?.[0];
        const imagePart = candidate?.content?.parts?.find(
          (part: any) => part.inlineData
        );

        if (!imagePart?.inlineData?.data) {
          return res.status(500).json({ error: "No image data in response" });
        }

        const mimeType = imagePart.inlineData.mimeType || "image/png";
        const base64Data = imagePart.inlineData.data;

        // Upload to S3 if configured
        if (s3Configured) {
          try {
            const { uploadImageToS3 } = await import("./s3");
            const extension = mimeType.includes("jpeg") ? "jpg" : "png";
            const s3Url = await uploadImageToS3(base64Data, undefined, mimeType);
            console.log("[Image Generation] Uploaded to S3:", s3Url);
            return res.json({
              imageData: s3Url,
              imageUrl: s3Url,
              imageType: imageType || "featured",
              provider: "gemini",
              storage: "s3",
            });
          } catch (s3Error) {
            console.error("[Image Generation] S3 upload failed, returning base64:", s3Error);
          }
        }

        res.json({
          imageData: `data:${mimeType};base64,${base64Data}`,
          imageType: imageType || "featured",
          provider: "gemini",
          storage: "base64",
        });
      }
    } catch (error) {
      console.error("Image generation error:", error);
      res.status(500).json({ error: "Failed to generate image" });
    }
  });

  // ============ IMAGE SUGGESTIONS (AI-powered) ============
  app.post("/api/images/suggest", async (req, res) => {
    try {
      const { content, targetKeyword, count = 4, styleId } = req.body;
      
      if (!content) {
        return res.status(400).json({ error: "Content is required" });
      }

      // Get image style if provided
      let styleInstructions = "";
      if (styleId) {
        const style = await storage.getImageStyle(styleId);
        if (style) {
          styleInstructions = `
IMPORTANT - All image suggestions MUST follow this visual style:
Style: ${style.name}
Style Description: ${style.stylePrompt || ""}
${style.additionalInstructions ? `Additional Requirements: ${style.additionalInstructions}` : ""}

Incorporate these style elements into every image prompt you generate.
`;
        }
      }

      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      const prompt = `Analyze this blog post content and suggest ${count} compelling image ideas that would enhance the article visually.
${styleInstructions}
Target Keyword: ${targetKeyword || "not specified"}

Blog Content (excerpt):
${content.substring(0, 2000)}

For each image, provide:
1. A descriptive title (short, 5-10 words)
2. A detailed image generation prompt (30-50 words describing the visual in detail)${styleInstructions ? " - MUST incorporate the style requirements above" : ""}
3. Suggested placement: "featured" for the main hero image, or "inline" for images within the content

Return as JSON array:
{
  "suggestions": [
    {
      "title": "Mystical Crystal Ball Reading",
      "prompt": "A glowing crystal ball on a velvet cloth surrounded by soft candlelight, mystical atmosphere with purple and blue hues, professional photography style",
      "placement": "featured"
    }
  ]
}

Make the first suggestion suitable as a featured/hero image. The rest should be inline images that complement different sections of the content.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a visual content strategist specializing in blog imagery. Generate compelling, detailed image prompts that will create visually striking images. Always respond with valid JSON."
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 1024,
      });

      const suggestions = JSON.parse(response.choices[0]?.message?.content || '{"suggestions":[]}');
      res.json(suggestions);
    } catch (error) {
      console.error("Image suggestions error:", error);
      res.status(500).json({ error: "Failed to generate image suggestions" });
    }
  });

  // ============ IMAGE PLACEMENT (AI-powered) ============
  app.post("/api/images/find-placement", async (req, res) => {
    try {
      const { content, imageUrl, imagePrompt, imageIndex } = req.body;
      
      if (!content || !imageUrl) {
        return res.status(400).json({ error: "Content and image URL are required" });
      }

      // Count existing images in content to determine where NOT to place new ones
      const existingImageMatches = content.match(/<img[^>]*>/g) || [];
      const existingImageCount = existingImageMatches.length;
      
      // Find paragraphs that already have images nearby (within 2 paragraphs)
      const paragraphs = content.match(/<p[^>]*>[\s\S]*?<\/p>/gi) || [];
      const paragraphsNearImages: number[] = [];
      
      paragraphs.forEach((p, idx) => {
        // Check if this paragraph or nearby ones contain an image
        const nearbyContent = paragraphs.slice(Math.max(0, idx - 1), idx + 2).join('');
        if (nearbyContent.includes('<img') || nearbyContent.includes('<figure')) {
          paragraphsNearImages.push(idx);
        }
      });

      // Determine image style variation based on index
      // Cycle through: full-width center, medium left float, medium right float
      const styleVariations = [
        { size: "full", align: "center", description: "full-width centered" },
        { size: "medium", align: "left", description: "medium size floated left with text wrapping" },
        { size: "medium", align: "right", description: "medium size floated right with text wrapping" },
        { size: "large", align: "center", description: "large centered" },
        { size: "small", align: "right", description: "small floated right" },
      ];
      const currentStyle = styleVariations[(imageIndex ?? existingImageCount) % styleVariations.length];

      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      const avoidParagraphsNote = paragraphsNearImages.length > 0 
        ? `\n\nIMPORTANT: There are already ${existingImageCount} images in the content. You MUST place this new image at least 2-3 paragraphs AWAY from any existing images to spread them evenly throughout the article. Avoid placing images near paragraphs ${paragraphsNearImages.join(', ')}.`
        : '';

      const prompt = `You are an expert content editor. Analyze this HTML blog post content and determine the BEST location to insert an image.

Image Description: ${imagePrompt || "Featured image for the article"}
Image Style: This image will be ${currentStyle.description}

Blog Content:
${content}

TASK: Find the most appropriate paragraph break to insert this image. The image should:
1. Be placed after a paragraph that relates to what the image shows
2. NOT be placed at the very beginning (after title is ok) or very end
3. Break up long sections of text naturally
4. Enhance the reader's understanding at that point in the article
5. Be SPREAD OUT from other images - images should never be consecutive or within 2 paragraphs of each other${avoidParagraphsNote}

Return a JSON object with:
- "insertAfterText": The EXACT text of the paragraph (first 100 chars) AFTER which to insert the image
- "altText": A descriptive alt text for SEO and accessibility (15-25 words)
- "caption": An optional short caption for the image (10-15 words, or empty string if not needed)

Example response:
{
  "insertAfterText": "The psychic reading revealed unexpected insights about...",
  "altText": "A mystical crystal ball glowing with purple light on a velvet cloth surrounded by candles",
  "caption": "Crystal ball readings can provide clarity and guidance."
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert content editor who knows exactly where images should be placed in articles for maximum visual impact and reader engagement. Always respond with valid JSON."
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 512,
      });

      const placement = JSON.parse(response.choices[0]?.message?.content || '{}');
      
      if (!placement.insertAfterText) {
        return res.json({ updatedContent: null, error: "Could not determine placement" });
      }

      // Find the paragraph and insert the image after it
      const insertAfterText = placement.insertAfterText;
      const altText = placement.altText || "Article image";
      const caption = placement.caption || "";

      // Create the image HTML with varied sizes and positions
      // Size classes: full = w-full, large = max-w-3xl, medium = max-w-md, small = max-w-xs
      // Alignment: center = mx-auto, left = float-left mr-6 mb-4, right = float-right ml-6 mb-4
      const sizeClasses: Record<string, string> = {
        full: "w-full",
        large: "max-w-3xl w-full",
        medium: "max-w-md w-full",
        small: "max-w-xs w-full",
      };
      
      const alignClasses: Record<string, string> = {
        center: "mx-auto",
        left: "float-left mr-6 mb-4",
        right: "float-right ml-6 mb-4",
      };

      const sizeClass = sizeClasses[currentStyle.size] || sizeClasses.full;
      const alignClass = alignClasses[currentStyle.align] || alignClasses.center;
      
      let imageHtml: string;
      // All images use figure with overflow-auto to handle floats properly
      if (currentStyle.align === "center") {
        // Centered images - full block, no float issues
        imageHtml = caption
          ? `<figure class="my-6"><img src="${imageUrl}" alt="${altText}" class="${sizeClass} ${alignClass} rounded-md" /><figcaption class="text-center text-sm text-muted-foreground mt-2">${caption}</figcaption></figure>`
          : `<figure class="my-6"><img src="${imageUrl}" alt="${altText}" class="${sizeClass} ${alignClass} rounded-md" /></figure>`;
      } else {
        // Floated images - use figure with overflow-auto and clearfix
        const figCaption = caption 
          ? `<figcaption class="text-sm text-muted-foreground mt-1">${caption}</figcaption>` 
          : '';
        imageHtml = `<figure class="my-4 ${sizeClass} ${alignClass} overflow-auto"><img src="${imageUrl}" alt="${altText}" class="w-full rounded-md" />${figCaption}</figure><div class="clear-both"></div>`;
      }

      // Try to find and insert after the matching paragraph
      let updatedContent = content;
      
      // Find paragraph that starts with the insertAfterText
      const paragraphRegex = new RegExp(`(<p[^>]*>)([^<]*${insertAfterText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').substring(0, 50)}[^<]*</p>)`, 'i');
      const match = content.match(paragraphRegex);
      
      if (match) {
        updatedContent = content.replace(match[0], match[0] + imageHtml);
      } else {
        // Fallback: try to find just the text and insert after that paragraph
        const textIndex = content.toLowerCase().indexOf(insertAfterText.toLowerCase().substring(0, 50));
        if (textIndex !== -1) {
          // Find the closing </p> tag after this text
          const afterText = content.substring(textIndex);
          const closingPIndex = afterText.indexOf('</p>');
          if (closingPIndex !== -1) {
            const insertPosition = textIndex + closingPIndex + 4;
            updatedContent = content.substring(0, insertPosition) + imageHtml + content.substring(insertPosition);
          }
        }
      }

      if (updatedContent === content) {
        // Last resort: insert after the first paragraph
        const firstPClose = content.indexOf('</p>');
        if (firstPClose !== -1) {
          updatedContent = content.substring(0, firstPClose + 4) + imageHtml + content.substring(firstPClose + 4);
        }
      }

      res.json({ updatedContent, placement: { altText, caption } });
    } catch (error) {
      console.error("Image placement error:", error);
      res.status(500).json({ error: "Failed to find image placement" });
    }
  });

  // ============ ARTICLE OPTIMIZATION ============
  
  // Test endpoint to verify Gemini API is working
  app.get("/api/optimize/test-gemini", async (req, res) => {
    try {
      console.log("[Gemini Test] Starting Gemini API test...");
      console.log("[Gemini Test] API Key exists:", !!process.env.AI_INTEGRATIONS_GEMINI_API_KEY);
      console.log("[Gemini Test] Base URL:", process.env.AI_INTEGRATIONS_GEMINI_BASE_URL);
      
      const { GoogleGenAI } = await import("@google/genai");
      const genAI = new GoogleGenAI({
        apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
        httpOptions: {
          apiVersion: "",
          baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
        },
      });

      console.log("[Gemini Test] GoogleGenAI initialized, calling API...");
      
      const response = await genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: "Say 'Hello, Gemini is working!' in exactly those words." }] }],
      });

      console.log("[Gemini Test] Response received:", JSON.stringify(response).substring(0, 500));
      
      // Try to extract text
      let responseText = "";
      if (typeof response.text === 'string') {
        responseText = response.text;
      } else if (typeof response.text === 'function') {
        responseText = response.text();
      }
      if (!responseText && response.candidates?.[0]) {
        const candidate = response.candidates[0];
        const textPart = candidate?.content?.parts?.find((part: any) => part.text);
        responseText = textPart?.text || "";
      }
      
      console.log("[Gemini Test] Extracted text:", responseText);
      
      res.json({ 
        success: true, 
        message: responseText,
        apiKeyExists: !!process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
        baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
      });
    } catch (error: any) {
      console.error("[Gemini Test] Error:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message,
        stack: error.stack,
        apiKeyExists: !!process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
        baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
      });
    }
  });

  app.post("/api/optimize/analyze", async (req, res) => {
    try {
      const { url, targetKeyword, dateRange = "28" } = req.body;
      
      if (!url || !targetKeyword) {
        return res.status(400).json({ error: "URL and target keyword are required" });
      }
      
      // Parse date range (days)
      const days = parseInt(dateRange, 10) || 28;

      // Security: Validate URL is from allowed domain (psychicsource.com only)
      let validatedUrl: URL;
      try {
        validatedUrl = new URL(url);
        const allowedHosts = ['psychicsource.com', 'www.psychicsource.com'];
        if (!allowedHosts.some(h => validatedUrl.hostname === h || validatedUrl.hostname.endsWith('.' + h))) {
          return res.status(400).json({ 
            error: "Invalid URL", 
            message: "Only psychicsource.com URLs are allowed for optimization analysis." 
          });
        }
        // Block internal IPs and localhost
        if (validatedUrl.hostname === 'localhost' || 
            validatedUrl.hostname.startsWith('127.') ||
            validatedUrl.hostname.startsWith('10.') ||
            validatedUrl.hostname.startsWith('192.168.')) {
          return res.status(400).json({ error: "Invalid URL" });
        }
      } catch {
        return res.status(400).json({ error: "Invalid URL format" });
      }

      console.log(`[Optimize] Starting analysis for URL: ${url}, keyword: "${targetKeyword}"`);

      // Step 1: Fetch GSC keywords for this URL (with auto token refresh)
      const accessToken = await getValidGSCToken();
      let keywords: Array<{ keyword: string; position: number; clicks: number; impressions: number; ctr: number }> = [];
      
      if (accessToken) {
        try {
          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - days);
          const formatDate = (d: Date) => d.toISOString().split('T')[0];
          console.log(`[Optimize] Fetching GSC data for last ${days} days`);

          // Extract path from URL for filtering
          const urlObj = new URL(url);
          const pageFilter = urlObj.href;

          const gscResponse = await fetch(
            "https://www.googleapis.com/webmasters/v3/sites/https%3A%2F%2Fwww.psychicsource.com%2F/searchAnalytics/query",
            {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
                body: JSON.stringify({
                  startDate: formatDate(startDate),
                  endDate: formatDate(endDate),
                  dimensions: ["query"],
                  dimensionFilterGroups: [{
                    filters: [{
                      dimension: "page",
                      operator: "equals",
                      expression: pageFilter,
                    }]
                  }],
                  rowLimit: 100,
                }),
              }
            );

            if (gscResponse.ok) {
              const gscData = await gscResponse.json();
              keywords = (gscData.rows || []).map((row: any) => ({
                keyword: row.keys[0],
                position: row.position || 0,
                clicks: row.clicks || 0,
                impressions: row.impressions || 0,
                ctr: (row.ctr || 0) * 100,
              }));
              console.log(`[Optimize] Found ${keywords.length} keywords from GSC`);
            } else {
              console.log(`[Optimize] GSC query failed: ${await gscResponse.text()}`);
            }
        } catch (gscError) {
          console.error("[Optimize] GSC fetch error:", gscError);
        }
      }

      // Step 2: Scrape the target URL using Firecrawl for clean content
      let pageContent = {
        title: "",
        metaDescription: "",
        headings: { h1: [] as string[], h2: [] as string[], h3: [] as string[] },
        wordCount: 0,
        content: "",
        htmlContent: "",
      };

      const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
      let contentFetchError: string | null = null;
      
      if (firecrawlApiKey) {
        const firecrawl = new FirecrawlApp({ apiKey: firecrawlApiKey });
        
        // Retry logic - try up to 2 times
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            console.log(`[Optimize] Scraping page with Firecrawl (attempt ${attempt}): ${url}`);
            
            const scrapeResult = await firecrawl.scrapeUrl(url, {
              formats: ['markdown', 'html'],
              onlyMainContent: true,
            });
            
            if (scrapeResult.success) {
              // Extract metadata
              pageContent.title = scrapeResult.metadata?.title || "";
              pageContent.metaDescription = scrapeResult.metadata?.description || "";
              
              // Extract headings from HTML
              const html = scrapeResult.html || "";
              const h1Matches = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
              const h2Matches = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/gi) || [];
              const h3Matches = html.match(/<h3[^>]*>([\s\S]*?)<\/h3>/gi) || [];
              
              pageContent.headings.h1 = h1Matches.map((h: string) => h.replace(/<[^>]+>/g, '').trim());
              pageContent.headings.h2 = h2Matches.map((h: string) => h.replace(/<[^>]+>/g, '').trim());
              pageContent.headings.h3 = h3Matches.map((h: string) => h.replace(/<[^>]+>/g, '').trim());
              
              // Get word count from markdown - store FULL content without limits
              const markdown = scrapeResult.markdown || "";
              pageContent.wordCount = markdown.split(/\s+/).filter(Boolean).length;
              pageContent.content = markdown; // No character limit
              
              // Store HTML for TipTap editor - no character limit
              pageContent.htmlContent = scrapeResult.html || "";
              
              console.log(`[Optimize] Firecrawl scraped page: ${pageContent.wordCount} words`);
              contentFetchError = null; // Clear any previous error
              break; // Success, exit retry loop
            } else {
              contentFetchError = "Page scrape returned no content";
              console.log(`[Optimize] Firecrawl scrape failed (attempt ${attempt})`);
              if (attempt < 2) {
                console.log(`[Optimize] Waiting 2 seconds before retry...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
              }
            }
          } catch (scrapeError: any) {
            contentFetchError = scrapeError?.message || "Unknown scrape error";
            console.error(`[Optimize] Firecrawl scrape error (attempt ${attempt}):`, scrapeError);
            if (attempt < 2) {
              console.log(`[Optimize] Waiting 2 seconds before retry...`);
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        }
      } else {
        contentFetchError = "FIRECRAWL_API_KEY not configured";
        console.log("[Optimize] FIRECRAWL_API_KEY not set - cannot scrape page");
      }
      
      // If content fetch failed completely, return an error
      if (pageContent.wordCount === 0 && contentFetchError) {
        console.error(`[Optimize] Content fetch failed after retries: ${contentFetchError}`);
        return res.status(500).json({ 
          error: `Failed to fetch page content: ${contentFetchError}. Please try again.` 
        });
      }

      // Step 3: Search for competitors using Firecrawl
      const skipDomains = [
        'youtube.com', 'facebook.com', 'twitter.com', 'instagram.com', 'tiktok.com',
        'reddit.com', 'quora.com', 'linkedin.com', 'pinterest.com', 'tumblr.com',
        'amazon.com', 'ebay.com', 'wikipedia.org', 'yelp.com',
        'tripadvisor.com', 'trustpilot.com', 'psychicsource.com'
      ];
      
      let competitors: Array<{
        url: string;
        title: string;
        metaDescription: string;
        headings: { h1: string[]; h2: string[]; h3: string[] };
        wordCount: number;
        content: string; // Full content for AI analysis
      }> = [];
      
      if (firecrawlApiKey) {
        try {
          console.log(`[Optimize] Using Firecrawl to search for competitors ranking for "${targetKeyword}"`);
          
          const firecrawl = new FirecrawlApp({ apiKey: firecrawlApiKey });
          
          // Search and scrape in one API call
          const searchResults = await firecrawl.search(targetKeyword, {
            limit: 10,
            scrapeOptions: {
              formats: ['markdown', 'html'],
              onlyMainContent: true,
            },
          });

          if (searchResults.success && searchResults.data) {
            for (const result of searchResults.data) {
              try {
                if (!result.url) continue;
                const resultUrl = new URL(result.url);
                
                // Skip unwanted domains
                if (skipDomains.some(d => resultUrl.hostname.includes(d))) {
                  continue;
                }
                
                // Extract headings from HTML if available
                const html = result.html || "";
                const h1s = (html.match(/<h1[^>]*>([^<]+)<\/h1>/gi) || []).map((h: string) => h.replace(/<[^>]+>/g, '').trim());
                const h2s = (html.match(/<h2[^>]*>([^<]+)<\/h2>/gi) || []).map((h: string) => h.replace(/<[^>]+>/g, '').trim());
                const h3s = (html.match(/<h3[^>]*>([^<]+)<\/h3>/gi) || []).map((h: string) => h.replace(/<[^>]+>/g, '').trim());
                
                // Get word count from markdown
                const markdown = result.markdown || "";
                const wordCount = markdown.split(/\s+/).filter(Boolean).length;
                
                competitors.push({
                  url: result.url,
                  title: result.title || "",
                  metaDescription: result.description || "",
                  headings: { h1: h1s, h2: h2s, h3: h3s },
                  wordCount,
                  content: markdown, // Full content for AI analysis
                });
                
                // Stop at 5 competitors
                if (competitors.length >= 5) break;
              } catch {
                // Skip invalid results
              }
            }
          }
          
          console.log(`[Optimize] Firecrawl found ${competitors.length} competitor pages`);
        } catch (firecrawlError) {
          console.error("[Optimize] Firecrawl error:", firecrawlError);
        }
      } else {
        console.log("[Optimize] FIRECRAWL_API_KEY not set - skipping competitor analysis");
      }

      // Step 4: Generate AI recommendations using Google Gemini API
      // This compares FULL content from your page vs competitors
      let recommendations: Array<{
        type: "title" | "meta" | "content" | "headings" | "keywords";
        priority: "high" | "medium" | "low";
        current: string;
        suggested: string;
        reason: string;
      }> = [];

      // Fetch custom optimization prompt from SEO settings
      const seoSettings = await storage.getSeoSettings();
      const customPrompt = seoSettings?.optimizationPrompt;

      // Identify keywords in "striking distance" (positions 10-100) - these are ranking opportunities
      const keywordsInStrikingDistance = keywords.filter(k => k.position >= 10 && k.position <= 100);
      console.log(`[Optimize] Found ${keywordsInStrikingDistance.length} keywords in striking distance (positions 10-100)`);

      try {
        const { GoogleGenAI } = await import("@google/genai");
        const genAI = new GoogleGenAI({
          apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
          httpOptions: {
            apiVersion: "",
            baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
          },
        });

        console.log(`[Optimize] Gemini API initialized, page content: ${pageContent.wordCount} words, competitors: ${competitors.length}`);

        // Build data for prompt placeholders
        const keywordsFormatted = keywords.length > 0 
          ? keywords.slice(0, 30).map(k => `- "${k.keyword}" (Position: ${k.position.toFixed(1)}, Clicks: ${k.clicks}, Impressions: ${k.impressions})`).join("\n")
          : "No ranking data available";
        
        const strikingDistanceFormatted = keywordsInStrikingDistance.length > 0
          ? keywordsInStrikingDistance.map(k => `- "${k.keyword}" (Position: ${k.position.toFixed(1)}, Impressions: ${k.impressions}) - Consider adding as H2/H3 heading or section`).join("\n")
          : "No keywords in striking distance found";
        
        const competitorsFormatted = competitors.length > 0 
          ? competitors.map((c, i) => `
--- COMPETITOR #${i + 1}: ${c.url} ---
Title: ${c.title}
Meta Description: ${c.metaDescription}
Word Count: ${c.wordCount}
H1 Headings: ${c.headings.h1.join(", ") || "None"}
H2 Headings: ${c.headings.h2.join(", ") || "None"}
H3 Headings: ${c.headings.h3.join(", ") || "None"}

FULL CONTENT:
${c.content}
`).join("\n\n")
          : "No competitor data available";

        let analysisPrompt: string;
        
        if (customPrompt && customPrompt.trim()) {
          // Use custom prompt with placeholder replacement
          console.log(`[Optimize] Using custom optimization prompt (${customPrompt.length} chars)`);
          analysisPrompt = customPrompt
            .replace(/\{targetKeyword\}/g, targetKeyword)
            .replace(/\{url\}/g, url)
            .replace(/\{pageTitle\}/g, pageContent.title)
            .replace(/\{pageMetaDescription\}/g, pageContent.metaDescription)
            .replace(/\{pageWordCount\}/g, String(pageContent.wordCount))
            .replace(/\{pageHeadings\}/g, `H1: ${pageContent.headings.h1.join(", ") || "None"}\nH2: ${pageContent.headings.h2.join(", ") || "None"}\nH3: ${pageContent.headings.h3.join(", ") || "None"}`)
            .replace(/\{pageContent\}/g, pageContent.content)
            .replace(/\{keywords\}/g, keywordsFormatted)
            .replace(/\{competitors\}/g, competitorsFormatted)
            .replace(/\{keywordsInStrikingDistance\}/g, strikingDistanceFormatted);
        } else {
          // Use default comprehensive prompt with striking distance keywords section
          console.log(`[Optimize] Using default optimization prompt`);
          analysisPrompt = `You are an expert SEO content strategist. Your task is to deeply analyze our content versus top-ranking competitor content and provide specific, actionable recommendations to outrank them.

TARGET KEYWORD: "${targetKeyword}"

=== OUR PAGE CONTENT ===
URL: ${url}
Title: ${pageContent.title}
Meta Description: ${pageContent.metaDescription}
Word Count: ${pageContent.wordCount}
H1 Headings: ${pageContent.headings.h1.join(", ") || "None"}
H2 Headings: ${pageContent.headings.h2.join(", ") || "None"}
H3 Headings: ${pageContent.headings.h3.join(", ") || "None"}

FULL CONTENT:
${pageContent.content}

=== RANKING KEYWORDS (from Google Search Console) ===
${keywordsFormatted}

=== KEYWORDS IN STRIKING DISTANCE (Positions 10-100) ===
These are ranking opportunities - keywords where we're close to page 1 or already ranking but could improve:
${strikingDistanceFormatted}

**IMPORTANT**: For keywords in striking distance, especially those with high impressions, consider:
- Adding them as H2 or H3 headings
- Creating dedicated content sections targeting these queries
- Naturally incorporating them into existing content

=== COMPETITOR CONTENT ANALYSIS ===
${competitorsFormatted}

=== YOUR ANALYSIS TASK ===
Compare our content against all competitor content and identify:

1. **Content Gaps**: What topics, subtopics, or information do competitors cover that we're missing?
2. **Content Depth**: Are competitors going deeper on certain topics? What details should we add?
3. **Unique Angles**: What unique perspectives or information could we add that competitors don't have?
4. **Structure Improvements**: How can we improve our heading structure based on what works for competitors?
5. **Title & Meta Optimization**: How can we make our title and meta description more compelling while incorporating the target keyword?
6. **Keyword Opportunities**: Based on competitors and our ranking data, what related keywords should we incorporate?
7. **Striking Distance Opportunities**: Which keywords in positions 10-100 should we prioritize adding as headings or sections to boost their rankings?

Return your analysis as a JSON object with this exact structure:
{
  "recommendations": [
    {
      "type": "title" | "meta" | "content" | "headings" | "keywords",
      "priority": "high" | "medium" | "low",
      "current": "What we currently have (quote specific text or say N/A)",
      "suggested": "Your specific, detailed suggestion. For content, include specific topics/sections to add. For titles, write the full new title.",
      "reason": "Explain which competitor(s) do this better and why this change will help rankings"
    }
  ]
}

Be extremely specific and actionable. Reference specific competitor content when making suggestions. Prioritize recommendations that will have the biggest impact on rankings for "${targetKeyword}".`;
        }

        console.log(`[Optimize] Sending ${analysisPrompt.length} chars to Gemini for analysis`);

        const response = await genAI.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{ role: "user", parts: [{ text: analysisPrompt }] }],
        });

        console.log(`[Optimize] Gemini response received:`, JSON.stringify(response).substring(0, 500));

        // Extract text from Gemini response - try multiple methods
        let responseText = "";
        
        // Method 1: Try response.text property/method
        if (typeof response.text === 'string') {
          responseText = response.text;
        } else if (typeof response.text === 'function') {
          responseText = response.text();
        }
        
        // Method 2: Try candidates array
        if (!responseText && response.candidates?.[0]) {
          const candidate = response.candidates[0];
          const textPart = candidate?.content?.parts?.find((part: any) => part.text);
          responseText = textPart?.text || "";
        }
        
        // Method 3: Try response.response.text()
        if (!responseText && (response as any).response?.text) {
          const respText = (response as any).response.text;
          responseText = typeof respText === 'function' ? respText() : respText;
        }

        console.log(`[Optimize] Gemini response text length: ${responseText.length} chars`);
        if (responseText.length > 0) {
          console.log(`[Optimize] Gemini response preview: ${responseText.substring(0, 300)}`);
        }
        
        // Extract JSON from response
        try {
          // First try to find JSON code block
          const codeBlockMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
          let parsed: any = null;
          
          if (codeBlockMatch) {
            console.log(`[Optimize] Found JSON in code block`);
            parsed = JSON.parse(codeBlockMatch[1].trim());
          } else {
            // Try to find raw JSON object
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              console.log(`[Optimize] Found raw JSON object`);
              parsed = JSON.parse(jsonMatch[0]);
            } else {
              console.log(`[Optimize] No JSON found in response, attempting to parse entire text`);
              try {
                parsed = JSON.parse(responseText);
              } catch {
                console.log(`[Optimize] Could not parse response as JSON`);
              }
            }
          }
          
          if (parsed) {
            // Check if it's the standard recommendations format
            if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
              recommendations = parsed.recommendations;
              console.log(`[Optimize] Found ${recommendations.length} recommendations in standard format`);
            } 
            // Check for custom prompt format with contentGaps, depthImprovements, etc.
            else if (parsed.contentGaps || parsed.depthImprovements || parsed.uniqueAngles || parsed.structureImprovements || parsed.keywordOpportunities || parsed.quickWins || parsed.strikingDistanceKeywords) {
              console.log(`[Optimize] Converting custom format to recommendations`);
              
              // Convert contentGaps to recommendations
              if (parsed.contentGaps && Array.isArray(parsed.contentGaps)) {
                for (const gap of parsed.contentGaps) {
                  recommendations.push({
                    type: "content" as const,
                    priority: (gap.priority || "medium") as "high" | "medium" | "low",
                    current: `Missing topic: ${gap.topic}`,
                    suggested: gap.recommendation || gap.implementation || gap.topic,
                    reason: gap.foundInCompetitors ? `Found in competitors: ${Array.isArray(gap.foundInCompetitors) ? gap.foundInCompetitors.join(", ") : gap.foundInCompetitors}` : "Identified as a content gap",
                  });
                }
              }
              
              // Convert depthImprovements to recommendations
              if (parsed.depthImprovements && Array.isArray(parsed.depthImprovements)) {
                for (const improvement of parsed.depthImprovements) {
                  recommendations.push({
                    type: "content" as const,
                    priority: (improvement.priority || "medium") as "high" | "medium" | "low",
                    current: improvement.currentState || improvement.area || "Current content",
                    suggested: improvement.recommendation || improvement.improvement,
                    reason: improvement.competitorExample ? `Competitor example: ${improvement.competitorExample}` : "Needs more depth",
                  });
                }
              }
              
              // Convert uniqueAngles to recommendations
              if (parsed.uniqueAngles && Array.isArray(parsed.uniqueAngles)) {
                for (const angle of parsed.uniqueAngles) {
                  recommendations.push({
                    type: "content" as const,
                    priority: "medium" as const,
                    current: "Current approach",
                    suggested: angle.implementation || angle.angle,
                    reason: angle.benefit || "Adds unique value",
                  });
                }
              }
              
              // Convert structureImprovements to recommendations
              if (parsed.structureImprovements && Array.isArray(parsed.structureImprovements)) {
                for (const structure of parsed.structureImprovements) {
                  recommendations.push({
                    type: "headings" as const,
                    priority: "medium" as const,
                    current: structure.currentIssue || "Current structure",
                    suggested: structure.recommendation + (structure.example ? ` (Example: ${structure.example})` : ""),
                    reason: "Improves content structure",
                  });
                }
              }
              
              // Convert keywordOpportunities to recommendations
              if (parsed.keywordOpportunities && Array.isArray(parsed.keywordOpportunities)) {
                for (const keyword of parsed.keywordOpportunities) {
                  recommendations.push({
                    type: "keywords" as const,
                    priority: "medium" as const,
                    current: keyword.currentUsage || `Keyword: ${keyword.keyword}`,
                    suggested: keyword.recommendation,
                    reason: keyword.competitorInsight || "Keyword optimization opportunity",
                  });
                }
              }
              
              // Convert strikingDistanceKeywords.integrate to recommendations
              if (parsed.strikingDistanceKeywords?.integrate && Array.isArray(parsed.strikingDistanceKeywords.integrate)) {
                for (const kw of parsed.strikingDistanceKeywords.integrate) {
                  recommendations.push({
                    type: "keywords" as const,
                    priority: (kw.estimatedImpact === "high" ? "high" : kw.estimatedImpact === "low" ? "low" : "medium") as "high" | "medium" | "low",
                    current: `"${kw.keyword}" at position ${kw.currentPosition || "10-100"}`,
                    suggested: kw.implementation + (kw.targetSection ? ` (Target section: ${kw.targetSection})` : ""),
                    reason: "Striking distance keyword - close to page 1",
                  });
                }
              }
              
              // Convert quickWins to recommendations (prioritize these)
              if (parsed.quickWins && Array.isArray(parsed.quickWins)) {
                for (const win of parsed.quickWins) {
                  recommendations.unshift({
                    type: "content" as const,
                    priority: (win.effort === "low" ? "high" : "medium") as "high" | "medium" | "low",
                    current: "Quick win opportunity",
                    suggested: win.action,
                    reason: `Expected impact: ${win.impact || "Significant improvement"}`,
                  });
                }
              }
              
              console.log(`[Optimize] Converted ${recommendations.length} recommendations from custom format`);
            }
          }
          
          console.log(`[Optimize] Parsed ${recommendations.length} recommendations`);
        } catch (parseError) {
          console.error("[Optimize] JSON parse error:", parseError);
          console.log("[Optimize] Using fallback recommendations");
          // Fallback: Generate basic recommendations based on data we have
          if (pageContent.wordCount < 2000 && competitors.some(c => c.wordCount > 2500)) {
            recommendations.push({
              type: "content" as const,
              priority: "high" as const,
              current: `${pageContent.wordCount} words`,
              suggested: "Expand content to 2,500+ words to match top competitors",
              reason: "Top-ranking pages have significantly more content depth",
            });
          }
          if (!pageContent.title.toLowerCase().includes(targetKeyword.toLowerCase())) {
            recommendations.push({
              type: "title" as const,
              priority: "high" as const,
              current: pageContent.title,
              suggested: `Include "${targetKeyword}" in your title tag`,
              reason: "The target keyword should appear in the title for better rankings",
            });
          }
          if (!pageContent.metaDescription.toLowerCase().includes(targetKeyword.toLowerCase())) {
            recommendations.push({
              type: "meta" as const,
              priority: "medium" as const,
              current: pageContent.metaDescription || "No meta description",
              suggested: `Add "${targetKeyword}" to your meta description`,
              reason: "Including the keyword in meta description can improve click-through rates",
            });
          }
        }
        
        console.log(`[Optimize] Generated ${recommendations.length} AI recommendations via Gemini`);
      } catch (aiError: any) {
        console.error("[Optimize] Gemini AI analysis error:", aiError?.message || aiError);
        console.error("[Optimize] Full error:", JSON.stringify(aiError, null, 2));
        
        // Generate fallback recommendations based on available data
        console.log("[Optimize] Generating fallback recommendations since Gemini failed");
        
        // Always add a content depth recommendation if competitors exist
        if (competitors.length > 0) {
          const avgCompetitorWords = competitors.reduce((sum, c) => sum + c.wordCount, 0) / competitors.length;
          if (pageContent.wordCount < avgCompetitorWords * 0.9) {
            recommendations.push({
              type: "content" as const,
              priority: "high" as const,
              current: `${pageContent.wordCount} words`,
              suggested: `Expand content to ${Math.round(avgCompetitorWords * 1.1)} words to match or exceed competitor average (${Math.round(avgCompetitorWords)} words)`,
              reason: "Top-ranking competitors have more comprehensive content",
            });
          }
          
          // Check heading coverage
          const competitorH2Count = Math.round(competitors.reduce((sum, c) => sum + c.headings.h2.length, 0) / competitors.length);
          if (pageContent.headings.h2.length < competitorH2Count) {
            recommendations.push({
              type: "headings" as const,
              priority: "medium" as const,
              current: `${pageContent.headings.h2.length} H2 headings`,
              suggested: `Add more H2 subheadings (competitors average ${competitorH2Count})`,
              reason: "More subheadings improve content structure and SEO",
            });
          }
          
          // Suggest topics from competitors
          const competitorH2s = competitors.flatMap(c => c.headings.h2).slice(0, 5);
          if (competitorH2s.length > 0) {
            recommendations.push({
              type: "content" as const,
              priority: "medium" as const,
              current: "Current topics covered",
              suggested: `Consider adding sections on: ${competitorH2s.join(", ")}`,
              reason: "Competitors cover these topics that may be missing from your content",
            });
          }
        }
        
        // Title optimization
        if (!pageContent.title.toLowerCase().includes(targetKeyword.toLowerCase())) {
          recommendations.push({
            type: "title" as const,
            priority: "high" as const,
            current: pageContent.title,
            suggested: `Include "${targetKeyword}" in your title tag`,
            reason: "The target keyword should appear in the title for better rankings",
          });
        }
        
        // Meta description optimization
        if (!pageContent.metaDescription.toLowerCase().includes(targetKeyword.toLowerCase())) {
          recommendations.push({
            type: "meta" as const,
            priority: "medium" as const,
            current: pageContent.metaDescription || "No meta description",
            suggested: `Add "${targetKeyword}" to your meta description`,
            reason: "Including the keyword in meta description can improve click-through rates",
          });
        }
        
        // If still no recommendations, add a general one
        if (recommendations.length === 0) {
          recommendations.push({
            type: "content" as const,
            priority: "low" as const,
            current: "Content appears optimized",
            suggested: "Consider adding more internal links, updating with recent information, or expanding FAQ sections",
            reason: "Regular content updates signal freshness to search engines",
          });
        }
        
        console.log(`[Optimize] Generated ${recommendations.length} fallback recommendations`);
      }

      // Save the analysis to database
      const savedAnalysis = await storage.createOptimizationAnalysis({
        url,
        targetKeyword,
        dateRange: String(days),
        pageTitle: pageContent.title,
        pageMetaDescription: pageContent.metaDescription,
        pageWordCount: pageContent.wordCount,
        keywords: keywords,
        competitors: competitors,
        recommendations: recommendations,
        pageContent: pageContent,
      });

      console.log(`[Optimize] Saved analysis with ID: ${savedAnalysis.id}`);

      // Return the complete analysis with ID
      res.json({
        id: savedAnalysis.id,
        keywords,
        pageContent,
        competitors,
        recommendations,
      });
    } catch (error) {
      console.error("Optimization analysis error:", error);
      res.status(500).json({ error: "Failed to analyze article" });
    }
  });

  // Get all saved optimization analyses
  app.get("/api/optimize/analyses", async (req, res) => {
    try {
      const analyses = await storage.getOptimizationAnalyses();
      res.json(analyses);
    } catch (error) {
      console.error("Failed to fetch analyses:", error);
      res.status(500).json({ error: "Failed to fetch saved analyses" });
    }
  });

  // Get a specific optimization analysis
  app.get("/api/optimize/analyses/:id", async (req, res) => {
    try {
      const analysis = await storage.getOptimizationAnalysis(req.params.id);
      if (!analysis) {
        return res.status(404).json({ error: "Analysis not found" });
      }
      res.json(analysis);
    } catch (error) {
      console.error("Failed to fetch analysis:", error);
      res.status(500).json({ error: "Failed to fetch analysis" });
    }
  });

  // Delete an optimization analysis
  app.delete("/api/optimize/analyses/:id", async (req, res) => {
    try {
      await storage.deleteOptimizationAnalysis(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete analysis:", error);
      res.status(500).json({ error: "Failed to delete analysis" });
    }
  });

  // Update article content for an optimization analysis
  app.patch("/api/optimize/analyses/:id/content", async (req, res) => {
    try {
      const { htmlContent } = req.body;
      if (!htmlContent) {
        return res.status(400).json({ error: "htmlContent is required" });
      }
      
      const analysis = await storage.getOptimizationAnalysis(req.params.id);
      if (!analysis) {
        return res.status(404).json({ error: "Analysis not found" });
      }

      const updatedAnalysis = await storage.updateOptimizationAnalysisContent(req.params.id, htmlContent);
      res.json(updatedAnalysis);
    } catch (error) {
      console.error("Failed to update analysis content:", error);
      res.status(500).json({ error: "Failed to update analysis content" });
    }
  });

  // Refresh recommendations for an existing analysis (re-runs AI without re-scraping)
  app.post("/api/optimize/analyses/:id/refresh", async (req, res) => {
    try {
      console.log("[Optimize Refresh] Starting refresh for ID:", req.params.id);
      const analysis = await storage.getOptimizationAnalysis(req.params.id);
      if (!analysis) {
        console.log("[Optimize Refresh] Analysis not found:", req.params.id);
        return res.status(404).json({ error: "Analysis not found" });
      }

      const { targetKeyword, pageContent, keywords, competitors } = analysis;
      
      // Validate we have the required data
      if (!pageContent) {
        console.error("[Optimize Refresh] No pageContent found for analysis:", req.params.id);
        return res.status(400).json({ error: "Analysis is missing page content data" });
      }
      
      const pageContentTyped = pageContent as {
        title: string;
        metaDescription: string;
        wordCount: number;
        content: string;
        headings: { h1: string[]; h2: string[]; h3: string[] };
      };
      
      console.log("[Optimize Refresh] Page content title:", pageContentTyped.title);
      console.log("[Optimize Refresh] Page content length:", pageContentTyped.content?.length || 0);
      const keywordsTyped = (keywords || []) as Array<{
        keyword: string;
        position: number;
        clicks: number;
        impressions: number;
      }>;
      const competitorsTyped = (competitors || []) as Array<{
        url: string;
        title: string;
        metaDescription: string;
        headings: { h1: string[]; h2: string[]; h3: string[] };
        wordCount: number;
        content: string;
      }>;

      // Fetch custom optimization prompt from SEO settings
      const seoSettings = await storage.getSeoSettings();
      const customPrompt = seoSettings?.optimizationPrompt;

      // Identify keywords in "striking distance" (positions 10-100)
      const keywordsInStrikingDistance = keywordsTyped.filter(k => k.position >= 10 && k.position <= 100);

      // Re-run AI analysis
      const { GoogleGenAI } = await import("@google/genai");
      const genAI = new GoogleGenAI({
        apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
        httpOptions: {
          apiVersion: "",
          baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
        },
      });

      // Build data for prompt placeholders
      const keywordsFormatted = keywordsTyped.length > 0 
        ? keywordsTyped.slice(0, 30).map(k => `- "${k.keyword}" (Position: ${k.position.toFixed(1)}, Clicks: ${k.clicks}, Impressions: ${k.impressions})`).join("\n")
        : "No ranking data available";
      
      const strikingDistanceFormatted = keywordsInStrikingDistance.length > 0
        ? keywordsInStrikingDistance.map(k => `- "${k.keyword}" (Position: ${k.position.toFixed(1)}, Impressions: ${k.impressions}) - Consider adding as H2/H3 heading or section`).join("\n")
        : "No keywords in striking distance found";
      
      const competitorsFormatted = competitorsTyped.length > 0 
        ? competitorsTyped.map((c, i) => `
--- COMPETITOR #${i + 1}: ${c.url} ---
Title: ${c.title}
Meta Description: ${c.metaDescription}
Word Count: ${c.wordCount}
H1 Headings: ${c.headings?.h1?.join(", ") || "None"}
H2 Headings: ${c.headings?.h2?.join(", ") || "None"}
H3 Headings: ${c.headings?.h3?.join(", ") || "None"}

FULL CONTENT:
${c.content || "No content available"}
`).join("\n\n")
        : "No competitor data available";

      console.log("[Optimize Refresh] Competitors formatted length:", competitorsFormatted.length);
      console.log("[Optimize Refresh] Custom prompt exists:", !!customPrompt);
      if (customPrompt) {
        console.log("[Optimize Refresh] Custom prompt length:", customPrompt.length);
        console.log("[Optimize Refresh] Custom prompt preview:", customPrompt.substring(0, 200) + "...");
      }

      let analysisPrompt: string;
      
      const hasPlaceholders = customPrompt && (
        customPrompt.includes('{targetKeyword}') ||
        customPrompt.includes('{pageContent}') ||
        customPrompt.includes('{keywords}') ||
        customPrompt.includes('{competitors}')
      );
      
      console.log("[Optimize Refresh] Custom prompt has placeholders:", hasPlaceholders);
      if (customPrompt && !hasPlaceholders) {
        console.log("[Optimize Refresh] WARNING: Custom prompt exists but has NO placeholders! The following placeholders are available:");
        console.log("  {targetKeyword} - The target keyword for the analysis");
        console.log("  {url} - The URL being analyzed");
        console.log("  {pageTitle} - The page title");
        console.log("  {pageMetaDescription} - The page meta description");
        console.log("  {pageWordCount} - The page word count");
        console.log("  {pageHeadings} - The page headings (H1, H2, H3)");
        console.log("  {pageContent} - The full page content");
        console.log("  {keywords} - All ranking keywords from Google Search Console");
        console.log("  {competitors} - Full competitor content analysis");
        console.log("  {keywordsInStrikingDistance} - Keywords ranking 10-100 that need improvement");
      }
      
      if (customPrompt && customPrompt.trim()) {
        analysisPrompt = customPrompt
          .replace(/\{targetKeyword\}/g, targetKeyword)
          .replace(/\{url\}/g, analysis.url)
          .replace(/\{pageTitle\}/g, pageContentTyped.title)
          .replace(/\{pageMetaDescription\}/g, pageContentTyped.metaDescription)
          .replace(/\{pageWordCount\}/g, String(pageContentTyped.wordCount))
          .replace(/\{pageHeadings\}/g, `H1: ${pageContentTyped.headings.h1.join(", ") || "None"}\nH2: ${pageContentTyped.headings.h2.join(", ") || "None"}\nH3: ${pageContentTyped.headings.h3.join(", ") || "None"}`)
          .replace(/\{pageContent\}/g, pageContentTyped.content)
          .replace(/\{keywords\}/g, keywordsFormatted)
          .replace(/\{competitors\}/g, competitorsFormatted)
          .replace(/\{keywordsInStrikingDistance\}/g, strikingDistanceFormatted);
        console.log("[Optimize Refresh] Using custom prompt");
        console.log("[Optimize Refresh] Final prompt length after substitution:", analysisPrompt.length);
        if (analysisPrompt.length < 5000 && competitorsFormatted.length > 10000) {
          console.log("[Optimize Refresh] WARNING: Final prompt is very short but competitor data is large. Your custom prompt may be missing placeholder variables!");
        }
      } else {
        console.log("[Optimize Refresh] Using default prompt (no custom prompt set)");
        analysisPrompt = `You are an expert SEO content strategist. Your task is to deeply analyze our content versus top-ranking competitor content and provide specific, actionable recommendations to outrank them.

TARGET KEYWORD: "${targetKeyword}"

=== OUR PAGE CONTENT ===
URL: ${analysis.url}
Title: ${pageContentTyped.title}
Meta Description: ${pageContentTyped.metaDescription}
Word Count: ${pageContentTyped.wordCount}
H1 Headings: ${pageContentTyped.headings.h1.join(", ") || "None"}
H2 Headings: ${pageContentTyped.headings.h2.join(", ") || "None"}
H3 Headings: ${pageContentTyped.headings.h3.join(", ") || "None"}

FULL CONTENT:
${pageContentTyped.content}

=== RANKING KEYWORDS (from Google Search Console) ===
${keywordsFormatted}

=== KEYWORDS IN STRIKING DISTANCE (Positions 10-100) ===
These are ranking opportunities - keywords where we're close to page 1 or already ranking but could improve:
${strikingDistanceFormatted}

**IMPORTANT**: For keywords in striking distance, especially those with high impressions, consider:
- Adding them as H2 or H3 headings
- Creating dedicated content sections targeting these queries
- Naturally incorporating them into existing content

=== COMPETITOR CONTENT ANALYSIS ===
${competitorsFormatted}

=== YOUR TASK ===
Compare our content against all competitor content and identify:

1. **Content Gaps**: What topics, subtopics, or information do competitors cover that we're missing?
2. **Content Depth**: Are competitors going deeper on certain topics? What details should we add?
3. **Unique Angles**: What unique perspectives or information could we add that competitors don't have?
4. **Structure Improvements**: How can we improve our heading structure based on what works for competitors?
5. **Striking Distance Opportunities**: Which keywords in striking distance should we prioritize and how?
6. **Keyword Opportunities**: Based on competitors and our ranking data, what related keywords should we incorporate?

Return your analysis as a JSON array of recommendations with this exact structure:
[
  {
    "type": "title" | "meta" | "content" | "headings" | "keywords",
    "priority": "high" | "medium" | "low",
    "current": "What currently exists (quote specific text if relevant)",
    "suggested": "Your specific suggestion for improvement",
    "reason": "Explain which competitor(s) do this better and why this change will help rankings"
  }
]

Be extremely specific and actionable. Reference specific competitor content when making suggestions. Prioritize recommendations that will have the biggest impact on rankings for "${targetKeyword}".`;
      }

      console.log("[Optimize Refresh] Sending prompt to Gemini for analysis ID:", req.params.id);
      console.log("[Optimize Refresh] Target keyword:", targetKeyword);
      console.log("[Optimize Refresh] Keywords count:", keywordsTyped.length);
      console.log("[Optimize Refresh] Competitors count:", competitorsTyped.length);
      console.log("[Optimize Refresh] Page content word count:", pageContentTyped.wordCount);
      console.log("[Optimize Refresh] Prompt length:", analysisPrompt.length);
      
      let response;
      try {
        response = await genAI.models.generateContent({
          model: "gemini-2.5-flash",
          contents: analysisPrompt,
        });
        console.log("[Optimize Refresh] Got response from Gemini");
      } catch (geminiError) {
        console.error("[Optimize Refresh] Gemini API error:", geminiError);
        return res.status(500).json({ error: "AI analysis failed: " + (geminiError instanceof Error ? geminiError.message : "Unknown error") });
      }

      const responseText = response.text || "";
      console.log("[Optimize Refresh] Raw AI response length:", responseText.length);
      
      let recommendations: Array<{
        type: "title" | "meta" | "content" | "headings" | "keywords";
        priority: "high" | "medium" | "low";
        current: string;
        suggested: string;
        reason: string;
      }> = [];

      try {
        // Strip markdown code blocks if present
        let cleanedResponse = responseText;
        if (cleanedResponse.includes("```json")) {
          cleanedResponse = cleanedResponse.replace(/```json\s*/g, "").replace(/```\s*/g, "");
        } else if (cleanedResponse.includes("```")) {
          cleanedResponse = cleanedResponse.replace(/```\s*/g, "");
        }
        
        // Try to find JSON in response (could be array or object)
        const jsonArrayMatch = cleanedResponse.match(/\[[\s\S]*\]/);
        const jsonObjectMatch = cleanedResponse.match(/\{[\s\S]*\}/);
        
        // Determine if the response is an object format (new) or array format (old)
        const trimmedResponse = cleanedResponse.trim();
        const isObjectFormat = trimmedResponse.startsWith("{");
        const isArrayFormat = trimmedResponse.startsWith("[");
        
        if (isArrayFormat && jsonArrayMatch) {
          // Old format: array of recommendations
          recommendations = JSON.parse(jsonArrayMatch[0]);
          console.log("[Optimize Refresh] Parsed array format:", recommendations.length, "recommendations");
        } else if (isObjectFormat && jsonObjectMatch) {
          // New format: object with sections like contentGaps, depthImprovements, etc.
          const parsed = JSON.parse(jsonObjectMatch[0]);
          console.log("[Optimize Refresh] Parsed object format with keys:", Object.keys(parsed).join(", "));
          
          // Convert the new object format to the array format for storage
          // Handle contentGaps
          if (parsed.contentGaps && Array.isArray(parsed.contentGaps)) {
            for (const gap of parsed.contentGaps) {
              recommendations.push({
                type: "content",
                priority: gap.priority || "medium",
                current: `Missing topic: ${gap.topic}`,
                suggested: gap.recommendation || gap.topic,
                reason: gap.foundInCompetitors ? `Found in competitors: ${gap.foundInCompetitors.join(", ")}` : "Content gap identified"
              });
            }
          }
          
          // Handle depthImprovements
          if (parsed.depthImprovements && Array.isArray(parsed.depthImprovements)) {
            for (const depth of parsed.depthImprovements) {
              recommendations.push({
                type: "content",
                priority: depth.priority || "medium",
                current: depth.currentState || depth.area,
                suggested: depth.recommendation || "",
                reason: depth.competitorExample || "Add more depth"
              });
            }
          }
          
          // Handle uniqueAngles
          if (parsed.uniqueAngles && Array.isArray(parsed.uniqueAngles)) {
            for (const angle of parsed.uniqueAngles) {
              recommendations.push({
                type: "content",
                priority: "medium",
                current: "No unique angle",
                suggested: `${angle.angle}: ${angle.implementation || ""}`,
                reason: angle.benefit || "Differentiate from competitors"
              });
            }
          }
          
          // Handle structureImprovements
          if (parsed.structureImprovements && Array.isArray(parsed.structureImprovements)) {
            for (const structure of parsed.structureImprovements) {
              recommendations.push({
                type: "headings",
                priority: "medium",
                current: structure.currentIssue || "",
                suggested: structure.recommendation || "",
                reason: structure.example || "Improve heading structure"
              });
            }
          }
          
          // Handle strikingDistanceKeywords
          if (parsed.strikingDistanceKeywords) {
            if (parsed.strikingDistanceKeywords.integrate && Array.isArray(parsed.strikingDistanceKeywords.integrate)) {
              for (const kw of parsed.strikingDistanceKeywords.integrate) {
                recommendations.push({
                  type: "keywords",
                  priority: kw.estimatedImpact || "medium",
                  current: `Position ${kw.currentPosition}: "${kw.keyword}"`,
                  suggested: `Add to ${kw.targetSection}: ${kw.implementation || kw.keyword}`,
                  reason: `Striking distance keyword - ${kw.estimatedImpact || "medium"} impact`
                });
              }
            }
          }
          
          // Handle keywordOpportunities
          if (parsed.keywordOpportunities && Array.isArray(parsed.keywordOpportunities)) {
            for (const kw of parsed.keywordOpportunities) {
              recommendations.push({
                type: "keywords",
                priority: "medium",
                current: kw.currentUsage || `Keyword: ${kw.keyword}`,
                suggested: kw.recommendation || "",
                reason: kw.competitorInsight || "Keyword opportunity"
              });
            }
          }
          
          // Handle quickWins
          if (parsed.quickWins && Array.isArray(parsed.quickWins)) {
            for (const win of parsed.quickWins) {
              recommendations.push({
                type: "content",
                priority: win.effort === "low" ? "high" : (win.effort === "medium" ? "medium" : "low"),
                current: "Quick win opportunity",
                suggested: win.action || "",
                reason: `Expected impact: ${win.impact || "Unknown"}`
              });
            }
          }
          
          console.log("[Optimize Refresh] Converted to", recommendations.length, "recommendations");
        } else {
          console.error("[Optimize Refresh] No JSON found in response");
          console.error("[Optimize Refresh] Full response:", responseText);
        }
      } catch (parseError) {
        console.error("[Optimize Refresh] Failed to parse AI response:", parseError);
        console.error("[Optimize Refresh] Response text:", responseText.substring(0, 2000));
      }

      // Update the analysis with new recommendations
      const updatedAnalysis = await storage.updateOptimizationAnalysisRecommendations(req.params.id, recommendations);
      
      res.json({
        success: true,
        recommendations,
        analysis: updatedAnalysis,
      });
    } catch (error) {
      console.error("Failed to refresh recommendations:", error);
      res.status(500).json({ error: "Failed to refresh recommendations" });
    }
  });

  // Implement selected recommendations - AI rewrites content with recommendations
  app.post("/api/optimize/implement", async (req, res) => {
    try {
      const { content, recommendations, targetKeyword, promptId } = req.body;
      
      if (!content || !Array.isArray(recommendations)) {
        return res.status(400).json({ error: "Content is required" });
      }

      console.log("[Optimize Implement] Starting content rewrite");
      console.log("[Optimize Implement] Content length:", content.length);
      console.log("[Optimize Implement] Recommendations count:", recommendations.length);
      console.log("[Optimize Implement] Target keyword:", targetKeyword);
      console.log("[Optimize Implement] Prompt ID:", promptId);

      // Use Gemini for content rewriting
      const { GoogleGenAI } = await import("@google/genai");
      const genAI = new GoogleGenAI({
        apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
        httpOptions: {
          apiVersion: "",
          baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
        },
      });

      // Format recommendations for the prompt (may be empty)
      const recommendationsFormatted = recommendations.length > 0 
        ? recommendations.map((rec: any, i: number) => 
            `${i + 1}. [${rec.type.toUpperCase()}] ${rec.priority} priority
   Reason: ${rec.reason}
   ${rec.current ? `Current: ${rec.current}` : ""}
   Suggested: ${rec.suggested}`
          ).join("\n\n")
        : "(No specific recommendations selected)";

      // Fetch the selected optimization prompt or use default
      let customPromptText = "";
      if (promptId) {
        const optimizationPrompt = await storage.getOptimizationPrompt(promptId);
        if (optimizationPrompt) {
          console.log("[Optimize Implement] Using custom prompt:", optimizationPrompt.name);
          customPromptText = optimizationPrompt.prompt;
          
          // Fetch internal links for placeholder replacement
          const linkColumns = await storage.getLinkTableColumns();
          const siteUrls = await storage.getSiteUrls();
          
          console.log("[Optimize Implement] === INTERNAL LINKS DEBUG ===");
          console.log("[Optimize Implement] Link columns found:", linkColumns.length);
          console.log("[Optimize Implement] Link columns:", linkColumns.map(c => ({ id: c.id, name: c.name })));
          console.log("[Optimize Implement] Site URLs found:", siteUrls.length);
          
          // Format internal links data for placeholders
          const internalLinksData: Record<string, string[]> = {};
          for (const col of linkColumns) {
            internalLinksData[col.name] = siteUrls.map((row: any) => {
              const data = row.data as Record<string, string> | null;
              console.log(`[Optimize Implement] Row data for col ${col.name} (id: ${col.id}):`, data);
              return data?.[col.id] || "";
            }).filter((v: string) => v);
          }
          
          console.log("[Optimize Implement] Internal links data:", internalLinksData);
          
          // Replace placeholders in custom prompt
          customPromptText = customPromptText
            .replace(/\{targetKeyword\}/g, targetKeyword || "")
            .replace(/\{recommendations\}/g, recommendationsFormatted)
            .replace(/\{pageContent\}/g, content);
          
          // Replace internal links placeholders
          for (const [colName, values] of Object.entries(internalLinksData)) {
            const placeholder = `{{${colName}}}`;
            console.log(`[Optimize Implement] Replacing placeholder: ${placeholder} with ${values.length} values`);
            console.log(`[Optimize Implement] Values:`, values);
            customPromptText = customPromptText.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), values.join("\n"));
          }
          
          console.log("[Optimize Implement] After placeholder replacement (first 500 chars):", customPromptText.substring(0, 500));
        }
      }

      // Use custom prompt if available, otherwise use default
      let rewritePrompt: string;
      if (customPromptText) {
        // If custom prompt doesn't include {pageContent} placeholder, append the content at the end
        if (!customPromptText.includes('{pageContent}')) {
          rewritePrompt = `${customPromptText}

=== ORIGINAL PAGE CONTENT TO MODIFY ===
${content}

=== YOUR TASK ===
Apply the instructions above to modify the page content. Return ONLY the modified HTML content, no explanations.`;
        } else {
          rewritePrompt = customPromptText;
        }
        console.log("[Optimize Implement] === CUSTOM PROMPT DEBUG ===");
        console.log("[Optimize Implement] Using custom prompt");
        console.log("[Optimize Implement] Prompt length:", rewritePrompt.length, "chars");
        console.log("[Optimize Implement] First 1000 chars of prompt:");
        console.log(rewritePrompt.substring(0, 1000));
      } else {
        // No custom prompt selected - require a prompt template
        console.log("[Optimize Implement] No prompt template selected");
        console.log("[Optimize Implement] promptId was:", promptId);
        return res.status(400).json({ 
          error: "Please select a prompt template from the dropdown before implementing." 
        });
      }

      console.log("[Optimize Implement] Sending prompt to Gemini");
      console.log("[Optimize Implement] Prompt length:", rewritePrompt.length, "characters");
      
      const response = await genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: rewritePrompt,
      });

      let rewrittenContent = response.text || "";
      
      // Clean up the response - remove markdown code blocks if present
      if (rewrittenContent.includes("```html")) {
        rewrittenContent = rewrittenContent.replace(/```html\s*/g, "").replace(/```\s*/g, "");
      } else if (rewrittenContent.includes("```")) {
        rewrittenContent = rewrittenContent.replace(/```\s*/g, "");
      }
      
      // Convert any remaining markdown formatting to HTML or strip it
      // Convert **bold** to <strong>
      rewrittenContent = rewrittenContent.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      // Convert *italic* to <em> (but not if it's already inside a tag)
      rewrittenContent = rewrittenContent.replace(/(?<!<[^>]*)\*([^*<>]+)\*(?![^<]*>)/g, '<em>$1</em>');
      // Convert __bold__ to <strong>
      rewrittenContent = rewrittenContent.replace(/__([^_]+)__/g, '<strong>$1</strong>');
      // Convert _italic_ to <em>
      rewrittenContent = rewrittenContent.replace(/(?<!<[^>]*)_([^_<>]+)_(?![^<]*>)/g, '<em>$1</em>');
      
      rewrittenContent = rewrittenContent.trim();

      console.log("[Optimize Implement] Rewritten content length:", rewrittenContent.length);

      res.json({
        success: true,
        content: rewrittenContent,
        processedPrompt: rewritePrompt, // Return the actual prompt sent to AI for debugging
      });
    } catch (error) {
      console.error("Failed to implement recommendations:", error);
      res.status(500).json({ error: "Failed to implement recommendations: " + (error instanceof Error ? error.message : "Unknown error") });
    }
  });

  // Direct Apply endpoint - applies a prompt directly to content without requiring recommendations
  app.post("/api/optimize/direct-apply", async (req, res) => {
    try {
      const { content, promptId, targetKeyword } = req.body;
      
      if (!content || !promptId) {
        return res.status(400).json({ error: "Content and promptId are required" });
      }

      console.log("[Direct Apply] Starting direct prompt application");
      console.log("[Direct Apply] Content length:", content.length);
      console.log("[Direct Apply] Prompt ID:", promptId);
      console.log("[Direct Apply] Target keyword:", targetKeyword);

      // Fetch the optimization prompt
      const optimizationPrompt = await storage.getOptimizationPrompt(promptId);
      if (!optimizationPrompt) {
        return res.status(404).json({ error: "Prompt not found" });
      }
      
      if (optimizationPrompt.promptType !== "direct") {
        return res.status(400).json({ error: "This prompt requires full analysis, not direct application" });
      }

      console.log("[Direct Apply] Using prompt:", optimizationPrompt.name);
      
      // Use Gemini for content processing
      const { GoogleGenAI } = await import("@google/genai");
      const genAI = new GoogleGenAI({
        apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
        httpOptions: {
          apiVersion: "",
          baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
        },
      });

      // Fetch internal links for placeholder replacement
      const linkColumns = await storage.getLinkTableColumns();
      const siteUrls = await storage.getSiteUrls();
      
      // Format internal links data for placeholders
      const internalLinksData: Record<string, string[]> = {};
      for (const col of linkColumns) {
        internalLinksData[col.name] = siteUrls.map((row: any) => {
          const data = row.data as Record<string, string> | null;
          return data?.[col.id] || "";
        }).filter((v: string) => v);
      }

      // Replace placeholders in prompt
      let processedPrompt = optimizationPrompt.prompt
        .replace(/\{targetKeyword\}/g, targetKeyword || "")
        .replace(/\{pageContent\}/g, content);
      
      // Replace internal links placeholders
      for (const [colName, values] of Object.entries(internalLinksData)) {
        const placeholder = `{{${colName}}}`;
        processedPrompt = processedPrompt.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), values.join("\n"));
      }

      // If the prompt doesn't reference pageContent, append it at the end
      if (!optimizationPrompt.prompt.includes('{pageContent}')) {
        processedPrompt = `${processedPrompt}

=== ORIGINAL PAGE CONTENT TO MODIFY ===
${content}

=== YOUR TASK ===
Apply the instructions above to modify the page content. Return ONLY the modified HTML content, no explanations.`;
      }

      console.log("[Direct Apply] Processed prompt length:", processedPrompt.length, "chars");
      
      const response = await genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: processedPrompt,
      });

      let rewrittenContent = response.text || "";
      
      // Clean up the response - remove markdown code blocks if present
      if (rewrittenContent.includes("```html")) {
        rewrittenContent = rewrittenContent.replace(/```html\s*/g, "").replace(/```\s*/g, "");
      } else if (rewrittenContent.includes("```")) {
        rewrittenContent = rewrittenContent.replace(/```\s*/g, "");
      }
      
      // Convert any remaining markdown formatting to HTML or strip it
      rewrittenContent = rewrittenContent.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      rewrittenContent = rewrittenContent.replace(/(?<!<[^>]*)\*([^*<>]+)\*(?![^<]*>)/g, '<em>$1</em>');
      rewrittenContent = rewrittenContent.replace(/__([^_]+)__/g, '<strong>$1</strong>');
      rewrittenContent = rewrittenContent.replace(/(?<!<[^>]*)_([^_<>]+)_(?![^<]*>)/g, '<em>$1</em>');
      
      rewrittenContent = rewrittenContent.trim();

      console.log("[Direct Apply] Result content length:", rewrittenContent.length);

      res.json({
        success: true,
        content: rewrittenContent,
      });
    } catch (error) {
      console.error("Failed to apply direct prompt:", error);
      res.status(500).json({ error: "Failed to apply prompt: " + (error instanceof Error ? error.message : "Unknown error") });
    }
  });

  // Quick Fetch endpoint - only scrapes page content without GSC/competitors/recommendations
  app.post("/api/optimize/quick-fetch", async (req, res) => {
    try {
      const { url, targetKeyword } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      // Security: Validate URL is from allowed domain
      let validatedUrl: URL;
      try {
        validatedUrl = new URL(url);
        const allowedHosts = ['psychicsource.com', 'www.psychicsource.com'];
        if (!allowedHosts.some(h => validatedUrl.hostname === h || validatedUrl.hostname.endsWith('.' + h))) {
          return res.status(400).json({ 
            error: "Invalid URL", 
            message: "Only psychicsource.com URLs are allowed." 
          });
        }
      } catch {
        return res.status(400).json({ error: "Invalid URL format" });
      }

      console.log(`[Quick Fetch] Starting quick fetch for URL: ${url}`);

      // Scrape the page using Firecrawl
      let pageContent = {
        title: "",
        metaDescription: "",
        headings: { h1: [] as string[], h2: [] as string[], h3: [] as string[] },
        wordCount: 0,
        content: "",
        htmlContent: "",
      };

      const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
      
      if (!firecrawlApiKey) {
        return res.status(500).json({ error: "FIRECRAWL_API_KEY not configured" });
      }

      try {
        console.log(`[Quick Fetch] Scraping page with Firecrawl: ${url}`);
        const firecrawl = new FirecrawlApp({ apiKey: firecrawlApiKey });
        
        const scrapeResult = await firecrawl.scrapeUrl(url, {
          formats: ['markdown', 'html'],
          onlyMainContent: true,
        });
        
        if (scrapeResult.success) {
          pageContent.title = scrapeResult.metadata?.title || "";
          pageContent.metaDescription = scrapeResult.metadata?.description || "";
          
          const html = scrapeResult.html || "";
          const h1Matches = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
          const h2Matches = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/gi) || [];
          const h3Matches = html.match(/<h3[^>]*>([\s\S]*?)<\/h3>/gi) || [];
          
          pageContent.headings.h1 = h1Matches.map((h: string) => h.replace(/<[^>]+>/g, '').trim());
          pageContent.headings.h2 = h2Matches.map((h: string) => h.replace(/<[^>]+>/g, '').trim());
          pageContent.headings.h3 = h3Matches.map((h: string) => h.replace(/<[^>]+>/g, '').trim());
          
          const markdown = scrapeResult.markdown || "";
          pageContent.wordCount = markdown.split(/\s+/).filter(Boolean).length;
          pageContent.content = markdown;
          pageContent.htmlContent = scrapeResult.html || "";
          
          console.log(`[Quick Fetch] Scraped page: ${pageContent.wordCount} words`);
        } else {
          return res.status(500).json({ error: "Failed to scrape page" });
        }
      } catch (scrapeError) {
        console.error("[Quick Fetch] Firecrawl scrape error:", scrapeError);
        return res.status(500).json({ error: "Failed to scrape page: " + (scrapeError instanceof Error ? scrapeError.message : "Unknown error") });
      }

      // Save the quick fetch to database as history entry
      const savedAnalysis = await storage.createOptimizationAnalysis({
        url,
        targetKeyword: targetKeyword || "",
        dateRange: null,
        pageTitle: pageContent.title,
        pageMetaDescription: pageContent.metaDescription,
        pageWordCount: pageContent.wordCount,
        keywords: [],
        competitors: [],
        recommendations: [],
        pageContent,
      });

      console.log(`[Quick Fetch] Saved to history with ID: ${savedAnalysis.id}`);

      // Return the page content with the saved analysis ID
      res.json({
        success: true,
        id: savedAnalysis.id,
        url,
        targetKeyword,
        pageContent,
        keywords: [],
        competitors: [],
        recommendations: [],
      });
    } catch (error) {
      console.error("Quick fetch failed:", error);
      res.status(500).json({ error: "Quick fetch failed: " + (error instanceof Error ? error.message : "Unknown error") });
    }
  });

  return httpServer;
}
