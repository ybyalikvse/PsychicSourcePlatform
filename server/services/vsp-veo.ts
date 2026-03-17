import { GoogleGenAI } from "@google/genai";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

function getClient(): GoogleGenAI {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set. Please add it to your environment secrets.");
  }
  return new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

export interface VeoVideoRequest {
  prompt: string;
  aspectRatio?: "9:16" | "16:9";
  referenceImages?: string[];
  negativePrompt?: string;
  extendVideo?: { uri: string };
}

export interface VeoVideoResult {
  operationName: string;
  done: boolean;
}

export interface VeoClipStatus {
  done: boolean;
  videoUri?: string;
  videoFileId?: string;
  error?: string;
}

export async function generateVeoVideo(request: VeoVideoRequest): Promise<VeoVideoResult> {
  const ai = getClient();

  console.log("Starting Veo 3.1 video generation:", {
    promptLength: request.prompt.length,
    aspectRatio: request.aspectRatio,
    hasReferenceImages: !!(request.referenceImages && request.referenceImages.length),
    isExtension: !!request.extendVideo,
  });

  const params: any = {
    model: "veo-3.1-generate-preview",
    prompt: request.prompt,
  };

  const config: any = {};

  if (request.aspectRatio) {
    config.aspectRatio = request.aspectRatio;
  }

  if (request.negativePrompt) {
    config.negativePrompt = request.negativePrompt;
  }

  if (request.referenceImages && request.referenceImages.length > 0) {
    const images: any[] = [];
    for (const img of request.referenceImages) {
      const base64Data = img.replace(/^data:image\/\w+;base64,/, "");
      const mimeMatch = img.match(/^data:(image\/\w+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
      images.push({
        image: {
          imageBytes: base64Data,
          mimeType,
        },
        referenceType: "style",
      });
    }
    config.referenceImages = images;
  }

  if (Object.keys(config).length > 0) {
    params.config = config;
  }

  if (request.extendVideo) {
    params.video = { uri: request.extendVideo.uri };
  }

  const operation = await ai.models.generateVideos(params);

  console.log("Veo operation started:", operation.name);

  return {
    operationName: operation.name || "",
    done: !!operation.done,
  };
}

async function fetchOperationStatus(operationName: string): Promise<any> {
  const response = await fetch(
    `${GEMINI_API_BASE}/${operationName}?key=${GEMINI_API_KEY}`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch operation status: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export async function pollVeoOperation(operationName: string): Promise<VeoClipStatus> {
  try {
    const operation = await fetchOperationStatus(operationName);

    if (operation.done) {
      const samples = operation.response?.generateVideoResponse?.generatedSamples;
      if (samples && samples.length > 0) {
        const video = samples[0].video;
        return {
          done: true,
          videoUri: video?.uri,
          videoFileId: video?.uri,
        };
      }
      return {
        done: true,
        error: "No video generated",
      };
    }

    return { done: false };
  } catch (error) {
    console.error("Veo poll error:", error);
    return {
      done: false,
      error: error instanceof Error ? error.message : "Poll failed",
    };
  }
}

export async function downloadVeoVideo(operationName: string): Promise<{ buffer: Buffer; videoObject: any }> {
  console.log("Downloading Veo video for operation:", operationName);

  const operation = await fetchOperationStatus(operationName);

  if (!operation.done) {
    throw new Error("Video is not ready yet");
  }

  const samples = operation.response?.generateVideoResponse?.generatedSamples;
  if (!samples || samples.length === 0) {
    throw new Error("No video found in operation response");
  }

  const video = samples[0].video;
  const videoUri = video?.uri;

  if (!videoUri) {
    throw new Error("No video URI in response");
  }

  const separator = videoUri.includes('?') ? '&' : '?';
  const downloadUrl = `${videoUri}${separator}key=${GEMINI_API_KEY}`;
  const videoResponse = await fetch(downloadUrl);

  if (!videoResponse.ok) {
    throw new Error(`Failed to download video: ${videoResponse.status}`);
  }

  const arrayBuffer = await videoResponse.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  console.log(`Veo video downloaded (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
  return { buffer, videoObject: video };
}

export async function waitForVeoVideo(
  operationName: string,
  onProgress?: (status: string) => Promise<void>,
  maxWaitTime: number = 600000
): Promise<{ videoBuffer: Buffer; videoFileId?: string; videoObject?: any }> {
  const startTime = Date.now();

  while (true) {
    if (Date.now() - startTime > maxWaitTime) {
      throw new Error("Veo video generation timeout exceeded");
    }

    const status = await pollVeoOperation(operationName);
    console.log(`Veo operation ${operationName}: done=${status.done}`);

    if (onProgress) {
      await onProgress(status.done ? "completed" : "generating");
    }

    if (status.done) {
      if (status.error) {
        throw new Error(status.error);
      }
      const { buffer, videoObject } = await downloadVeoVideo(operationName);
      return { videoBuffer: buffer, videoFileId: status.videoFileId, videoObject };
    }

    await new Promise((resolve) => setTimeout(resolve, 10000));
  }
}

export async function generateVeoClip(params: {
  prompt: string;
  clipNumber: number;
  aspectRatio?: "9:16" | "16:9";
  referenceImages?: string[];
  negativePrompt?: string;
  extendVideo?: { uri: string };
}): Promise<{ operationName: string }> {
  console.log(`Starting Veo clip ${params.clipNumber} generation...`);

  const result = await generateVeoVideo({
    prompt: params.prompt,
    aspectRatio: params.aspectRatio,
    referenceImages: params.referenceImages,
    negativePrompt: params.negativePrompt,
    extendVideo: params.extendVideo,
  });

  console.log(`Veo clip ${params.clipNumber} operation started: ${result.operationName}`);

  return { operationName: result.operationName };
}
