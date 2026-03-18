import OpenAI from "openai";

/**
 * Scrape competitor videos from ScrapeCreators API.
 */
export async function scrapeCompetitorVideos(
  handle: string,
  apiKey: string,
  limit: number
): Promise<any[]> {
  try {
    const url = `https://api.scrapecreators.com/v3/tiktok/profile/videos?handle=${handle}&limit=${limit}`;
    const response = await fetch(url, {
      headers: { "x-api-key": apiKey },
    });

    if (!response.ok) {
      console.error(`[CI] ScrapeCreators error ${response.status}: ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    return data?.aweme_list || data?.items || data?.videos || [];
  } catch (error) {
    console.error(`[CI] Failed to scrape videos for @${handle}:`, error);
    return [];
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
    return data?.transcript || data?.text || null;
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
  return JSON.parse(content);
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

  const topTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic, count]) => `${topic} (${count} videos)`);

  const topHooks = Object.entries(hookCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([hook, count]) => `${hook} (${count} videos)`);

  const topEmotions = Object.entries(emotionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([emotion, count]) => `${emotion} (${count} videos)`);

  const userPrompt = params.userPromptTemplate
    .replace(/{INSERT_TOP_5_TOPICS_FROM_AIRTABLE}|{INSERT_TOP_5_TOPICS}/g, topTopics.join("\n"))
    .replace(/{INSERT_TOP_HOOK_TYPES}/g, topHooks.join("\n"))
    .replace(/{INSERT_TOP_EMOTIONAL_ANGLES}/g, topEmotions.join("\n"));

  const response = await openai.chat.completions.create({
    model: params.model,
    messages: [
      { role: "system", content: params.systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content || "{}";
  return JSON.parse(content);
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
  return JSON.parse(content);
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
