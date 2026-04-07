import OpenAI from "openai";

/** Strip markdown code fences from AI response before JSON.parse */
function cleanJsonResponse(text: string): string {
  let cleaned = text.trim();
  // Remove ```json ... ``` or ``` ... ```
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }
  return cleaned.trim();
}

/**
 * Scrape competitor videos from ScrapeCreators API with pagination.
 */
export async function scrapeCompetitorVideos(
  handle: string,
  apiKey: string,
  limit: number
): Promise<any[]> {
  const allVideos: any[] = [];
  let cursor: string | undefined;
  const maxPages = Math.ceil(limit / 10); // API returns ~10 per page

  try {
    for (let page = 0; page < maxPages; page++) {
      let url = `https://api.scrapecreators.com/v3/tiktok/profile/videos?handle=${handle}&limit=${Math.min(limit, 30)}`;
      if (cursor) url += `&max_cursor=${cursor}`;

      const response = await fetch(url, {
        headers: { "x-api-key": apiKey },
      });

      if (!response.ok) {
        console.error(`[CI] ScrapeCreators error ${response.status}: ${response.statusText}`);
        break;
      }

      let data: any;
      try {
        const rawText = await response.text();
        try {
          data = JSON.parse(rawText);
        } catch {
          // Clean control characters and retry
          const cleanedText = rawText.replace(/[\x00-\x1F\x7F]/g, (ch: string) =>
            ch === '\n' || ch === '\r' || ch === '\t' ? ch : ''
          );
          data = JSON.parse(cleanedText);
        }
      } catch (parseErr) {
        console.error(`[CI] Failed to parse response for @${handle} page ${page + 1}:`, parseErr);
        break;
      }

      if (data?.success === false) {
        console.error(`[CI] API error for @${handle}: ${data?.message || 'unknown'}`);
        break;
      }

      const videos = data?.aweme_list || data?.items || data?.videos || [];
      allVideos.push(...videos);

      console.log(`[CI] Scraped page ${page + 1} for @${handle}: ${videos.length} videos (total: ${allVideos.length}, cursor: ${cursor || 'none'}, has_more: ${data?.has_more})`);

      // Stop if no more pages or we have enough
      if (!data?.has_more || !data?.max_cursor || allVideos.length >= limit) break;
      cursor = String(data.max_cursor);
    }

    return allVideos.slice(0, limit);
  } catch (error) {
    console.error(`[CI] Failed to scrape videos for @${handle}:`, error);
    return allVideos; // Return what we got so far
  }
}

/**
 * Fetch the transcript for a TikTok video via ScrapeCreators API.
 */
