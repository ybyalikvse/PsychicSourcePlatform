import { Router } from "express";
import type { Express } from "express";
import { storage } from "./storage";
import { insertCiCompetitorSchema } from "../shared/schema";
import {
  scrapeCompetitorVideos,
  fetchVideoTranscript,
  analyzeVideo,
  generateWeeklyBrief,
  generateScript,
  generatePerformanceReport,
  getWeekLabel,
} from "./services/content-intelligence";

function requireCronSecret(req: any, res: any, next: any) {
  const auth = req.headers.authorization;
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    // Allow if no CRON_SECRET is set (local dev) or if it matches
    if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }
  next();
}

export function registerCiRoutes(app: Express) {
  const router = Router();

  // ============================================================
  // COMPETITORS CRUD
  // ============================================================

  router.get("/competitors", async (req, res) => {
    try {
      const activeOnly = req.query.active === "true" ? true : undefined;
      const competitors = await storage.getCiCompetitors(activeOnly);
      res.json(competitors);
    } catch (error) {
      console.error("[CI] Error fetching competitors:", error);
      res.status(500).json({ error: "Failed to fetch competitors" });
    }
  });

  router.post("/competitors", async (req, res) => {
    try {
      const data = insertCiCompetitorSchema.parse(req.body);
      const competitor = await storage.createCiCompetitor(data);
      res.status(201).json(competitor);
    } catch (error: any) {
      if (error?.name === "ZodError") {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("[CI] Error creating competitor:", error);
      res.status(500).json({ error: "Failed to create competitor" });
    }
  });

  router.patch("/competitors/:id", async (req, res) => {
    try {
      const { handle, displayName, display_name, platform, isActive, active, is_active, notes } = req.body;
      const updates: any = {};
      if (handle !== undefined) updates.handle = handle;
      if (displayName !== undefined || display_name !== undefined) updates.displayName = displayName ?? display_name;
      if (platform !== undefined) updates.platform = platform;
      if (isActive !== undefined || active !== undefined || is_active !== undefined) updates.isActive = isActive ?? active ?? is_active;
      if (notes !== undefined) updates.notes = notes;
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }
      const competitor = await storage.updateCiCompetitor(req.params.id, updates);
      if (!competitor) {
        return res.status(404).json({ error: "Competitor not found" });
      }
      res.json(competitor);
    } catch (error) {
      console.error("[CI] Error updating competitor:", error);
      res.status(500).json({ error: "Failed to update competitor" });
    }
  });

  router.delete("/competitors/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteCiCompetitor(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Competitor not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("[CI] Error deleting competitor:", error);
      res.status(500).json({ error: "Failed to delete competitor" });
    }
  });

  // ============================================================
  // PIPELINE ENDPOINTS (protected by CRON_SECRET)
  // ============================================================

  router.post("/pipeline/scrape", requireCronSecret, async (req, res) => {
    try {
      const { competitorId } = req.body;
      const competitor = await storage.getCiCompetitor(competitorId);
      if (!competitor) {
        return res.status(404).json({ error: "Competitor not found" });
      }

      const apiKeySetting = await storage.getCiSetting("scrape_creators_api_key");
      const apiKey = apiKeySetting?.value || process.env.SCRAPE_CREATORS_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: "ScrapeCreators API key not configured" });
      }

      const minViewsSetting = await storage.getCiSetting("scrape_min_views");
      const minViews = minViewsSetting ? parseInt(minViewsSetting.value, 10) : 50000;

      const maxAgeSetting = await storage.getCiSetting("scrape_max_age_days");
      const maxAgeDays = maxAgeSetting ? parseInt(maxAgeSetting.value, 10) : 30;

      const limitSetting = await storage.getCiSetting("scrape_limit");
      const limit = limitSetting ? parseInt(limitSetting.value, 10) : 30;

      const videos = await scrapeCompetitorVideos(competitor.handle, apiKey, limit);

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

      let saved = 0;
      let skipped = 0;

      for (const video of videos) {
        // Support ScrapeCreators aweme_list format and generic formats
        const externalId = video.aweme_id || video.id || video.video_id || video.videoId;
        if (!externalId) continue;

        // Skip if already scraped
        const existing = await storage.getCiScrapedVideoByExternalId(String(externalId));
        if (existing) {
          skipped++;
          continue;
        }

        const stats = video.statistics || video.stats || {};
        const views = stats.play_count ?? stats.playCount ?? video.views ?? video.viewCount ?? 0;
        if (views < minViews) {
          skipped++;
          continue;
        }

        // Skip old videos
        const postedAt = video.create_time || video.createTime || video.posted_at || video.postedAt;
        if (postedAt) {
          const postedDate = new Date(typeof postedAt === "number" ? postedAt * 1000 : postedAt);
          if (postedDate < cutoffDate) {
            skipped++;
            continue;
          }
        }

        await storage.createCiScrapedVideo({
          competitorId: competitor.id,
          externalVideoId: String(externalId),
          url: (video.share_url || video.url || video.video_url || `https://www.tiktok.com/@${competitor.handle}/video/${externalId}`).split("?")[0],
          caption: video.desc || video.caption || video.description || null,
          viewCount: views,
          likeCount: stats.digg_count ?? stats.diggCount ?? video.likes ?? video.likeCount ?? 0,
          commentCount: stats.comment_count ?? stats.commentCount ?? video.comments ?? video.commentCount ?? 0,
          shareCount: stats.share_count ?? stats.shareCount ?? video.shares ?? video.shareCount ?? 0,
          duration: video.video?.duration ?? video.duration ?? null,
          postedAt: postedAt ? new Date(typeof postedAt === "number" ? postedAt * 1000 : postedAt).toISOString() : null,
          transcriptStatus: "pending",
          analysisStatus: "pending",
          metadata: video,
        });
        saved++;
      }

      // Update competitor lastScrapedAt
      await storage.updateCiCompetitor(competitor.id, {
        lastScrapedAt: new Date().toISOString(),
      });

      await storage.upsertCiSetting("pipeline_last_run_scrape", new Date().toISOString());
      res.json({ success: true, saved, skipped, total: videos.length });
    } catch (error) {
      console.error("[CI] Pipeline scrape error:", error);
      res.status(500).json({ error: "Scrape pipeline failed" });
    }
  });

  router.post("/pipeline/transcript", requireCronSecret, async (req, res) => {
    try {
      const { videoId } = req.body;
      const video = await storage.getCiScrapedVideo(videoId);
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }

      const apiKeySetting = await storage.getCiSetting("scrape_creators_api_key");
      const apiKey = apiKeySetting?.value || process.env.SCRAPE_CREATORS_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: "ScrapeCreators API key not configured" });
      }

      const transcript = await fetchVideoTranscript(video.url, apiKey);

      if (transcript) {
        await storage.updateCiScrapedVideo(video.id, {
          transcript,
          transcriptStatus: "completed",
        });
        res.json({ success: true, transcriptLength: transcript.length });
      } else {
        await storage.updateCiScrapedVideo(video.id, {
          transcriptStatus: "failed",
        });
        res.json({ success: false, message: "Transcript unavailable" });
      }
    } catch (error) {
      console.error("[CI] Pipeline transcript error:", error);
      res.status(500).json({ error: "Transcript pipeline failed" });
    }
  });

  router.post("/pipeline/analyze", requireCronSecret, async (req, res) => {
    try {
      const { videoId } = req.body;
      const video = await storage.getCiScrapedVideo(videoId);
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }
      if (!video.transcript) {
        return res.status(400).json({ error: "Video has no transcript" });
      }

      // Get competitor for handle
      const competitor = await storage.getCiCompetitor(video.competitorId);

      // Get analysis prompts from settings
      const systemPromptSetting = await storage.getCiSetting("analysis_system_prompt");
      const userPromptSetting = await storage.getCiSetting("analysis_user_prompt");
      const modelSetting = await storage.getCiSetting("ai_model");
      const blockedTopicsSetting = await storage.getCiSetting("blocked_topics");
      const topicCategoriesSetting = await storage.getCiSetting("topic_categories");
      const hookTypesSetting = await storage.getCiSetting("hook_types");

      if (!systemPromptSetting?.value || !userPromptSetting?.value) {
        return res.status(400).json({ error: "Analysis prompts not configured. Run POST /api/ci/settings/seed first." });
      }

      // Replace taxonomy placeholders in user prompt
      let userPrompt = userPromptSetting.value;
      if (blockedTopicsSetting?.value) {
        const blocked = JSON.parse(blockedTopicsSetting.value);
        userPrompt = userPrompt.replace(/{BLOCKED_TOPICS}/g, blocked.join("\n"));
      }
      if (topicCategoriesSetting?.value) {
        const categories = JSON.parse(topicCategoriesSetting.value);
        userPrompt = userPrompt.replace(/{TOPIC_CATEGORIES}/g, categories.join("\n"));
      }
      if (hookTypesSetting?.value) {
        const hooks = JSON.parse(hookTypesSetting.value);
        userPrompt = userPrompt.replace(/{HOOK_TYPES}/g, hooks.join("\n"));
      }

      const analysis = await analyzeVideo({
        transcript: video.transcript,
        caption: video.caption || "",
        viewCount: video.viewCount ?? 0,
        likeCount: video.likeCount ?? 0,
        commentCount: video.commentCount ?? 0,
        shareCount: video.shareCount ?? 0,
        handle: competitor?.handle || "unknown",
        platform: competitor?.platform || "tiktok",
        systemPrompt: systemPromptSetting.value,
        userPromptTemplate: userPrompt,
        model: modelSetting?.value || "anthropic/claude-sonnet-4-5",
      });

      const weekLabel = getWeekLabel();

      await storage.createCiVideoAnalysis({
        scrapedVideoId: video.id,
        blocked: analysis.blocked || false,
        blockReason: analysis.block_reason || null,
        topicCategory: analysis.topic_category || null,
        topicSummary: analysis.topic_summary || null,
        hookText: analysis.hook_text || null,
        hookType: analysis.hook_type || null,
        hookSummary: analysis.hook_summary || null,
        emotionalAngle: analysis.emotional_angle || null,
        targetAudience: analysis.target_audience || null,
        format: analysis.format || null,
        ctaType: analysis.cta_type || null,
        replicationScore: analysis.replication_score || null,
        notes: analysis.notes || null,
        rawAnalysis: analysis,
        weekAdded: weekLabel,
      });

      await storage.updateCiScrapedVideo(video.id, {
        analysisStatus: "completed",
      });

      res.json({ success: true, analysis });
    } catch (error: any) {
      console.error("[CI] Pipeline analyze error:", error?.message || error);
      res.status(500).json({ error: "Analysis pipeline failed: " + (error?.message || "Unknown error") });
    }
  });

  router.post("/pipeline/generate-brief", requireCronSecret, async (req, res) => {
    try {
      const weekLabel = getWeekLabel();

      // Get all analyses from current week
      const analyses = await storage.getCiVideoAnalyses({ weekAdded: weekLabel });
      if (analyses.length === 0) {
        return res.status(400).json({ error: "No analyses found for current week" });
      }

      // Get brief prompts from settings
      const systemPromptSetting = await storage.getCiSetting("brief_system_prompt");
      const userPromptSetting = await storage.getCiSetting("brief_user_prompt");
      const modelSetting = await storage.getCiSetting("ai_model");

      if (!systemPromptSetting?.value || !userPromptSetting?.value) {
        return res.status(400).json({ error: "Brief prompts not configured. Run POST /api/ci/settings/seed first." });
      }

      const briefResult = await generateWeeklyBrief({
        analyses,
        systemPrompt: systemPromptSetting.value,
        userPromptTemplate: userPromptSetting.value,
        model: modelSetting?.value || "anthropic/claude-sonnet-4-5",
      });

      // Aggregate top data for storage
      const topicCounts: Record<string, number> = {};
      const hookCounts: Record<string, number> = {};
      const emotionCounts: Record<string, number> = {};

      for (const a of analyses) {
        if (a.topicCategory) topicCounts[a.topicCategory] = (topicCounts[a.topicCategory] || 0) + 1;
        if (a.hookType) hookCounts[a.hookType] = (hookCounts[a.hookType] || 0) + 1;
        if (a.emotionalAngle) emotionCounts[a.emotionalAngle] = (emotionCounts[a.emotionalAngle] || 0) + 1;
      }

      const brief = await storage.createCiContentBrief({
        weekLabel,
        briefData: briefResult,
        topTopics: Object.entries(topicCounts).sort((a, b) => b[1] - a[1]).slice(0, 5),
        topHookTypes: Object.entries(hookCounts).sort((a, b) => b[1] - a[1]).slice(0, 5),
        topEmotionalAngles: Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]).slice(0, 5),
        videoCount: analyses.length,
        status: "draft",
      });

      res.json({ success: true, brief });
    } catch (error) {
      console.error("[CI] Pipeline generate-brief error:", error);
      res.status(500).json({ error: "Brief generation failed" });
    }
  });

  router.post("/pipeline/generate-script", requireCronSecret, async (req, res) => {
    try {
      const { briefId, briefItemIndex, creatorName, creatorStyle, platform, duration } = req.body;

      const brief = await storage.getCiContentBrief(briefId);
      if (!brief) {
        return res.status(404).json({ error: "Brief not found" });
      }

      const briefData = brief.briefData as any;
      const items = Array.isArray(briefData) ? briefData : briefData?.briefs || briefData?.items || [];
      const itemIndex = briefItemIndex ?? 0;
      const briefItem = items[itemIndex];
      if (!briefItem) {
        return res.status(400).json({ error: `Brief item at index ${itemIndex} not found` });
      }

      // Get script prompts from settings
      const systemPromptSetting = await storage.getCiSetting("script_system_prompt");
      const userPromptSetting = await storage.getCiSetting("script_user_prompt");
      const modelSetting = await storage.getCiSetting("ai_model");

      if (!systemPromptSetting?.value || !userPromptSetting?.value) {
        return res.status(400).json({ error: "Script prompts not configured. Run POST /api/ci/settings/seed first." });
      }

      const scriptContent = await generateScript({
        briefItem,
        systemPrompt: systemPromptSetting.value,
        userPromptTemplate: userPromptSetting.value,
        creatorName: creatorName || "Creator",
        creatorStyle: creatorStyle || "warm and conversational",
        platform: platform || "tiktok",
        duration: duration || "60-90 seconds",
        model: modelSetting?.value || "anthropic/claude-sonnet-4-5",
      });

      // Parse script sections from content if possible
      let hook = "";
      let body = "";
      let closeCta = "";

      if (typeof scriptContent === "string") {
        const hookMatch = scriptContent.match(/HOOK[:\s]*\n?([\s\S]*?)(?=\nBODY|$)/i);
        const bodyMatch = scriptContent.match(/BODY[:\s]*\n?([\s\S]*?)(?=\nCLOSE|$)/i);
        const ctaMatch = scriptContent.match(/CLOSE[^:]*:[:\s]*\n?([\s\S]*?)$/i);
        hook = hookMatch?.[1]?.trim() || "";
        body = bodyMatch?.[1]?.trim() || "";
        closeCta = ctaMatch?.[1]?.trim() || "";
      }

      const script = await storage.createCiBriefScript({
        briefId: brief.id,
        briefItemIndex: itemIndex,
        title: briefItem.title || `Script from ${brief.weekLabel}`,
        hook,
        body,
        closeCta,
        creatorName: creatorName || null,
        creatorStyle: creatorStyle || null,
        platform: platform || "tiktok",
        duration: duration || "60-90 seconds",
        rawScript: typeof scriptContent === "string" ? { text: scriptContent } : scriptContent,
        status: "draft",
      });

      res.json({ success: true, script });
    } catch (error) {
      console.error("[CI] Pipeline generate-script error:", error);
      res.status(500).json({ error: "Script generation failed" });
    }
  });

  router.post("/pipeline/performance-report", requireCronSecret, async (req, res) => {
    try {
      const weekLabel = getWeekLabel();

      // Get own handle from settings to scrape own videos
      const ownHandleSetting = await storage.getCiSetting("own_handle");
      const apiKeySetting = await storage.getCiSetting("scrape_creators_api_key");

      let ownVideos: any[] = [];
      if (ownHandleSetting?.value && apiKeySetting?.value) {
        ownVideos = await scrapeCompetitorVideos(ownHandleSetting.value, apiKey, 20);
      }

      // Get recent briefs
      const briefs = await storage.getCiContentBriefs();
      const recentBriefs = briefs.slice(0, 4); // last 4 briefs

      // Get performance prompts from settings
      const systemPromptSetting = await storage.getCiSetting("performance_system_prompt");
      const userPromptSetting = await storage.getCiSetting("performance_user_prompt");
      const modelSetting = await storage.getCiSetting("ai_model");

      if (!systemPromptSetting?.value || !userPromptSetting?.value) {
        return res.status(400).json({ error: "Performance prompts not configured. Run POST /api/ci/settings/seed first." });
      }

      const report = await generatePerformanceReport({
        ownVideos,
        briefs: recentBriefs,
        systemPrompt: systemPromptSetting.value,
        userPromptTemplate: userPromptSetting.value,
        model: modelSetting?.value || "anthropic/claude-sonnet-4-5",
      });

      const saved = await storage.createCiPerformanceReport({
        weekLabel,
        ownVideosData: ownVideos,
        matchingBriefs: recentBriefs,
        topPerformingTopics: report.top_performing_topics || null,
        topPerformingHookTypes: report.top_performing_hook_types || null,
        underperformingTopics: report.underperforming_topics || null,
        patterns: report.patterns || null,
        recommendation: report.recommendation || null,
        rawReport: report,
      });

      res.json({ success: true, report: saved });
    } catch (error) {
      console.error("[CI] Pipeline performance-report error:", error);
      res.status(500).json({ error: "Performance report generation failed" });
    }
  });

  // ============================================================
  // PIPELINE STATUS & MANUAL TRIGGERS (no auth required — admin UI)
  // ============================================================

  // Get last-run timestamps for all pipeline steps
  router.get("/pipeline/status", async (_req, res) => {
    try {
      const steps = ["scrape", "transcripts", "analyze", "brief", "scripts", "performance"];
      const status: Record<string, string | null> = {};
      for (const step of steps) {
        const setting = await storage.getCiSetting(`pipeline_last_run_${step}`);
        status[step] = setting?.value || null;
      }
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pipeline status" });
    }
  });

  // Run a single pipeline step from the dashboard (no CRON_SECRET needed)
  router.post("/pipeline/run-step", async (req, res) => {
    try {
      const { step } = req.body;
      if (!["scrape", "transcripts", "analyze", "brief", "scripts", "performance"].includes(step)) {
        return res.status(400).json({ error: "Invalid step" });
      }

      // For scrape: run for all active competitors
      if (step === "scrape") {
        const competitors = await storage.getCiCompetitors(true);
        const apiKeySetting = await storage.getCiSetting("scrape_creators_api_key");
        const apiKey = apiKeySetting?.value || process.env.SCRAPE_CREATORS_API_KEY;
        if (!apiKey) return res.status(400).json({ error: "ScrapeCreators API key not configured" });

        const minViewsSetting = await storage.getCiSetting("scrape_min_views");
        const minViews = minViewsSetting ? parseInt(minViewsSetting.value, 10) : 50000;
        const maxAgeSetting = await storage.getCiSetting("scrape_max_age_days");
        const maxAgeDays = maxAgeSetting ? parseInt(maxAgeSetting.value, 10) : 30;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

        let totalSaved = 0;
        for (const competitor of competitors) {
          const videos = await scrapeCompetitorVideos(competitor.handle, apiKey, 30);
          for (const video of videos) {
            const externalId = video.aweme_id || video.id;
            if (!externalId) continue;
            const existing = await storage.getCiScrapedVideoByExternalId(String(externalId));
            if (existing) continue;
            const stats = video.statistics || video.stats || {};
            const views = stats.play_count ?? stats.playCount ?? 0;
            if (views < minViews) continue;
            const postedAt = video.create_time || video.createTime;
            if (postedAt) {
              const postedDate = new Date(typeof postedAt === "number" ? postedAt * 1000 : postedAt);
              if (postedDate < cutoffDate) continue;
            }
            await storage.createCiScrapedVideo({
              competitorId: competitor.id,
              externalVideoId: String(externalId),
              url: (video.share_url || `https://www.tiktok.com/@${competitor.handle}/video/${externalId}`).split("?")[0],
              caption: video.desc || null,
              viewCount: views,
              likeCount: stats.digg_count ?? 0,
              commentCount: stats.comment_count ?? 0,
              shareCount: stats.share_count ?? 0,
              duration: video.video?.duration ?? null,
              postedAt: postedAt ? new Date(typeof postedAt === "number" ? postedAt * 1000 : postedAt).toISOString() : null,
              transcriptStatus: "pending",
              analysisStatus: "pending",
              metadata: video,
            });
            totalSaved++;
          }
          await storage.updateCiCompetitor(competitor.id, { lastScrapedAt: new Date().toISOString() });
        }
        await storage.upsertCiSetting(`pipeline_last_run_scrape`, new Date().toISOString());
        return res.json({ success: true, step, saved: totalSaved, competitors: competitors.length });
      }

      // For transcripts: process all pending
      if (step === "transcripts") {
        const videos = await storage.getCiScrapedVideos({ transcriptStatus: "pending" });
        const apiKeySetting = await storage.getCiSetting("scrape_creators_api_key");
        const apiKey = apiKeySetting?.value || process.env.SCRAPE_CREATORS_API_KEY;
        let fetched = 0;
        for (const video of videos.slice(0, 50)) {
          const transcript = await fetchVideoTranscript(video.url, apiKey || "");
          await storage.updateCiScrapedVideo(video.id, {
            transcript: transcript || undefined,
            transcriptStatus: transcript ? "completed" : "failed",
          } as any);
          if (transcript) fetched++;
        }
        await storage.upsertCiSetting(`pipeline_last_run_transcripts`, new Date().toISOString());
        return res.json({ success: true, step, fetched, total: videos.length });
      }

      // For analyze: process all with transcripts
      if (step === "analyze") {
        const videos = await storage.getCiScrapedVideos({ transcriptStatus: "completed", analysisStatus: "pending" });
        const systemPromptSetting = await storage.getCiSetting("analysis_system_prompt");
        const userPromptSetting = await storage.getCiSetting("analysis_user_prompt");
        const modelSetting = await storage.getCiSetting("ai_model");
        const blockedTopicsSetting = await storage.getCiSetting("blocked_topics");
        const topicCategoriesSetting = await storage.getCiSetting("topic_categories");
        const hookTypesSetting = await storage.getCiSetting("hook_types");

        if (!systemPromptSetting?.value || !userPromptSetting?.value) {
          return res.status(400).json({ error: "Analysis prompts not configured" });
        }

        let userPromptTemplate = userPromptSetting.value;
        if (blockedTopicsSetting?.value) userPromptTemplate = userPromptTemplate.replace(/{BLOCKED_TOPICS}/g, JSON.parse(blockedTopicsSetting.value).join("\n"));
        if (topicCategoriesSetting?.value) userPromptTemplate = userPromptTemplate.replace(/{TOPIC_CATEGORIES}/g, JSON.parse(topicCategoriesSetting.value).join("\n"));
        if (hookTypesSetting?.value) userPromptTemplate = userPromptTemplate.replace(/{HOOK_TYPES}/g, JSON.parse(hookTypesSetting.value).join("\n"));

        let analyzed = 0;
        for (const video of videos) {
          try {
            const competitor = await storage.getCiCompetitor(video.competitorId);
            const analysis = await analyzeVideo({
              transcript: video.transcript || "",
              caption: video.caption || "",
              viewCount: video.viewCount ?? 0,
              likeCount: video.likeCount ?? 0,
              commentCount: video.commentCount ?? 0,
              shareCount: video.shareCount ?? 0,
              handle: competitor?.handle || "unknown",
              platform: competitor?.platform || "tiktok",
              systemPrompt: systemPromptSetting.value,
              userPromptTemplate,
              model: modelSetting?.value || "anthropic/claude-sonnet-4-5",
            });
            await storage.createCiVideoAnalysis({
              scrapedVideoId: video.id,
              blocked: analysis.blocked || false,
              blockReason: analysis.block_reason || null,
              topicCategory: analysis.topic_category || null,
              topicSummary: analysis.topic_summary || null,
              hookText: analysis.hook_text || null,
              hookType: analysis.hook_type || null,
              hookSummary: analysis.hook_summary || null,
              emotionalAngle: analysis.emotional_angle || null,
              targetAudience: analysis.target_audience || null,
              format: analysis.format || null,
              ctaType: analysis.cta_type || null,
              replicationScore: analysis.replication_score || null,
              notes: analysis.notes || null,
              rawAnalysis: analysis,
              weekAdded: getWeekLabel(),
            });
            await storage.updateCiScrapedVideo(video.id, { analysisStatus: "completed" } as any);
            analyzed++;
          } catch (err) {
            console.error(`[CI] Failed to analyze video ${video.id}:`, err);
          }
        }
        await storage.upsertCiSetting(`pipeline_last_run_analyze`, new Date().toISOString());
        return res.json({ success: true, step, analyzed, total: videos.length });
      }

      // For brief: generate weekly brief directly
      if (step === "brief") {
        const analyses = await storage.getCiVideoAnalyses({ weekAdded: getWeekLabel() });
        if (analyses.length === 0) {
          return res.status(400).json({ error: "No analyses found for this week" });
        }
        const briefSystemPrompt = await storage.getCiSetting("brief_system_prompt");
        const briefUserPrompt = await storage.getCiSetting("brief_user_prompt");
        const modelSetting = await storage.getCiSetting("ai_model");
        const briefResult = await generateWeeklyBrief({
          analyses: analyses.map(a => ({
            topicCategory: a.topicCategory,
            hookType: a.hookType,
            emotionalAngle: a.emotionalAngle,
            replicationScore: a.replicationScore,
            topicSummary: a.topicSummary,
          })),
          systemPrompt: briefSystemPrompt?.value || "",
          userPromptTemplate: briefUserPrompt?.value || "",
          model: modelSetting?.value || "anthropic/claude-sonnet-4-5",
        });
        const briefData = Array.isArray(briefResult) ? briefResult : briefResult?.briefs || briefResult?.items || [briefResult];
        const topicCounts: Record<string, number> = {};
        const hookCounts: Record<string, number> = {};
        const emotionCounts: Record<string, number> = {};
        for (const a of analyses) {
          if (a.topicCategory) topicCounts[a.topicCategory] = (topicCounts[a.topicCategory] || 0) + 1;
          if (a.hookType) hookCounts[a.hookType] = (hookCounts[a.hookType] || 0) + 1;
          if (a.emotionalAngle) emotionCounts[a.emotionalAngle] = (emotionCounts[a.emotionalAngle] || 0) + 1;
        }
        const saved = await storage.createCiContentBrief({
          weekLabel: getWeekLabel(),
          briefData: briefData,
          topTopics: Object.entries(topicCounts).sort((a, b) => b[1] - a[1]),
          topHookTypes: Object.entries(hookCounts).sort((a, b) => b[1] - a[1]),
          topEmotionalAngles: Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]),
          videoCount: analyses.length,
          status: "draft",
        });
        await storage.upsertCiSetting("pipeline_last_run_brief", new Date().toISOString());
        return res.json({ success: true, step, brief: saved });
      }

      // For scripts: generate from latest brief
      if (step === "scripts") {
        // Support generating a single script by briefId + itemIndex, or all scripts for latest brief
        const targetBriefId = req.body.briefId;
        const targetItemIndex = req.body.itemIndex !== undefined ? Number(req.body.itemIndex) : undefined;

        let brief;
        if (targetBriefId) {
          brief = await storage.getCiContentBrief(targetBriefId);
        } else {
          const briefs = await storage.getCiContentBriefs();
          brief = briefs[0];
        }
        if (!brief) return res.status(400).json({ error: "No brief found" });
        const scriptSystemPrompt = await storage.getCiSetting("script_system_prompt");
        const scriptUserPrompt = await storage.getCiSetting("script_user_prompt");
        const modelSetting = await storage.getCiSetting("ai_model");
        const allItems = Array.isArray(brief.briefData) ? brief.briefData as any[] : [];
        const items = targetItemIndex !== undefined ? [{ item: allItems[targetItemIndex], index: targetItemIndex }] : allItems.map((item, index) => ({ item, index }));
        let generated = 0;
        for (const { item, index: i } of items) {
          if (!item) continue;
          try {
            const script = await generateScript({
              briefItem: item,
              systemPrompt: scriptSystemPrompt?.value || "",
              userPromptTemplate: scriptUserPrompt?.value || "",
              creatorName: "Creator",
              creatorStyle: "warm and nurturing",
              platform: "TikTok",
              duration: item?.estimated_length || "60-90 seconds",
              model: modelSetting?.value || "anthropic/claude-sonnet-4-5",
            });
            const scriptText = typeof script === "string" ? script : JSON.stringify(script);
            const hookMatch = scriptText.match(/HOOK[:\s]*\n?([\s\S]*?)(?=BODY|$)/i);
            const bodyMatch = scriptText.match(/BODY[:\s]*\n?([\s\S]*?)(?=CLOSE|CTA|$)/i);
            const ctaMatch = scriptText.match(/(?:CLOSE|CTA)[:\s]*\n?([\s\S]*?)$/i);
            await storage.createCiBriefScript({
              briefId: brief.id,
              briefItemIndex: i,
              title: item?.title || `Script ${i + 1}`,
              hook: hookMatch?.[1]?.trim() || null,
              body: bodyMatch?.[1]?.trim() || scriptText,
              closeCta: ctaMatch?.[1]?.trim() || null,
              status: "draft",
              rawScript: { full: scriptText },
            });
            generated++;
          } catch (err) {
            console.error(`[CI] Script generation failed for item ${i}:`, err);
          }
        }
        await storage.upsertCiSetting("pipeline_last_run_scripts", new Date().toISOString());
        return res.json({ success: true, step, generated, total: items.length });
      }

      // For performance
      if (step === "performance") {
        const perfSystemPrompt = await storage.getCiSetting("performance_system_prompt");
        const perfUserPrompt = await storage.getCiSetting("performance_user_prompt");
        const modelSetting = await storage.getCiSetting("ai_model");
        const report = await generatePerformanceReport({
          ownVideos: [],
          briefs: [],
          systemPrompt: perfSystemPrompt?.value || "",
          userPromptTemplate: perfUserPrompt?.value || "",
          model: modelSetting?.value || "anthropic/claude-sonnet-4-5",
        });
        await storage.createCiPerformanceReport({
          weekLabel: getWeekLabel(),
          rawReport: report,
          patterns: report?.patterns || null,
          recommendation: report?.recommendation || null,
        });
        await storage.upsertCiSetting("pipeline_last_run_performance", new Date().toISOString());
        return res.json({ success: true, step });
      }

      res.status(400).json({ error: "Step not implemented" });
    } catch (error: any) {
      console.error("[CI] Run step error:", error?.message || error);
      res.status(500).json({ error: "Pipeline step failed: " + (error?.message || "Unknown error") });
    }
  });

  // ============================================================
  // DATA BROWSING
  // ============================================================

  router.get("/videos", async (req, res) => {
    try {
      const filters: any = {};
      if (req.query.competitorId) filters.competitorId = req.query.competitorId as string;
      if (req.query.transcriptStatus) filters.transcriptStatus = req.query.transcriptStatus as string;
      if (req.query.analysisStatus) filters.analysisStatus = req.query.analysisStatus as string;
      if (req.query.minViews) filters.minViews = parseInt(req.query.minViews as string, 10);

      const videos = await storage.getCiScrapedVideos(filters);
      // Support ?fields=id to return only IDs (for GitHub Actions workflow)
      if (req.query.fields === "id") {
        return res.json(videos.map(v => ({ id: v.id })));
      }
      res.json(videos);
    } catch (error) {
      console.error("[CI] Error fetching videos:", error);
      res.status(500).json({ error: "Failed to fetch videos" });
    }
  });

  router.get("/videos/:id", async (req, res) => {
    try {
      const video = await storage.getCiScrapedVideo(req.params.id);
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }

      const analysis = await storage.getCiVideoAnalysisByVideoId(video.id);
      res.json({ ...video, analysis });
    } catch (error) {
      console.error("[CI] Error fetching video:", error);
      res.status(500).json({ error: "Failed to fetch video" });
    }
  });

  router.get("/analyses", async (req, res) => {
    try {
      const filters: any = {};
      if (req.query.hookType) filters.hookType = req.query.hookType as string;
      if (req.query.topicCategory) filters.topicCategory = req.query.topicCategory as string;
      if (req.query.minReplicationScore) filters.minReplicationScore = parseInt(req.query.minReplicationScore as string, 10);
      if (req.query.weekAdded) filters.weekAdded = req.query.weekAdded as string;

      const analyses = await storage.getCiVideoAnalyses(filters);

      // Batch-load all videos and competitors upfront (avoids N+1 queries)
      const allVideos = await storage.getCiScrapedVideos({});
      const allCompetitors = await storage.getCiCompetitors();
      const videoMap = new Map(allVideos.map(v => [v.id, v]));
      const competitorMap = new Map(allCompetitors.map(c => [c.id, c]));

      const enriched = analyses.map((a) => {
        const video = videoMap.get(a.scrapedVideoId);
        const competitor = video ? competitorMap.get(video.competitorId) : null;
        return {
          ...a,
          creator: competitor?.handle || "unknown",
          platform: competitor?.platform || "tiktok",
          views: video?.viewCount ?? 0,
          videoUrl: video?.url || null,
          likes: video?.likeCount ?? 0,
          shares: video?.shareCount ?? 0,
          comments: video?.commentCount ?? 0,
          postedAt: video?.postedAt || null,
          transcriptPreview: video?.transcript ? video.transcript.substring(0, 200) + (video.transcript.length > 200 ? "..." : "") : null,
          transcript: video?.transcript || null,
        };
      });

      res.json(enriched);
    } catch (error) {
      console.error("[CI] Error fetching analyses:", error);
      res.status(500).json({ error: "Failed to fetch analyses" });
    }
  });

  router.delete("/analyses/:id", async (req, res) => {
    try {
      await storage.deleteCiVideoAnalysis(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete analysis" });
    }
  });

  router.delete("/videos/:id", async (req, res) => {
    try {
      await storage.deleteCiScrapedVideo(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete video" });
    }
  });

  router.get("/briefs", async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const briefs = await storage.getCiContentBriefs(status);
      res.json(briefs);
    } catch (error) {
      console.error("[CI] Error fetching briefs:", error);
      res.status(500).json({ error: "Failed to fetch briefs" });
    }
  });

  router.get("/briefs/:id", async (req, res) => {
    try {
      const brief = await storage.getCiContentBrief(req.params.id);
      if (!brief) {
        return res.status(404).json({ error: "Brief not found" });
      }

      const scripts = await storage.getCiBriefScripts(brief.id);
      res.json({ ...brief, scripts });
    } catch (error) {
      console.error("[CI] Error fetching brief:", error);
      res.status(500).json({ error: "Failed to fetch brief" });
    }
  });

  router.get("/scripts", async (req, res) => {
    try {
      const briefId = req.query.briefId as string | undefined;
      const scripts = await storage.getCiBriefScripts(briefId);
      res.json(scripts);
    } catch (error) {
      console.error("[CI] Error fetching scripts:", error);
      res.status(500).json({ error: "Failed to fetch scripts" });
    }
  });

  router.patch("/scripts/:id", async (req, res) => {
    try {
      const script = await storage.updateCiBriefScript(req.params.id, req.body);
      if (!script) {
        return res.status(404).json({ error: "Script not found" });
      }
      res.json(script);
    } catch (error) {
      console.error("[CI] Error updating script:", error);
      res.status(500).json({ error: "Failed to update script" });
    }
  });

  router.post("/briefs/:id/convert", async (req, res) => {
    try {
      const brief = await storage.getCiContentBrief(req.params.id);
      if (!brief) return res.status(404).json({ error: "Brief not found" });

      const { itemIndex } = req.body;
      const items = Array.isArray(brief.briefData) ? brief.briefData as any[] : [];
      const item = items[itemIndex];
      if (!item) return res.status(400).json({ error: "Brief item not found at index " + itemIndex });

      // Find any existing script for this brief item
      const scripts = await storage.getCiBriefScripts(brief.id);
      const script = scripts.find(s => s.briefItemIndex === itemIndex);

      // Build structured description as JSON for rich rendering on frontend
      const structuredDescription = JSON.stringify({
        _type: "ci_brief",
        topic_description: item.topic_description || null,
        hook_options: item.hook_options || [],
        talking_points: item.talking_points || [],
        emotional_journey: item.emotional_journey || null,
        suggested_cta: item.suggested_cta || null,
        format_suggestion: item.format_suggestion || null,
        estimated_length: item.estimated_length || null,
        difficulty: item.difficulty || null,
        notes_for_creator: item.notes_for_creator || null,
        script: script ? {
          hook: script.hook || null,
          body: script.body || null,
          closeCta: script.closeCta || null,
          full: script.rawScript?.full || null,
        } : null,
      });

      const videoRequest = await storage.createVideoRequest({
        title: item.title || `Brief ${brief.weekLabel} Item ${itemIndex + 1}`,
        topic: item.topic_category || item.title,
        hook: item.hook_options?.[0] || undefined,
        videoDuration: item.estimated_length || "60s",
        description: structuredDescription,
        status: "available",
      });

      // Mark the brief item as converted by updating briefData
      const updatedItems = [...items];
      updatedItems[itemIndex] = { ...item, videoRequestId: videoRequest.id };
      await storage.updateCiContentBrief(brief.id, { briefData: updatedItems });

      res.json({ success: true, videoRequestId: videoRequest.id });
    } catch (error: any) {
      console.error("[CI] Error converting brief to video request:", error);
      res.status(500).json({ error: "Failed to convert brief to video request" });
    }
  });

  router.delete("/briefs/:id", async (req, res) => {
    try {
      await storage.deleteCiContentBrief(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete brief" });
    }
  });

  router.delete("/scripts/:id", async (req, res) => {
    try {
      await storage.deleteCiBriefScript(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete script" });
    }
  });

  router.post("/scripts/:id/convert", async (req, res) => {
    try {
      const script = await storage.getCiBriefScript(req.params.id);
      if (!script) {
        return res.status(404).json({ error: "Script not found" });
      }

      // Create a video request from the script
      const fullScript = [script.hook, script.body, script.closeCta].filter(Boolean).join("\n\n");
      const videoRequest = await storage.createVideoRequest({
        title: script.title,
        topic: script.title,
        hook: script.hook || undefined,
        videoDuration: script.duration || "60s",
        description: fullScript,
        status: "available",
      });

      // Update script with the video request ID
      await storage.updateCiBriefScript(script.id, {
        videoRequestId: videoRequest.id,
        status: "converted",
      });

      res.json({ success: true, videoRequestId: videoRequest.id });
    } catch (error) {
      console.error("[CI] Error converting script:", error);
      res.status(500).json({ error: "Failed to convert script to video request" });
    }
  });

  router.get("/performance-reports", async (req, res) => {
    try {
      const reports = await storage.getCiPerformanceReports();
      res.json(reports);
    } catch (error) {
      console.error("[CI] Error fetching performance reports:", error);
      res.status(500).json({ error: "Failed to fetch performance reports" });
    }
  });

  router.get("/stats", async (req, res) => {
    try {
      const [competitors, videos, analyses, briefs] = await Promise.all([
        storage.getCiCompetitors(),
        storage.getCiScrapedVideos(),
        storage.getCiVideoAnalyses(),
        storage.getCiContentBriefs(),
      ]);

      res.json({
        competitors: competitors.length,
        videos: videos.length,
        analyses: analyses.length,
        briefs: briefs.length,
      });
    } catch (error) {
      console.error("[CI] Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // ============================================================
  // SETTINGS
  // ============================================================

  router.get("/settings", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const settings = await storage.getCiSettings(category);
      res.json(settings);
    } catch (error) {
      console.error("[CI] Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  router.put("/settings/:key", async (req, res) => {
    try {
      const { value, category, label, description, valueType } = req.body;
      if (value === undefined) {
        return res.status(400).json({ error: "Value is required" });
      }
      const setting = await storage.upsertCiSetting(req.params.key, value, {
        category,
        label,
        description,
        valueType,
      });
      res.json(setting);
    } catch (error) {
      console.error("[CI] Error updating setting:", error);
      res.status(500).json({ error: "Failed to update setting" });
    }
  });

  router.post("/settings/seed", async (req, res) => {
    try {
      const defaults: Array<{
        key: string;
        value: string;
        category: string;
        label: string;
        description: string;
        valueType: string;
      }> = [
        // Analysis prompts
        {
          key: "analysis_system_prompt",
          value: "You are a content intelligence analyst for a psychic and spiritual content company. Your job is to analyze competitor video transcripts and extract structured intelligence that will help our team create better content.\n\nYou always output valid JSON and nothing else \u2014 no preamble, no markdown fences.",
          category: "prompts",
          label: "Analysis System Prompt",
          description: "System prompt for video analysis AI",
          valueType: "textarea",
        },
        {
          key: "analysis_user_prompt",
          value: "Analyze this video transcript and return a JSON object with the following fields:\n\n- blocked (boolean): true if this touches any restricted topic\n- block_reason (string | null): brief reason if blocked, else null\n- topic_category (string): one of the defined categories\n- topic_summary (string): 1-sentence description of what this video is about\n- hook_text (string): the exact first 1-3 sentences of the transcript\n- hook_type (string): one of the defined hook types\n- hook_summary (string): what makes this hook effective in 1 sentence\n- emotional_angle (string): the core emotion this content targets\n- target_audience (string): who this video is speaking to, specifically\n- format (string): short_form_talking_head | story_time | reading_reveal | list_format | POV_scenario | other\n- cta_type (string): what action the video drives toward\n- replication_score (integer 1-5): how easily could we make a version of this?\n- notes (string): anything notable about why this video performed well\n\nRESTRICTED TOPICS (if video touches any, set blocked=true):\n{BLOCKED_TOPICS}\n\nTOPIC CATEGORIES (classify into exactly one):\n{TOPIC_CATEGORIES}\n\nHOOK TYPES (classify the opening hook style):\n{HOOK_TYPES}\n\nTranscript:\n\"\"\"\n{TRANSCRIPT}\n\"\"\"\n\nVideo metadata:\n- Views: {VIEWS}\n- Likes: {LIKES}\n- Comments: {COMMENTS}\n- Shares: {SHARES}\n- Creator: {HANDLE}\n- Platform: {PLATFORM}",
          category: "prompts",
          label: "Analysis User Prompt",
          description: "User prompt template for video analysis AI (supports placeholders)",
          valueType: "textarea",
        },
        // Brief prompts
        {
          key: "brief_system_prompt",
          value: "You are a content strategist for a psychic and spiritual content brand. Your job is to create weekly video content briefs for our team of psychic creators.\n\nOur brand values:\n- Empowering, uplifting, and hopeful \u2014 never fearful or manipulative\n- Grounded spiritual guidance, not sensationalism\n- We speak to people who are genuinely seeking answers about love, life path, and spirituality\n\nNEVER include content related to: black magic, hexes, curses, demonic entities, death predictions, or harmful intent toward others.\n\nEach brief should feel like a gift to the creator \u2014 clear enough that they can record immediately without needing to think too hard.\n\nAlways output valid JSON only. No preamble, no markdown fences.",
          category: "prompts",
          label: "Brief System Prompt",
          description: "System prompt for weekly brief generation AI",
          valueType: "textarea",
        },
        {
          key: "brief_user_prompt",
          value: "Based on the following top-performing competitor intelligence from this week, generate 5 video content briefs for our psychic creators.\n\nTOP PERFORMING TOPICS THIS WEEK:\n{INSERT_TOP_5_TOPICS}\n\nTOP PERFORMING HOOK TYPES THIS WEEK:\n{INSERT_TOP_HOOK_TYPES}\n\nTOP EMOTIONAL ANGLES:\n{INSERT_TOP_EMOTIONAL_ANGLES}\n\nFor each brief, return a JSON array of objects with:\n- brief_id (string): sequential ID e.g. \"W23-01\"\n- topic_category (string)\n- title (string): the working title for this video \u2014 punchy, 8 words max\n- topic_description (string): 2-3 sentences explaining what the video should cover\n- hook_options (array of 3 strings): three different hooks the creator can choose from, each under 15 words, different styles\n- talking_points (array of 4-6 strings): the key points to hit in the video body\n- emotional_journey (string): describe the arc \u2014 where the viewer starts emotionally and where they should end\n- suggested_cta (string): what to ask viewers to do at the end\n- format_suggestion (string): recommended format for this topic\n- estimated_length (string): e.g. \"60-90 seconds\"\n- difficulty (string): easy | medium | advanced\n- notes_for_creator (string): any special tips, tone guidance, or things to avoid",
          category: "prompts",
          label: "Brief User Prompt",
          description: "User prompt template for weekly brief generation AI (supports placeholders)",
          valueType: "textarea",
        },
        // Script prompts
        {
          key: "script_system_prompt",
          value: "You are a script writer for psychic and spiritual video content creators. Write natural, conversational scripts that are warm, empowering, and never preachy.",
          category: "prompts",
          label: "Script System Prompt",
          description: "System prompt for script generation AI",
          valueType: "textarea",
        },
        {
          key: "script_user_prompt",
          value: "Using the following content brief, write a full video script for a psychic creator to record.\n\nBRIEF:\n{INSERT_BRIEF_JSON}\n\nCREATOR PROFILE:\n- Name: {CREATOR_NAME}\n- Style: {CREATOR_STYLE}\n- Platform: {PLATFORM}\n- Typical video length: {LENGTH}\n\nWrite the script in the creator's natural voice.\n\nFormat it as:\n- HOOK (first 3 seconds \u2014 must stop the scroll)\n- BODY (the core message, broken into natural spoken paragraphs)\n- CLOSE + CTA (the final 10 seconds)\n\nInclude stage directions in [brackets] where useful.\n\nTone guidelines:\n- Conversational, warm, never preachy\n- Speak directly to \"you\" \u2014 the viewer\n- Avoid jargon that non-spiritual people wouldn't understand\n- Never predict death, illness, or specific harmful outcomes\n- End on hope and empowerment",
          category: "prompts",
          label: "Script User Prompt",
          description: "User prompt template for script generation AI (supports placeholders)",
          valueType: "textarea",
        },
        // Performance prompts
        {
          key: "performance_system_prompt",
          value: "You are analyzing the performance of published videos to identify which topics and hooks are working best with our audience. Always output valid JSON only.",
          category: "prompts",
          label: "Performance System Prompt",
          description: "System prompt for performance report AI",
          valueType: "textarea",
        },
        {
          key: "performance_user_prompt",
          value: "You are analyzing the performance of our own published videos to identify which topics and hooks are working best with our audience.\n\nHere is the performance data from our videos published in the past 14 days:\n{INSERT_YOUR_VIDEO_METADATA_WITH_METRICS}\n\nHere are the briefs we sent for those videos:\n{INSERT_MATCHING_BRIEFS}\n\nReturn a JSON object with:\n- top_performing_topics (array): ranked list of topic categories by avg engagement rate\n- top_performing_hook_types (array): ranked hook types by avg completion/engagement\n- underperforming_topics (array): topics to deprioritize this week\n- patterns (string): 2-3 sentences on what's working and why\n- recommendation (string): what to prioritize in next week's briefs",
          category: "prompts",
          label: "Performance User Prompt",
          description: "User prompt template for performance report AI (supports placeholders)",
          valueType: "textarea",
        },
        // Taxonomy arrays
        {
          key: "blocked_topics",
          value: JSON.stringify([
            "Black magic, dark magic, dark arts, hexes, curses, jinxes, binding spells",
            "Demonic entities, demon summoning, occult harm",
            "Death predictions (telling someone they or someone they love will die)",
            "Harmful intent toward a specific person (revenge spells, enemy work)",
            "Any content designed to frighten or manipulate vulnerable people",
          ]),
          category: "taxonomy",
          label: "Blocked Topics",
          description: "Topics that should be flagged and blocked during analysis",
          valueType: "json",
        },
        {
          key: "topic_categories",
          value: JSON.stringify([
            "Love & Relationships",
            "Astrology & Birth Charts",
            "Spirit Messages & Mediumship",
            "Manifestation & Law of Attraction",
            "Tarot & Oracle Readings",
            "Numerology",
            "Energy Healing & Chakras",
            "Life Path & Purpose",
            "Twin Flames & Soulmates",
            "General Psychic Reading",
          ]),
          category: "taxonomy",
          label: "Topic Categories",
          description: "Valid topic categories for video classification",
          valueType: "json",
        },
        {
          key: "hook_types",
          value: JSON.stringify([
            "Question",
            "Prediction",
            "POV",
            "Confession",
            "Shock Stat",
            "Call Out",
            "Story",
            "Warning",
          ]),
          category: "taxonomy",
          label: "Hook Types",
          description: "Valid hook type classifications for video openings",
          valueType: "json",
        },
        // Numeric thresholds
        {
          key: "scrape_min_views",
          value: "50000",
          category: "thresholds",
          label: "Minimum Views for Scraping",
          description: "Only import videos with at least this many views",
          valueType: "number",
        },
        {
          key: "scrape_max_age_days",
          value: "30",
          category: "thresholds",
          label: "Max Video Age (Days)",
          description: "Only import videos posted within this many days",
          valueType: "number",
        },
        {
          key: "ai_model",
          value: "anthropic/claude-sonnet-4-5",
          category: "general",
          label: "AI Model",
          description: "OpenRouter model ID used for all CI AI calls",
          valueType: "text",
        },
        {
          key: "show_pay_amount",
          value: "false",
          category: "general",
          label: "Show Pay Amount",
          description: "Show or hide the pay amount field on video requests (for admin and psychic views)",
          valueType: "text",
        },
        {
          key: "claim_deadline_days",
          value: "7",
          category: "general",
          label: "Claim Deadline (Days)",
          description: "Auto-set required date to this many days after a psychic claims a request",
          valueType: "number",
        },
      ];

      const results = [];
      for (const d of defaults) {
        const setting = await storage.upsertCiSetting(d.key, d.value, {
          category: d.category,
          label: d.label,
          description: d.description,
          valueType: d.valueType,
        });
        results.push(setting);
      }

      res.json({ success: true, seeded: results.length, settings: results });
    } catch (error) {
      console.error("[CI] Error seeding settings:", error);
      res.status(500).json({ error: "Failed to seed settings" });
    }
  });

  // Mount router
  app.use("/api/ci", router);
}
