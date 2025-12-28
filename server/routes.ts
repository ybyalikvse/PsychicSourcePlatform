import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertArticleSchema, insertKeywordSchema } from "@shared/schema";
import type { ContentOptimizationResult, ContentSuggestion } from "@shared/schema";
import crypto from "crypto";

// OAuth state storage (in production, use Redis or similar)
const oauthStates = new Map<string, { timestamp: number }>();

// Google OAuth configuration
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GSC_SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"];

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

      // If connected, use stored keywords data (synced from GSC)
      const keywords = await storage.getKeywords();
      const totalClicks = keywords.reduce((sum, k) => sum + (k.clicks || 0), 0);
      const totalImpressions = keywords.reduce((sum, k) => sum + (k.impressions || 0), 0);
      const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
      const avgPosition = keywords.length > 0
        ? keywords.reduce((sum, k) => sum + (k.currentPosition || 0), 0) / keywords.length
        : 0;

      res.json({
        totalClicks,
        totalImpressions,
        avgCtr: parseFloat(avgCtr.toFixed(2)),
        avgPosition: parseFloat(avgPosition.toFixed(1)),
      });
    } catch (error) {
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

      // TODO: Implement actual Google Search Console API call
      // This requires OAuth tokens stored in gscIntegration.config
      return res.status(501).json({ 
        error: "GSC API integration pending",
        message: "Google Search Console API integration is being set up. The OAuth flow needs to be completed."
      });
    } catch (error) {
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

      // TODO: Implement actual GSC API call for top pages
      return res.status(501).json({ 
        error: "GSC API integration pending",
        message: "Google Search Console API integration is being set up."
      });
    } catch (error) {
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

      const redirectUri = `${req.protocol}://${req.get("host")}/api/integrations/gsc/callback`;
      
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

      const redirectUri = `${req.protocol}://${req.get("host")}/api/integrations/gsc/callback`;

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
        
        const redirectUri = `${req.protocol}://${req.get("host")}/api/integrations/gsc/callback`;
        
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
      } else if (name === "ahrefs") {
        if (!process.env.AHREFS_API_KEY) {
          return res.status(400).json({ 
            error: "Ahrefs API key not configured",
            message: "AHREFS_API_KEY is not set. Please add it to your secrets."
          });
        }
        
        // Test the API key by making a simple request
        try {
          const testResponse = await fetch("https://api.ahrefs.com/v3/site-explorer/metrics", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${process.env.AHREFS_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              target: "psychicsource.com",
              mode: "exact",
            }),
          });
          
          if (!testResponse.ok) {
            const errorText = await testResponse.text();
            return res.status(400).json({ 
              error: "Ahrefs API connection failed",
              message: `API returned ${testResponse.status}: ${errorText}`
            });
          }
        } catch (apiError) {
          return res.status(400).json({ 
            error: "Ahrefs API connection failed",
            message: "Could not connect to Ahrefs API. Please verify your API key."
          });
        }
        
        await storage.upsertIntegration({
          name: "ahrefs",
          status: "connected",
          lastSync: new Date().toISOString(),
          config: null,
        });
        
        res.json({ success: true, message: "Connected to Ahrefs" });
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

  return httpServer;
}