export async function fetchVideoTranscript(
  videoUrl: string,
  apiKey: string
): Promise<string | null> {
  try {
    const url = `https://api.scrapecreators.com/v1/tiktok/video/transcript?url=${encodeURIComponent(videoUrl)}`;
    const response = await fetch(url, {
      headers: { "x-api-key": apiKey },
    });

    if (!response.ok) {
      console.error(`[CI] Transcript fetch error ${response.status}: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    let transcript = data?.transcript || data?.text || null;
    if (!transcript) return null;

    // If transcript is WebVTT format, extract just the text lines
    if (transcript.includes("WEBVTT") || transcript.includes("-->")) {
      transcript = transcript
        .split("\n")
        .filter((line: string) => line.trim() && !line.includes("-->") && !line.startsWith("WEBVTT") && !/^\d+$/.test(line.trim()))
        .join(" ")
        .trim();
    }
    return transcript;
  } catch (error) {
    console.error(`[CI] Failed to fetch transcript for ${videoUrl}:`, error);
    return null;
  }
}

/**
 * Analyze a single video transcript using OpenRouter AI.
 */
export async function analyzeVideo(params: {
  transcript: string;
  caption: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  handle: string;
  platform: string;
  systemPrompt: string;
  userPromptTemplate: string;
  model: string;
}): Promise<any> {
  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  const userPrompt = params.userPromptTemplate
    .replace(/{TRANSCRIPT}/g, params.transcript)
    .replace(/{VIEWS}/g, String(params.viewCount))
    .replace(/{LIKES}/g, String(params.likeCount))
    .replace(/{COMMENTS}/g, String(params.commentCount))
    .replace(/{SHARES}/g, String(params.shareCount))
    .replace(/{HANDLE}/g, params.handle)
    .replace(/{PLATFORM}/g, params.platform);

  const response = await openai.chat.completions.create({
    model: params.model,
    messages: [
      { role: "system", content: params.systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content || "{}";
  return JSON.parse(cleanJsonResponse(content));
}

function formatViewCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

/**
 * Generate a weekly content brief from aggregated analyses.
 */
export async function generateWeeklyBrief(params: {
  analyses: any[];
  systemPrompt: string;
  userPromptTemplate: string;
  model: string;
}): Promise<any> {
  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  // --- Frequency-based aggregations (backward compatible) ---
  const topicCounts: Record<string, number> = {};
  const hookCounts: Record<string, number> = {};
  const emotionCounts: Record<string, number> = {};

  for (const a of params.analyses) {
    if (a.topicCategory) topicCounts[a.topicCategory] = (topicCounts[a.topicCategory] || 0) + 1;
    if (a.hookType) hookCounts[a.hookType] = (hookCounts[a.hookType] || 0) + 1;
    if (a.emotionalAngle) emotionCounts[a.emotionalAngle] = (emotionCounts[a.emotionalAngle] || 0) + 1;
  }

  const allTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([topic, count]) => `${topic} (${count} videos)`);

  const allHooks = Object.entries(hookCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([hook, count]) => `${hook} (${count} videos)`);

  const allEmotions = Object.entries(emotionCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([emotion, count]) => `${emotion} (${count} videos)`);

  // --- Engagement-weighted aggregations ---
  const topicEngagement: Record<string, { count: number; totalViews: number; totalReplication: number }> = {};
  const hookEngagement: Record<string, { count: number; totalViews: number }> = {};
  const emotionEngagement: Record<string, { count: number; totalViews: number }> = {};
  const formatCounts: Record<string, number> = {};
  const ctaCounts: Record<string, number> = {};
  const audienceCounts: Record<string, number> = {};
  let totalReplication = 0;
  let replicationCount = 0;

  for (const a of params.analyses) {
    const views = a.viewCount || 0;
    if (a.topicCategory) {
      const e = topicEngagement[a.topicCategory] || { count: 0, totalViews: 0, totalReplication: 0 };
      e.count++;
      e.totalViews += views;
      e.totalReplication += a.replicationScore || 0;
      topicEngagement[a.topicCategory] = e;
    }
    if (a.hookType) {
      const e = hookEngagement[a.hookType] || { count: 0, totalViews: 0 };
      e.count++;
      e.totalViews += views;
      hookEngagement[a.hookType] = e;
    }
    if (a.emotionalAngle) {
      const e = emotionEngagement[a.emotionalAngle] || { count: 0, totalViews: 0 };
      e.count++;
      e.totalViews += views;
      emotionEngagement[a.emotionalAngle] = e;
    }
    if (a.format) formatCounts[a.format] = (formatCounts[a.format] || 0) + 1;
    if (a.ctaType) ctaCounts[a.ctaType] = (ctaCounts[a.ctaType] || 0) + 1;
    if (a.targetAudience) audienceCounts[a.targetAudience] = (audienceCounts[a.targetAudience] || 0) + 1;
    if (a.replicationScore) { totalReplication += a.replicationScore; replicationCount++; }
  }

  const avgReplication = replicationCount > 0 ? (totalReplication / replicationCount).toFixed(1) : "N/A";

  // Top videos ranked by views (max 10)
  const topVideos = [...params.analyses]
    .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
    .slice(0, 10)
    .map((a, i) => {
      const lines = [`#${i + 1} — Views: ${formatViewCount(a.viewCount || 0)} | Likes: ${formatViewCount(a.likeCount || 0)} | Comments: ${formatViewCount(a.commentCount || 0)} | Shares: ${formatViewCount(a.shareCount || 0)}`];
      if (a.hookText) lines.push(`  Hook: "${(a.hookText as string).slice(0, 200)}"`);
      lines.push(`  Format: ${a.format || "unknown"} | Emotion: ${a.emotionalAngle || "unknown"} | Hook Type: ${a.hookType || "unknown"} | Replication: ${a.replicationScore || "?"}/10`);
      if (a.topicSummary) lines.push(`  Summary: ${(a.topicSummary as string).slice(0, 200)}`);
      return lines.join("\n");
    })
    .join("\n\n");

  // Engagement-weighted rankings
  const engWeightedTopics = Object.entries(topicEngagement)
    .sort((a, b) => b[1].totalViews - a[1].totalViews)
    .map(([t, e]) => `${t} (${e.count} videos, ${formatViewCount(e.totalViews)} total views, avg replication: ${(e.totalReplication / e.count).toFixed(1)}/10)`)
    .join("\n");

  const engWeightedHooks = Object.entries(hookEngagement)
    .sort((a, b) => b[1].totalViews - a[1].totalViews)
    .map(([h, e]) => `${h} (${e.count} videos, ${formatViewCount(e.totalViews)} total views)`)
    .join("\n");

  const engWeightedEmotions = Object.entries(emotionEngagement)
    .sort((a, b) => b[1].totalViews - a[1].totalViews)
    .map(([em, e]) => `${em} (${e.count} videos, ${formatViewCount(e.totalViews)} total views)`)
    .join("\n");

  const formatList = Object.entries(formatCounts).sort((a, b) => b[1] - a[1]).map(([f, c]) => `${f} (${c})`).join(", ");
  const ctaList = Object.entries(ctaCounts).sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c} (${n})`).join(", ");
  const audienceList = Object.entries(audienceCounts).sort((a, b) => b[1] - a[1]).map(([a, c]) => `${a} (${c})`).join(", ");

  // --- Build user prompt with all replacements ---
  const userPrompt = params.userPromptTemplate
    // Backward-compatible frequency-based placeholders
    .replace(/{INSERT_TOP_5_TOPICS_FROM_AIRTABLE}|{INSERT_TOP_5_TOPICS}|{INSERT_TOPICS}/g, allTopics.join("\n"))
    .replace(/{INSERT_TOP_HOOK_TYPES}|{INSERT_HOOK_TYPES}/g, allHooks.join("\n"))
    .replace(/{INSERT_TOP_EMOTIONAL_ANGLES}|{INSERT_EMOTIONAL_ANGLES}/g, allEmotions.join("\n"))
    .replace(/{TOTAL_VIDEOS_ANALYZED}/g, String(params.analyses.length))
    // New engagement-weighted placeholders
    .replace(/{INSERT_TOP_VIDEOS}/g, topVideos)
    .replace(/{INSERT_ENGAGEMENT_WEIGHTED_TOPICS}/g, engWeightedTopics)
    .replace(/{INSERT_ENGAGEMENT_WEIGHTED_HOOKS}/g, engWeightedHooks)
    .replace(/{INSERT_ENGAGEMENT_WEIGHTED_EMOTIONS}/g, engWeightedEmotions)
    .replace(/{INSERT_FORMATS}/g, formatList)
    .replace(/{INSERT_CTA_TYPES}/g, ctaList)
    .replace(/{INSERT_TARGET_AUDIENCES}/g, audienceList)
    .replace(/{AVG_REPLICATION_SCORE}/g, avgReplication);

  const response = await openai.chat.completions.create({
    model: params.model,
    messages: [
      { role: "system", content: params.systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content || "{}";
  return JSON.parse(cleanJsonResponse(content));
}

/**
 * Generate a full video script from a content brief item.
 */
export async function generateScript(params: {
  briefItem: any;
  systemPrompt: string;
  userPromptTemplate: string;
  creatorName: string;
  creatorStyle: string;
  platform: string;
  duration: string;
  model: string;
}): Promise<any> {
  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    timeout: 250_000, // 250s — leave buffer for Vercel's 300s limit
  });

  // Only include essential fields to reduce prompt size and speed up LLM response
  const essentialBrief = {
    title: params.briefItem.title,
    topic_description: params.briefItem.topic_description,
    hook_options: params.briefItem.hook_options,
    talking_points: params.briefItem.talking_points,
    emotional_journey: params.briefItem.emotional_journey,
    suggested_cta: params.briefItem.suggested_cta,
    format_suggestion: params.briefItem.format_suggestion,
    estimated_length: params.briefItem.estimated_length,
    notes_for_creator: params.briefItem.notes_for_creator,
  };

  const userPrompt = params.userPromptTemplate
    .replace(/{INSERT_BRIEF_JSON}/g, JSON.stringify(essentialBrief, null, 2))
    .replace(/{CREATOR_NAME}/g, params.creatorName)
    .replace(/{CREATOR_STYLE}/g, params.creatorStyle)
    .replace(/{PLATFORM}/g, params.platform)
    .replace(/{LENGTH}/g, params.duration);

  const response = await openai.chat.completions.create({
    model: params.model,
    messages: [
      { role: "system", content: params.systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const content = response.choices[0]?.message?.content || "";
  return content;
}

/**
 * Generate a performance report comparing own videos against briefs.
 */
export async function generatePerformanceReport(params: {
  ownVideos: any[];
  briefs: any[];
  systemPrompt: string;
  userPromptTemplate: string;
  model: string;
}): Promise<any> {
  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  const userPrompt = params.userPromptTemplate
    .replace(/{INSERT_YOUR_VIDEO_METADATA_WITH_METRICS}/g, JSON.stringify(params.ownVideos, null, 2))
    .replace(/{INSERT_MATCHING_BRIEFS}/g, JSON.stringify(params.briefs, null, 2));

  const response = await openai.chat.completions.create({
    model: params.model,
    messages: [
      { role: "system", content: params.systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content || "{}";
  return JSON.parse(cleanJsonResponse(content));
}

/**
 * Get an ISO week label for a given date, e.g. "2026-W12".
 */
export function getWeekLabel(date?: Date): string {
  const d = date ? new Date(date) : new Date();
  // Set to nearest Thursday (ISO week rule)
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return `${d.getFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
}
