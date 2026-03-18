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
      const competitor = await storage.updateCiCompetitor(req.params.id, req.body);
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
      if (!apiKeySetting?.value) {
        return res.status(400).json({ error: "ScrapeCreators API key not configured" });
      }

      const minViewsSetting = await storage.getCiSetting("scrape_min_views");
      const minViews = minViewsSetting ? parseInt(minViewsSetting.value, 10) : 50000;

      const maxAgeSetting = await storage.getCiSetting("scrape_max_age_days");
      const maxAgeDays = maxAgeSetting ? parseInt(maxAgeSetting.value, 10) : 30;

      const limitSetting = await storage.getCiSetting("scrape_limit");
      const limit = limitSetting ? parseInt(limitSetting.value, 10) : 30;

      const videos = await scrapeCompetitorVideos(competitor.handle, apiKeySetting.value, limit);

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

      let saved = 0;
      let skipped = 0;

      for (const video of videos) {
        const externalId = video.id || video.video_id || video.videoId;
        if (!externalId) continue;

        // Skip if already scraped
        const existing = await storage.getCiScrapedVideoByExternalId(String(externalId));
        if (existing) {
          skipped++;
          continue;
        }

        const views = video.stats?.playCount ?? video.views ?? video.viewCount ?? 0;
        if (views < minViews) {
          skipped++;
          continue;
        }

        // Skip old videos
        const postedAt = video.createTime || video.posted_at || video.postedAt;
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
          url: video.url || video.video_url || `https://www.tiktok.com/@${competitor.handle}/video/${externalId}`,
          caption: video.desc || video.caption || video.description || null,
          viewCount: views,
          likeCount: video.stats?.diggCount ?? video.likes ?? video.likeCount ?? 0,
          commentCount: video.stats?.commentCount ?? video.comments ?? video.commentCount ?? 0,
          shareCount: video.stats?.shareCount ?? video.shares ?? video.shareCount ?? 0,
          duration: video.duration ?? video.video_duration ?? null,
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
      if (!apiKeySetting?.value) {
        return res.status(400).json({ error: "ScrapeCreators API key not configured" });
      }

      const transcript = await fetchVideoTranscript(video.url, apiKeySetting.value);

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
    } catch (error) {
      console.error("[CI] Pipeline analyze error:", error);
      res.status(500).json({ error: "Analysis pipeline failed" });
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
        ownVideos = await scrapeCompetitorVideos(ownHandleSetting.value, apiKeySetting.value, 20);
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
      res.json(analyses);
    } catch (error) {
      console.error("[CI] Error fetching analyses:", error);
      res.status(500).json({ error: "Failed to fetch analyses" });
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
            "love_and_relationships",
            "astrology_and_birth_charts",
            "spirit_messages_and_mediumship",
            "manifestation_and_law_of_attraction",
            "tarot_and_oracle_readings",
            "numerology",
            "energy_healing_and_chakras",
            "life_path_and_purpose",
            "twin_flames_and_soulmates",
            "general_psychic_reading",
          ]),
          category: "taxonomy",
          label: "Topic Categories",
          description: "Valid topic categories for video classification",
          valueType: "json",
        },
        {
          key: "hook_types",
          value: JSON.stringify([
            "question",
            "prediction",
            "pov",
            "confession",
            "shock_stat",
            "call_out",
            "story",
            "warning",
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
