import OpenAI from "openai";
import sharp from 'sharp';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Direct OpenAI client for Sora video generation (proprietary API, not available through OpenRouter)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_API_BASE = "https://api.openai.com/v1";

// OpenRouter client for text generation (chat completions)
const openrouterClient = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "default_key"
});

export interface SoraVideoRequest {
  prompt: string;
  model: 'sora-2' | 'sora-2-pro';
  size?: '1280x720' | '720x1280' | '1080x1080';
  seconds?: number;
  referenceImage?: string; // Base64 image data for reference image (image-to-video)
}

export interface SoraVideoResponse {
  videoId: string;
  status: 'queued' | 'in_progress' | 'completed' | 'failed';
  videoUrl?: string;
  progress?: number;
  error?: string;
}

function requireOpenAIKey(): void {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY required for Sora video generation");
  }
}

export async function uploadImageToOpenAI(base64Image: string): Promise<string> {
  requireOpenAIKey();

  try {
    console.log('Uploading reference image to OpenAI Files API...');

    // Convert base64 to blob
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const blob = new Blob([buffer], { type: 'image/png' });

    const formData = new FormData();
    formData.append('file', blob, 'reference.png');
    formData.append('purpose', 'assistants');

    const response = await fetch(`${OPENAI_API_BASE}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI Files API error: ${error}`);
    }

    const data = await response.json();
    console.log('Image uploaded to OpenAI:', data.id);

    return data.id;
  } catch (error) {
    console.error('Failed to upload image:', error);
    throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function resizeImageToVideoDimensions(base64Image: string, size: string): Promise<Buffer> {
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');

  // Parse video dimensions
  const [width, height] = size.split('x').map(Number);

  console.log(`Resizing reference image to ${width}x${height}`);

  // Resize image to match video dimensions
  const resizedBuffer = await sharp(buffer)
    .resize(width, height, {
      fit: 'cover', // Cover ensures image fills dimensions
      position: 'center'
    })
    .png()
    .toBuffer();

  return resizedBuffer;
}

export async function createSoraVideo(request: SoraVideoRequest): Promise<SoraVideoResponse> {
  requireOpenAIKey();

  try {
    console.log('Creating Sora video with request:', {
      model: request.model,
      size: request.size,
      seconds: request.seconds,
      hasReferenceImage: !!request.referenceImage
    });

    const formData = new FormData();
    formData.append('model', request.model);
    formData.append('prompt', request.prompt);
    if (request.size) formData.append('size', request.size);
    if (request.seconds) formData.append('seconds', request.seconds.toString());

    if (request.referenceImage && request.size) {
      // Resize image to match video dimensions
      const resizedBuffer = await resizeImageToVideoDimensions(request.referenceImage, request.size);
      const blob = new Blob([resizedBuffer], { type: 'image/png' });
      formData.append('input_reference', blob, 'reference.png');
      console.log('Using resized reference image for image-to-video generation');
    }

    const response = await fetch(`${OPENAI_API_BASE}/videos`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    console.log('Sora video job created:', data);

    return {
      videoId: data.id,
      status: data.status as 'queued' | 'in_progress' | 'completed' | 'failed',
      progress: data.progress || 0
    };
  } catch (error) {
    console.error('Sora video creation failed:', error);
    throw new Error(`Failed to create Sora video: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getSoraVideoStatus(videoId: string): Promise<SoraVideoResponse> {
  requireOpenAIKey();

  try {
    const response = await fetch(`${OPENAI_API_BASE}/videos/${videoId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    console.log('Sora video status:', data);

    return {
      videoId: data.id,
      status: data.status as 'queued' | 'in_progress' | 'completed' | 'failed',
      progress: data.progress || 0,
      error: data.error?.message
    };
  } catch (error) {
    console.error('Failed to get Sora video status:', error);
    throw new Error(`Failed to get video status: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function downloadSoraVideo(videoId: string): Promise<string> {
  requireOpenAIKey();

  try {
    console.log('Getting Sora video download URL:', videoId);

    // Get the video status to ensure it's completed
    const statusResponse = await fetch(`${OPENAI_API_BASE}/videos/${videoId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      }
    });

    if (!statusResponse.ok) {
      const error = await statusResponse.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const statusData = await statusResponse.json();

    if (statusData.status !== 'completed') {
      throw new Error(`Video not completed. Status: ${statusData.status}`);
    }

    // Return the download URL for the video
    const downloadUrl = `${OPENAI_API_BASE}/videos/${videoId}/content`;
    console.log('Sora video download URL ready:', downloadUrl);

    return downloadUrl;
  } catch (error) {
    console.error('Failed to get Sora video download URL:', error);
    throw new Error(`Failed to get download URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper function to poll until video is ready
export async function createAndPollSoraVideo(
  request: SoraVideoRequest,
  maxWaitTime: number = 300000 // 5 minutes default
): Promise<SoraVideoResponse> {
  const startTime = Date.now();

  // Create the video job
  const initialResponse = await createSoraVideo(request);
  let currentStatus = initialResponse;

  // Poll until completed or failed
  while (
    currentStatus.status === 'queued' ||
    currentStatus.status === 'in_progress'
  ) {
    // Check timeout
    if (Date.now() - startTime > maxWaitTime) {
      throw new Error('Video generation timeout exceeded');
    }

    // Wait before polling again
    await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5 seconds

    // Get updated status
    currentStatus = await getSoraVideoStatus(initialResponse.videoId);

    console.log(`Sora video progress: ${currentStatus.progress}% - Status: ${currentStatus.status}`);
  }

  if (currentStatus.status === 'failed') {
    throw new Error(currentStatus.error || 'Video generation failed');
  }

  // Get the download URL
  const videoUrl = await downloadSoraVideo(initialResponse.videoId);

  return {
    ...currentStatus,
    videoUrl
  };
}

// Main function to generate Sora video (matches Revid interface pattern)
export async function generateSoraVideo(params: {
  prompt: string;
  model: 'sora-2' | 'sora-2-pro';
  size: '1280x720' | '720x1280' | '1080x1080';
  seconds: number;
  referenceImage?: string;
}): Promise<{ jobId: string; videoUrl: string | null }> {
  requireOpenAIKey();

  console.log('Starting Sora video generation...');

  // If reference image is provided, prepend context to help with moderation
  let finalPrompt = params.prompt;
  if (params.referenceImage) {
    finalPrompt = `Note: The reference image provided is a photo of me (the content creator). ${params.prompt}`;
  }

  // Create the video job
  const result = await createSoraVideo({
    prompt: finalPrompt,
    model: params.model,
    size: params.size,
    seconds: params.seconds,
    referenceImage: params.referenceImage
  });

  console.log(`Sora video job created with ID: ${result.videoId}`);

  // Return job ID for status polling (video won't be ready immediately)
  return {
    jobId: result.videoId,
    videoUrl: result.videoUrl || null
  };
}

/**
 * Generate a single Sora clip for multi-clip workflow
 */
export async function generateSoraClip(params: {
  prompt: string;
  model: 'sora-2' | 'sora-2-pro';
  size: '1280x720' | '720x1280' | '1080x1080';
  seconds: number;
  clipNumber: number;
  referenceImage?: string;
}): Promise<{ jobId: string }> {
  requireOpenAIKey();

  console.log(`Starting Sora clip ${params.clipNumber} generation...`);

  // If reference image is provided, prepend context to help with moderation
  let finalPrompt = params.prompt;
  if (params.referenceImage) {
    finalPrompt = `Note: The reference image provided is a photo of me (the content creator). ${params.prompt}`;
  }

  const result = await createSoraVideo({
    prompt: finalPrompt,
    model: params.model,
    size: params.size,
    seconds: params.seconds,
    referenceImage: params.referenceImage
  });

  console.log(`Sora clip ${params.clipNumber} job created with ID: ${result.videoId}`);

  return {
    jobId: result.videoId
  };
}

/**
 * Extract the last frame from a video (base64 data URL) using FFmpeg
 * Returns a base64 PNG data URL of the final frame
 */
export async function extractLastFrame(videoBase64DataUrl: string): Promise<string> {
  const tmpDir = os.tmpdir();
  const videoPath = path.join(tmpDir, `sora_clip_${Date.now()}.mp4`);
  const framePath = path.join(tmpDir, `sora_frame_${Date.now()}.png`);

  try {
    const base64Data = videoBase64DataUrl.replace(/^data:video\/\w+;base64,/, '');
    const videoBuffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(videoPath, videoBuffer);

    execSync(
      `ffmpeg -sseof -0.1 -i "${videoPath}" -frames:v 1 -q:v 2 "${framePath}" -y 2>/dev/null`,
      { timeout: 15000 }
    );

    const frameBuffer = fs.readFileSync(framePath);
    const frameBase64 = `data:image/png;base64,${frameBuffer.toString('base64')}`;

    console.log(`Extracted last frame (${(frameBuffer.length / 1024).toFixed(1)} KB)`);
    return frameBase64;
  } catch (error) {
    console.error('Failed to extract last frame:', error);
    throw new Error(`Frame extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    try { fs.unlinkSync(videoPath); } catch {}
    try { fs.unlinkSync(framePath); } catch {}
  }
}

/**
 * Poll a Sora clip until it completes, then download and extract last frame
 * Accepts an optional onProgress callback to persist intermediate progress
 */
export async function waitForClipAndExtractFrame(
  jobId: string,
  onProgress?: (progress: number, status: string) => Promise<void>,
  maxWaitTime: number = 600000
): Promise<{ videoDataUrl: string; lastFrameBase64: string }> {
  const startTime = Date.now();
  let status = await getSoraVideoStatus(jobId);

  while (status.status === 'queued' || status.status === 'in_progress') {
    if (Date.now() - startTime > maxWaitTime) {
      throw new Error('Clip generation timeout exceeded');
    }
    await new Promise(resolve => setTimeout(resolve, 5000));
    status = await getSoraVideoStatus(jobId);
    console.log(`Clip ${jobId} progress: ${status.progress}% - ${status.status}`);

    if (onProgress) {
      await onProgress(status.progress || 0, status.status);
    }
  }

  if (status.status === 'failed') {
    throw new Error(status.error || 'Clip generation failed');
  }

  const videoDataUrl = await downloadAndConvertSoraVideo(jobId);
  let lastFrameBase64: string;
  try {
    lastFrameBase64 = await extractLastFrame(videoDataUrl);
  } catch (err) {
    console.warn('Frame extraction failed, continuing without reference frame');
    lastFrameBase64 = '';
  }

  return { videoDataUrl, lastFrameBase64 };
}

/**
 * Download Sora video and convert to base64 data URL
 * This prevents the 1-hour expiration issue
 */
export async function downloadAndConvertSoraVideo(videoId: string): Promise<string> {
  requireOpenAIKey();

  try {
    console.log('Downloading Sora video before expiration:', videoId);

    const downloadUrl = `${OPENAI_API_BASE}/videos/${videoId}/content`;

    const response = await fetch(downloadUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to download video: ${error}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:video/mp4;base64,${base64}`;

    console.log(`Sora video downloaded and saved successfully (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);

    return dataUrl;
  } catch (error) {
    console.error('Failed to download and convert Sora video:', error);
    throw new Error(`Failed to download video: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
