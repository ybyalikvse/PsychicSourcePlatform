/**
 * OmniHuman 1.5 Talking Head Video Generation via fal.ai
 * Takes a reference image + audio → generates lip-synced talking head video
 */

import { submitFalJob, waitForFalJob, downloadFalVideo, uploadToFalStorage } from "./vsp-fal";

const OMNIHUMAN_MODEL = "fal-ai/bytedance/omnihuman/v1.5";

export interface OmniHumanRequest {
  referenceImage: string; // base64 image of the person's face
  audioUrl: string; // URL to audio file (mp3/wav)
  resolution?: "720p" | "1080p";
}

export interface OmniHumanResult {
  requestId: string;
  modelId: string;
}

/**
 * Generate an OmniHuman talking head video
 * Takes a face photo + audio → lip-synced video
 */
export async function generateOmniHumanVideo(request: OmniHumanRequest): Promise<OmniHumanResult> {
  console.log(`[OmniHuman] Generating talking head video...`);
  console.log(`[OmniHuman] Resolution: ${request.resolution || "1080p"}, Audio: ${request.audioUrl.substring(0, 50)}...`);

  // Upload reference image to fal.ai storage
  const imageUrl = await uploadToFalStorage(request.referenceImage, "image/png");

  const params: Record<string, any> = {
    image_url: imageUrl,
    audio_url: request.audioUrl,
  };

  // Resolution mapping
  if (request.resolution === "720p") {
    params.resolution = "720p";
  } else {
    params.resolution = "1080p";
  }

  const result = await submitFalJob(OMNIHUMAN_MODEL, params);
  console.log(`[OmniHuman] Job submitted: ${result.requestId}`);

  return { requestId: result.requestId, modelId: OMNIHUMAN_MODEL };
}

/**
 * Wait for OmniHuman video to complete and download it
 */
export async function waitForOmniHumanVideo(
  requestId: string,
  onProgress?: (status: string) => Promise<void>,
  maxWaitTime: number = 600000
): Promise<{ videoBuffer: Buffer; videoUrl: string }> {
  const result = await waitForFalJob(OMNIHUMAN_MODEL, requestId, onProgress, maxWaitTime);

  const videoUrl = result?.video?.url || result?.data?.video?.url || result?.output?.video?.url;
  if (!videoUrl) {
    console.error("[OmniHuman] Unexpected result structure:", JSON.stringify(result).substring(0, 500));
    throw new Error("No video URL in OmniHuman result");
  }

  const videoBuffer = await downloadFalVideo(videoUrl);
  return { videoBuffer, videoUrl };
}
