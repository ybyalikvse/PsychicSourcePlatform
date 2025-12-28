import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertArticleSchema, insertKeywordSchema } from "@shared/schema";
import type { ContentOptimizationResult, ContentSuggestion } from "@shared/schema";

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
      // In production, this would fetch data from Google Search Console
      // For now, simulate a sync operation
      res.json({ success: true, message: "Keywords synced from Search Console" });
    } catch (error) {
      res.status(500).json({ error: "Failed to sync keywords" });
    }
  });

  // ============ PERFORMANCE (GSC Data) ============
  app.get("/api/performance/stats", async (req, res) => {
    try {
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
      // Generate sample chart data for the last 30 days
      const data = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const baseClicks = 100 + Math.floor(Math.random() * 50);
        const baseImpressions = baseClicks * (15 + Math.floor(Math.random() * 10));
        data.push({
          date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          clicks: baseClicks + Math.floor(i * 2),
          impressions: baseImpressions + Math.floor(i * 30),
          ctr: parseFloat(((baseClicks / baseImpressions) * 100).toFixed(2)),
          position: 8 + Math.random() * 4 - i * 0.05,
        });
      }
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chart data" });
    }
  });

  app.get("/api/performance/top-pages", async (req, res) => {
    try {
      // Sample top pages data
      const topPages = [
        { url: "https://www.psychicsource.com/how-to-get-psychic-reading", clicks: 1250, impressions: 45000, ctr: 2.78, position: 8.2 },
        { url: "https://www.psychicsource.com/tarot-card-meanings", clicks: 890, impressions: 32000, ctr: 2.78, position: 5.1 },
        { url: "https://www.psychicsource.com/love-psychics", clicks: 1800, impressions: 25000, ctr: 7.20, position: 3.4 },
        { url: "https://www.psychicsource.com/horoscopes", clicks: 650, impressions: 28000, ctr: 2.32, position: 12.3 },
        { url: "https://www.psychicsource.com/free-reading", clicks: 450, impressions: 28000, ctr: 1.61, position: 15.7 },
      ];
      res.json(topPages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch top pages" });
    }
  });

  // ============ ANALYTICS (GA Data) ============
  app.get("/api/analytics", async (req, res) => {
    try {
      const range = req.query.range as string || "30d";
      const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
      
      // Generate sample analytics data
      const chartData = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        chartData.push({
          date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          views: 500 + Math.floor(Math.random() * 300),
          visitors: 200 + Math.floor(Math.random() * 150),
        });
      }

      res.json({
        pageViews: chartData.reduce((sum, d) => sum + d.views, 0),
        uniqueVisitors: Math.floor(chartData.reduce((sum, d) => sum + d.visitors, 0) * 0.7),
        bounceRate: 42.5,
        avgSessionDuration: "2:34",
        topPages: [
          { page: "/how-to-get-psychic-reading", views: 4520 },
          { page: "/tarot-card-meanings", views: 3890 },
          { page: "/love-psychics", views: 3210 },
          { page: "/horoscopes", views: 2850 },
          { page: "/free-reading", views: 2340 },
        ],
        trafficSources: [
          { source: "Organic", value: 45 },
          { source: "Direct", value: 25 },
          { source: "Referral", value: 15 },
          { source: "Social", value: 10 },
          { source: "Paid", value: 5 },
        ],
        chartData,
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

  app.post("/api/integrations/:name/connect", async (req, res) => {
    try {
      const { name } = req.params;
      
      if (name === "gsc") {
        // For Google Search Console, we need OAuth
        const clientId = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID;
        if (!clientId) {
          return res.status(400).json({ error: "Google Search Console client ID not configured" });
        }
        
        // In production, this would redirect to Google OAuth
        // For now, simulate connection
        await storage.upsertIntegration({
          name: "gsc",
          status: "connected",
          lastSync: new Date().toISOString(),
          config: null,
        });
        
        res.json({ success: true, message: "Connected to Google Search Console" });
      } else if (name === "ahrefs") {
        if (!process.env.AHREFS_API_KEY) {
          return res.status(400).json({ error: "Ahrefs API key not configured" });
        }
        
        await storage.upsertIntegration({
          name: "ahrefs",
          status: "connected",
          lastSync: new Date().toISOString(),
          config: null,
        });
        
        res.json({ success: true, message: "Connected to Ahrefs" });
      } else if (name === "ga") {
        await storage.upsertIntegration({
          name: "ga",
          status: "connected",
          lastSync: new Date().toISOString(),
          config: null,
        });
        
        res.json({ success: true, message: "Connected to Google Analytics" });
      } else {
        res.status(404).json({ error: "Unknown integration" });
      }
    } catch (error) {
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
