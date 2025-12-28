import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertArticleSchema, insertKeywordSchema, insertImageStyleSchema } from "@shared/schema";
import type { ContentOptimizationResult, ContentSuggestion } from "@shared/schema";
import crypto from "crypto";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

// OAuth state storage (in production, use Redis or similar)
const oauthStates = new Map<string, { timestamp: number }>();

// Google OAuth configuration
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GSC_SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"];

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
      const article = await storage.createArticle(parsed.data);
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
      const gscIntegration = await storage.getIntegration("gsc");
      
      if (!gscIntegration || gscIntegration.status !== "connected") {
        return res.status(400).json({ 
          error: "Google Search Console not connected",
          message: "Please connect Google Search Console in the Integrations page to view performance data.",
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
            "Authorization": `Bearer ${config.accessToken}`,
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
        
        // If token expired, try to refresh
        if (gscResponse.status === 401 && config.refreshToken) {
          // Token refresh would go here - for now return error
          return res.status(401).json({ 
            error: "GSC token expired",
            message: "Please reconnect Google Search Console.",
            requiresConnection: true
          });
        }
        
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
      const gscIntegration = await storage.getIntegration("gsc");
      
      if (!gscIntegration || gscIntegration.status !== "connected") {
        return res.status(400).json({ 
          error: "Google Search Console not connected",
          message: "Please connect Google Search Console in the Integrations page to view top pages.",
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

      // Call GSC API for top pages
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
      // Google Analytics 4 Data API requires a service account or OAuth
      // The VITE_GA_MEASUREMENT_ID is only for frontend tracking, not for reading data
      const gaIntegration = await storage.getIntegration("ga");
      
      if (!gaIntegration || gaIntegration.status !== "connected") {
        return res.status(400).json({ 
          error: "Google Analytics Data API not connected",
          message: "To view analytics data, you need to set up a Google Analytics Data API connection with a service account. The current GA Measurement ID is only for tracking, not for reading historical data.",
          requiresConnection: true,
          hint: "You'll need to create a service account in Google Cloud Console and grant it access to your GA4 property."
        });
      }

      // TODO: Implement actual GA4 Data API call
      return res.status(501).json({ 
        error: "GA Data API integration pending",
        message: "Google Analytics Data API integration requires a service account to be configured."
      });
    } catch (error) {
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
        // GA tracking is already set up via VITE_GA_MEASUREMENT_ID
        // For data API, we'd need a service account
        await storage.upsertIntegration({
          name: "ga",
          status: process.env.VITE_GA_MEASUREMENT_ID ? "configured" : "disconnected",
          lastSync: null,
          config: JSON.stringify({
            measurementId: process.env.VITE_GA_MEASUREMENT_ID || null,
            note: "Tracking is active. For historical data, a service account is needed."
          }),
        });
        
        res.json({ 
          success: true, 
          message: "Google Analytics tracking is active.",
          note: "To view historical analytics data, you'll need to set up a GA4 service account."
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
      const { targetKeyword, wordCount, recommendedKeywords, styleId } = req.body;
      
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

      const keywordsList = recommendedKeywords?.length 
        ? `Include these related keywords/phrases naturally: ${recommendedKeywords.join(", ")}`
        : "";

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
${styleInstructions}`;

      const userPrompt = `Write a comprehensive SEO-optimized article about "${targetKeyword}".

REQUIREMENTS:
- Primary keyword: "${targetKeyword}" - use naturally throughout (8-12 times)
${keywordsList ? `- ${keywordsList}` : ""}
- Word count: EXACTLY ${targetWordCount} words (count carefully!)

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

      const anthropic = new Anthropic({
        apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
      });

      // Set up SSE for streaming
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Calculate max tokens based on word count (roughly 1.5 tokens per word + buffer for HTML tags)
      const maxTokens = Math.min(16000, Math.max(4096, Math.ceil(targetWordCount * 2)));

      const stream = anthropic.messages.stream({
        model: "claude-sonnet-4-5",
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [
          { role: "user", content: userPrompt }
        ],
      });

      let fullContent = "";
      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          const content = event.delta.text;
          if (content) {
            fullContent += content;
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
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

  // ============ IMAGE GENERATION (Gemini Nano Banana) ============
  app.post("/api/images/generate", async (req, res) => {
    try {
      const { prompt, styleId, imageType, provider = "gemini" } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      // Get image style if provided
      let stylePrompt = "";
      let aspectRatio = "16:9";
      if (styleId) {
        const style = await storage.getImageStyle(styleId);
        if (style) {
          stylePrompt = style.stylePrompt || "";
          aspectRatio = style.aspectRatio || "16:9";
          if (style.additionalInstructions) {
            stylePrompt += " " + style.additionalInstructions;
          }
        }
      }

      const fullPrompt = stylePrompt 
        ? `${prompt}. Style: ${stylePrompt}. Aspect ratio: ${aspectRatio}`
        : `${prompt}. Aspect ratio: ${aspectRatio}`;

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

        res.json({
          imageData: `data:image/png;base64,${imageData}`,
          imageType: imageType || "featured",
          provider: "openai",
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
        res.json({
          imageData: `data:${mimeType};base64,${imagePart.inlineData.data}`,
          imageType: imageType || "featured",
          provider: "gemini",
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
Aspect Ratio: ${style.aspectRatio || "16:9"}

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
      const { content, imageUrl, imagePrompt } = req.body;
      
      if (!content || !imageUrl) {
        return res.status(400).json({ error: "Content and image URL are required" });
      }

      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      const prompt = `You are an expert content editor. Analyze this HTML blog post content and determine the BEST location to insert an image.

Image Description: ${imagePrompt || "Featured image for the article"}

Blog Content:
${content}

TASK: Find the most appropriate paragraph break to insert this image. The image should:
1. Be placed after a paragraph that relates to what the image shows
2. NOT be placed at the very beginning (after title is ok) or very end
3. Break up long sections of text naturally
4. Enhance the reader's understanding at that point in the article

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

      // Create the image HTML
      const imageHtml = caption 
        ? `<figure class="my-6"><img src="${imageUrl}" alt="${altText}" class="w-full rounded-md" /><figcaption class="text-center text-sm text-muted-foreground mt-2">${caption}</figcaption></figure>`
        : `<p><img src="${imageUrl}" alt="${altText}" class="w-full rounded-md my-6" /></p>`;

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
  app.post("/api/optimize/analyze", async (req, res) => {
    try {
      const { url, targetKeyword } = req.body;
      
      if (!url || !targetKeyword) {
        return res.status(400).json({ error: "URL and target keyword are required" });
      }

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
          startDate.setDate(startDate.getDate() - 30);
          const formatDate = (d: Date) => d.toISOString().split('T')[0];

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

      // Step 2: Scrape the target URL to get its content
      let pageContent = {
        title: "",
        metaDescription: "",
        headings: { h1: [] as string[], h2: [] as string[], h3: [] as string[] },
        wordCount: 0,
        content: "",
      };

      try {
        const pageResponse = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
        });
        
        if (pageResponse.ok) {
          const html = await pageResponse.text();
          
          // Extract title
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          pageContent.title = titleMatch ? titleMatch[1].trim() : "";
          
          // Extract meta description
          const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                               html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
          pageContent.metaDescription = metaDescMatch ? metaDescMatch[1].trim() : "";
          
          // Extract headings
          const h1Matches = html.match(/<h1[^>]*>([^<]+)<\/h1>/gi) || [];
          const h2Matches = html.match(/<h2[^>]*>([^<]+)<\/h2>/gi) || [];
          const h3Matches = html.match(/<h3[^>]*>([^<]+)<\/h3>/gi) || [];
          
          pageContent.headings.h1 = h1Matches.map(h => h.replace(/<[^>]+>/g, '').trim());
          pageContent.headings.h2 = h2Matches.map(h => h.replace(/<[^>]+>/g, '').trim());
          pageContent.headings.h3 = h3Matches.map(h => h.replace(/<[^>]+>/g, '').trim());
          
          // Extract main content and word count
          const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
          if (bodyMatch) {
            const textContent = bodyMatch[1]
              .replace(/<script[\s\S]*?<\/script>/gi, '')
              .replace(/<style[\s\S]*?<\/style>/gi, '')
              .replace(/<[^>]+>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
            pageContent.wordCount = textContent.split(/\s+/).filter(Boolean).length;
            pageContent.content = textContent.substring(0, 5000);
          }
          
          console.log(`[Optimize] Scraped page: ${pageContent.wordCount} words`);
        }
      } catch (scrapeError) {
        console.error("[Optimize] Page scrape error:", scrapeError);
      }

      // Step 3: Search Google for the target keyword and get competitors
      // Sites to skip (social media, UGC, etc.)
      const skipDomains = [
        'youtube.com', 'facebook.com', 'twitter.com', 'instagram.com', 'tiktok.com',
        'reddit.com', 'quora.com', 'linkedin.com', 'pinterest.com', 'tumblr.com',
        'medium.com', 'amazon.com', 'ebay.com', 'wikipedia.org', 'yelp.com',
        'tripadvisor.com', 'trustpilot.com'
      ];
      
      let competitors: Array<{
        url: string;
        title: string;
        metaDescription: string;
        headings: { h1: string[]; h2: string[]; h3: string[] };
        wordCount: number;
        contentSnippet: string;
      }> = [];

      try {
        // Use Google Custom Search API or scrape SERPs
        // For now, we'll provide a simulated flow - in production you'd use an API like SerpAPI
        console.log(`[Optimize] Searching for competitors ranking for "${targetKeyword}"`);
        
        // Try to fetch Google search results
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(targetKeyword)}&num=20`;
        const searchResponse = await fetch(searchUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
          },
        });

        if (searchResponse.ok) {
          const searchHtml = await searchResponse.text();
          
          // Extract URLs from search results (simplified extraction)
          const urlMatches = searchHtml.match(/href="\/url\?q=([^&"]+)/g) || [];
          const resultUrls: string[] = [];
          
          for (const match of urlMatches) {
            try {
              const urlPart = match.replace('href="/url?q=', '');
              const decodedUrl = decodeURIComponent(urlPart);
              const parsedUrl = new URL(decodedUrl);
              
              // Skip unwanted domains
              if (skipDomains.some(d => parsedUrl.hostname.includes(d))) {
                continue;
              }
              
              // Skip our own domain
              if (parsedUrl.hostname.includes('psychicsource.com')) {
                continue;
              }
              
              if (!resultUrls.includes(decodedUrl)) {
                resultUrls.push(decodedUrl);
              }
            } catch {
              // Skip invalid URLs
            }
          }

          console.log(`[Optimize] Found ${resultUrls.length} competitor URLs`);

          // Analyze top 5 competitor pages
          const competitorPromises = resultUrls.slice(0, 5).map(async (competitorUrl) => {
            try {
              const compResponse = await fetch(competitorUrl, {
                headers: {
                  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                },
                signal: AbortSignal.timeout(10000),
              });
              
              if (!compResponse.ok) return null;
              
              const compHtml = await compResponse.text();
              
              // Extract title
              const titleMatch = compHtml.match(/<title[^>]*>([^<]+)<\/title>/i);
              const title = titleMatch ? titleMatch[1].trim() : "";
              
              // Extract meta description
              const metaMatch = compHtml.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                               compHtml.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
              const metaDescription = metaMatch ? metaMatch[1].trim() : "";
              
              // Extract headings
              const h1s = (compHtml.match(/<h1[^>]*>([^<]+)<\/h1>/gi) || []).map(h => h.replace(/<[^>]+>/g, '').trim());
              const h2s = (compHtml.match(/<h2[^>]*>([^<]+)<\/h2>/gi) || []).map(h => h.replace(/<[^>]+>/g, '').trim());
              const h3s = (compHtml.match(/<h3[^>]*>([^<]+)<\/h3>/gi) || []).map(h => h.replace(/<[^>]+>/g, '').trim());
              
              // Get content
              const bodyMatch = compHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
              let wordCount = 0;
              let contentSnippet = "";
              
              if (bodyMatch) {
                const textContent = bodyMatch[1]
                  .replace(/<script[\s\S]*?<\/script>/gi, '')
                  .replace(/<style[\s\S]*?<\/style>/gi, '')
                  .replace(/<[^>]+>/g, ' ')
                  .replace(/\s+/g, ' ')
                  .trim();
                wordCount = textContent.split(/\s+/).filter(Boolean).length;
                contentSnippet = textContent.substring(0, 500);
              }
              
              return {
                url: competitorUrl,
                title,
                metaDescription,
                headings: { h1: h1s, h2: h2s, h3: h3s },
                wordCount,
                contentSnippet,
              };
            } catch {
              return null;
            }
          });
          
          const competitorResults = await Promise.all(competitorPromises);
          competitors = competitorResults.filter(Boolean) as typeof competitors;
          console.log(`[Optimize] Analyzed ${competitors.length} competitor pages`);
        }
      } catch (searchError) {
        console.error("[Optimize] Search error:", searchError);
      }

      // Step 4: Generate AI recommendations using Claude
      let recommendations: Array<{
        type: "title" | "meta" | "content" | "headings" | "keywords";
        priority: "high" | "medium" | "low";
        current: string;
        suggested: string;
        reason: string;
      }> = [];

      try {
        const anthropic = new Anthropic({
          apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
          baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
        });

        const analysisPrompt = `You are an expert SEO analyst. Analyze this article and compare it against competitors to provide specific, actionable recommendations.

TARGET KEYWORD: "${targetKeyword}"

YOUR PAGE ANALYSIS:
- Title: ${pageContent.title}
- Meta Description: ${pageContent.metaDescription}
- Word Count: ${pageContent.wordCount}
- H1 Tags: ${pageContent.headings.h1.join(", ") || "None"}
- H2 Tags: ${pageContent.headings.h2.join(", ") || "None"}
- H3 Tags: ${pageContent.headings.h3.join(", ") || "None"}
- Content Preview: ${pageContent.content.substring(0, 1000)}

RANKING KEYWORDS (keywords this page currently ranks for):
${keywords.length > 0 
  ? keywords.slice(0, 20).map(k => `- "${k.keyword}" (Position: ${k.position.toFixed(1)}, Clicks: ${k.clicks})`).join("\n")
  : "No ranking data available"}

TOP COMPETITORS:
${competitors.length > 0 
  ? competitors.map((c, i) => `
Competitor #${i + 1}: ${c.url}
- Title: ${c.title}
- Meta: ${c.metaDescription}
- Word Count: ${c.wordCount}
- H1s: ${c.headings.h1.join(", ") || "None"}
- H2s: ${c.headings.h2.slice(0, 5).join(", ") || "None"}
`).join("\n")
  : "No competitor data available"}

Provide specific recommendations to improve rankings for "${targetKeyword}". Focus on:
1. Title tag optimization (include keyword, make it compelling)
2. Meta description improvements
3. Content gaps vs competitors (length, topics, depth)
4. Heading structure improvements
5. Keyword usage and related terms

Return a JSON array of recommendations:
{
  "recommendations": [
    {
      "type": "title" | "meta" | "content" | "headings" | "keywords",
      "priority": "high" | "medium" | "low",
      "current": "What they currently have (or 'N/A')",
      "suggested": "Your specific suggestion with exact text when applicable",
      "reason": "Why this change will help rankings"
    }
  ]
}

Be specific. If suggesting a new title, write the full title. If suggesting adding content, be specific about topics to cover. Prioritize high-impact changes.`;

        const response = await anthropic.messages.create({
          model: "claude-sonnet-4-5",
          max_tokens: 2000,
          messages: [
            { role: "user", content: analysisPrompt }
          ],
        });

        const responseText = response.content[0].type === "text" ? response.content[0].text : "";
        
        // Extract JSON from response - try multiple patterns
        try {
          // First try to find JSON code block
          const codeBlockMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (codeBlockMatch) {
            const parsed = JSON.parse(codeBlockMatch[1].trim());
            recommendations = parsed.recommendations || [];
          } else {
            // Try to find raw JSON object
            const jsonMatch = responseText.match(/\{\s*"recommendations"\s*:\s*\[[\s\S]*?\]\s*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              recommendations = parsed.recommendations || [];
            }
          }
        } catch (parseError) {
          console.error("[Optimize] JSON parse error, trying fallback extraction");
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
        
        console.log(`[Optimize] Generated ${recommendations.length} recommendations`);
      } catch (aiError) {
        console.error("[Optimize] AI analysis error:", aiError);
      }

      // Return the complete analysis
      res.json({
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

  return httpServer;
}
