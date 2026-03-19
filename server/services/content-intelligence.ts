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
      if (cursor) url += `&cursor=${cursor}`;

      const response = await fetch(url, {
        headers: { "x-api-key": apiKey },
      });

      if (!response.ok) {
        console.error(`[CI] ScrapeCreators error ${response.status}: ${response.statusText}`);
        break;
      }

      // Parse response, handling potential control characters in JSON
      let data: any;
      try {
        const rawText = await response.text();
        // Strip control characters that break JSON parsing
        const cleanedText = rawText.replace(/[\x00-\x1F\x7F]/g, (ch) => {
          if (ch === '\n' || ch === '\r' || ch === '\t') return ch;
          return '';
        });
        data = JSON.parse(cleanedText);
      } catch (parseErr) {
        console.error(`[CI] Failed to parse ScrapeCreators response for @${handle} page ${page + 1}:`, parseErr);
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

  // Aggregate top topics by frequency
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

  const userPrompt = params.userPromptTemplate
    .replace(/{INSERT_TOP_5_TOPICS_FROM_AIRTABLE}|{INSERT_TOP_5_TOPICS}|{INSERT_TOPICS}/g, allTopics.join("\n"))
    .replace(/{INSERT_TOP_HOOK_TYPES}|{INSERT_HOOK_TYPES}/g, allHooks.join("\n"))
    .replace(/{INSERT_TOP_EMOTIONAL_ANGLES}|{INSERT_EMOTIONAL_ANGLES}/g, allEmotions.join("\n"))
    .replace(/{TOTAL_VIDEOS_ANALYZED}/g, String(params.analyses.length));

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
  });

  const userPrompt = params.userPromptTemplate
    .replace(/{INSERT_BRIEF_JSON}/g, JSON.stringify(params.briefItem, null, 2))
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
