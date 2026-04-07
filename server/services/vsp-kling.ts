/**
 * Kling v3 Video Generation via fal.ai
 * Supports v3 Pro and v3 Standard
 * Uses multi_prompt for multi-shot generation (one API call, consistent character)
 */

import { submitFalJob, pollFalJob, getFalResult, downloadFalVideo, waitForFalJob, uploadToFalStorage } from "./vsp-fal";

// Model endpoints
const KLING_MODELS = {
  "v3-pro-t2v": "fal-ai/kling-video/v3/pro/text-to-video",
  "v3-pro-i2v": "fal-ai/kling-video/v3/pro/image-to-video",
  "v3-standard-t2v": "fal-ai/kling-video/v3/standard/text-to-video",
  "v3-standard-i2v": "fal-ai/kling-video/v3/standard/image-to-video",
} as const;

export type KlingTier = "pro" | "standard";

export interface KlingVideoRequest {
  prompt: string;
  aspectRatio?: "16:9" | "9:16" | "1:1";
  duration?: string; // "3" to "15"
  referenceImage?: string; // base64 image for element binding
  tier?: KlingTier;
  generateAudio?: boolean;
  negativePrompt?: string;
  cfgScale?: number;
}

export interface KlingMultiPromptRequest {
  segments: { prompt: string; duration: number }[];
  aspectRatio?: "16:9" | "9:16" | "1:1";
  referenceImage?: string;
  tier?: KlingTier;
  generateAudio?: boolean;
  negativePrompt?: string;
  cfgScale?: number;
}

export interface KlingClipResult {
  requestId: string;
  modelId: string;
  statusUrl: string;
  responseUrl: string;
}

export interface KlingClipStatus {
  done: boolean;
  videoUrl?: string;
  error?: string;
}

function getModelId(tier: KlingTier, hasImage: boolean): string {
  if (hasImage) {
    return tier === "standard" ? KLING_MODELS["v3-standard-i2v"] : KLING_MODELS["v3-pro-i2v"];
  }
  return tier === "standard" ? KLING_MODELS["v3-standard-t2v"] : KLING_MODELS["v3-pro-t2v"];
}

/**
 * Generate a single Kling video clip
 */
export async function generateKlingVideo(request: KlingVideoRequest): Promise<KlingClipResult> {
  const hasImage = !!request.referenceImage;
  const tier = request.tier || "pro";
  const modelId = getModelId(tier, hasImage);

  console.log(`[Kling] Generating video (${tier}, ${hasImage ? 'image-to-video' : 'text-to-video'})...`);

  const params: Record<string, any> = {
    prompt: request.prompt,
    aspect_ratio: request.aspectRatio || "9:16",
    duration: request.duration || "10",
    generate_audio: request.generateAudio !== false, // default true
  };

  if (request.negativePrompt) {
    params.negative_prompt = request.negativePrompt;
  }

  if (request.cfgScale !== undefined) {
    params.cfg_scale = request.cfgScale;
  }

  if (hasImage && request.referenceImage) {
    const imageUrl = await uploadToFalStorage(request.referenceImage, "image/png");
    params.image_url = imageUrl;
  }

  const result = await submitFalJob(modelId, params);
  return { requestId: result.requestId, modelId, statusUrl: result.statusUrl, responseUrl: result.responseUrl };
}

/**
 * Generate a multi-shot Kling video using multi_prompt
 * This sends ONE API call with multiple shots — cheaper, faster, and more consistent
 * Each shot can be up to 15s. Total is the sum of all shot durations.
 */
export async function generateKlingMultiShot(request: KlingMultiPromptRequest): Promise<KlingClipResult> {
  const hasImage = !!request.referenceImage;
  const tier = request.tier || "pro";
  const modelId = getModelId(tier, hasImage);

  const totalDuration = request.segments.reduce((sum, s) => sum + s.duration, 0);
  console.log(`[Kling] Generating multi-shot video (${tier}, ${request.segments.length} shots, ${totalDuration}s total)...`);

  const multiPrompt = request.segments.map(seg => ({
    prompt: seg.prompt,
    duration: String(seg.duration),
  }));

  const params: Record<string, any> = {
    multi_prompt: multiPrompt,
    aspect_ratio: request.aspectRatio || "9:16",
    generate_audio: request.generateAudio !== false,
    shot_type: "customize",
  };

  if (request.negativePrompt) {
    params.negative_prompt = request.negativePrompt;
  }

  if (request.cfgScale !== undefined) {
    params.cfg_scale = request.cfgScale;
  }

  if (hasImage && request.referenceImage) {
    const imageUrl = await uploadToFalStorage(request.referenceImage, "image/png");
    params.image_url = imageUrl;
  }

  const result = await submitFalJob(modelId, params);
  console.log(`[Kling] Multi-shot job submitted: ${result.requestId} (${request.segments.length} shots)`);
  return { requestId: result.requestId, modelId, statusUrl: result.statusUrl, responseUrl: result.responseUrl };
}

/**
 * Poll status of a Kling video generation job
 */
export async function pollKlingJob(requestId: string, modelId: string, statusUrl?: string, responseUrl?: string): Promise<KlingClipStatus> {
  try {
    const status = await pollFalJob(modelId, requestId, statusUrl);

    if (status.status === "COMPLETED") {
      const result = await getFalResult(modelId, requestId, responseUrl);
      const videoUrl = result?.video?.url || result?.data?.video?.url;
      if (!videoUrl) {
        return { done: true, error: "No video URL in result" };
      }
      return { done: true, videoUrl };
    }

    if (status.status === "FAILED") {
      const result = await getFalResult(modelId, requestId, responseUrl).catch(() => null);
      return { done: true, error: result?.error || result?.detail || "Kling generation failed" };
    }

    return { done: false };
  } catch (error) {
    console.error("[Kling] Poll error:", error);
    return { done: false, error: error instanceof Error ? error.message : "Poll failed" };
  }
}

/**
 * Wait for Kling video to complete and download it
 */
export async function waitForKlingVideo(
  requestId: string,
  modelId: string,
  onProgress?: (status: string) => Promise<void>,
  maxWaitTime: number = 600000
): Promise<{ videoBuffer: Buffer; videoUrl: string }> {
  const result = await waitForFalJob(modelId, requestId, onProgress, maxWaitTime);

  const videoUrl = result?.video?.url || result?.data?.video?.url;
  if (!videoUrl) {
    throw new Error("No video URL in Kling result");
  }

  const videoBuffer = await downloadFalVideo(videoUrl);
  return { videoBuffer, videoUrl };
}

/**
 * Generate a Kling clip for a specific segment (legacy single-clip approach)
 */
export async function generateKlingClip(params: {
  prompt: string;
  clipNumber: number;
  aspectRatio?: "16:9" | "9:16" | "1:1";
  duration?: string;
  referenceImage?: string;
  elementBinding?: boolean;
  customInstructions?: string;
  tier?: KlingTier;
}): Promise<KlingClipResult> {
  console.log(`[Kling] Starting clip ${params.clipNumber} generation...`);

  let fullPrompt = params.prompt;
  if (params.customInstructions) {
    fullPrompt = `${params.customInstructions}\n\n${fullPrompt}`;
  }

  const result = await generateKlingVideo({
    prompt: fullPrompt,
    aspectRatio: params.aspectRatio,
    duration: params.duration,
    referenceImage: params.referenceImage,
    tier: params.tier,
  });

  console.log(`[Kling] Clip ${params.clipNumber} job submitted: ${result.requestId}`);
  return result;
}
