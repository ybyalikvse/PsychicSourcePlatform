/**
 * fal.ai Queue-Based API Client
 * Shared HTTP client for all fal.ai models (Kling, OmniHuman, etc.)
 */

const FAL_KEY = process.env.FAL_KEY || "";
const FAL_QUEUE_BASE = "https://queue.fal.run";

function getFalHeaders(): Record<string, string> {
  if (!FAL_KEY) {
    throw new Error("FAL_KEY is not set. Please add it to your environment variables.");
  }
  return {
    "Authorization": `Key ${FAL_KEY}`,
    "Content-Type": "application/json",
  };
}

export interface FalJobStatus {
  status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  response_url?: string;
  queue_position?: number;
  logs?: any[];
}

export interface FalSubmitResult {
  requestId: string;
  statusUrl: string;
  responseUrl: string;
}

/**
 * Submit a job to fal.ai queue
 */
export async function submitFalJob(modelId: string, params: Record<string, any>): Promise<FalSubmitResult> {
  const url = `${FAL_QUEUE_BASE}/${modelId}`;
  console.log(`[fal.ai] Submitting job to ${modelId}...`);

  const response = await fetch(url, {
    method: "POST",
    headers: getFalHeaders(),
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`fal.ai submit failed (${response.status}): ${errorText}`);
  }

  const data = await response.json() as any;
  const requestId = data.request_id;

  if (!requestId) {
    throw new Error("fal.ai did not return a request_id");
  }

  const statusUrl = data.status_url || `${FAL_QUEUE_BASE}/${modelId}/requests/${requestId}/status`;
  const responseUrl = data.response_url || `${FAL_QUEUE_BASE}/${modelId}/requests/${requestId}`;

  console.log(`[fal.ai] Job submitted: ${requestId}`);
  console.log(`[fal.ai] Status URL: ${statusUrl}`);
  return { requestId, statusUrl, responseUrl };
}

/**
 * Poll job status from fal.ai queue
 * Uses the status_url returned by submit (which may differ from the model path)
 */
export async function pollFalJob(modelId: string, requestId: string, statusUrl?: string): Promise<FalJobStatus> {
  const url = statusUrl || `${FAL_QUEUE_BASE}/${modelId}/requests/${requestId}/status`;

  const response = await fetch(url, {
    headers: {
      "Authorization": `Key ${FAL_KEY}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`fal.ai poll failed (${response.status}): ${errorText}`);
  }

  return await response.json() as FalJobStatus;
}

/**
 * Get full result from a completed fal.ai job
 */
export async function getFalResult(modelId: string, requestId: string, responseUrl?: string): Promise<any> {
  const url = responseUrl || `${FAL_QUEUE_BASE}/${modelId}/requests/${requestId}`;

  const response = await fetch(url, {
    headers: {
      "Authorization": `Key ${FAL_KEY}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`fal.ai result fetch failed (${response.status}): ${errorText}`);
  }

  return await response.json();
}

/**
 * Download video from fal.ai CDN URL
 */
export async function downloadFalVideo(videoUrl: string): Promise<Buffer> {
  console.log(`[fal.ai] Downloading video from CDN...`);

  const response = await fetch(videoUrl);
  if (!response.ok) {
    throw new Error(`Failed to download fal.ai video: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  console.log(`[fal.ai] Video downloaded (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
  return buffer;
}

/**
 * Wait for a fal.ai job to complete with exponential backoff polling
 */
export async function waitForFalJob(
  modelId: string,
  requestId: string,
  onProgress?: (status: string, queuePosition?: number) => Promise<void>,
  maxWaitTime: number = 600000 // 10 minutes
): Promise<any> {
  const startTime = Date.now();
  let pollInterval = 5000; // Start at 5s
  const maxInterval = 30000; // Max 30s

  while (true) {
    if (Date.now() - startTime > maxWaitTime) {
      throw new Error("fal.ai job timed out");
    }

    const status = await pollFalJob(modelId, requestId);
    console.log(`[fal.ai] Job ${requestId}: status=${status.status}${status.queue_position !== undefined ? ` queue_position=${status.queue_position}` : ''}`);

    if (onProgress) {
      await onProgress(status.status, status.queue_position);
    }

    if (status.status === "COMPLETED") {
      return await getFalResult(modelId, requestId);
    }

    if (status.status === "FAILED") {
      const result = await getFalResult(modelId, requestId).catch(() => null);
      const errorMsg = result?.error || result?.detail || "Job failed";
      throw new Error(`fal.ai job failed: ${JSON.stringify(errorMsg)}`);
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
    // Exponential backoff: 5s → 10s → 20s → 30s (max)
    pollInterval = Math.min(pollInterval * 2, maxInterval);
  }
}

/**
 * Upload a file (image/audio) to fal.ai storage and get a URL back
 * This is needed because fal.ai models expect URLs, not base64
 */
export async function uploadToFalStorage(base64Data: string, contentType: string = "image/png"): Promise<string> {
  // Strip data URI prefix if present
  const rawBase64 = base64Data.replace(/^data:[^;]+;base64,/, "");
  const buffer = Buffer.from(rawBase64, "base64");

  const ext = contentType.includes("jpeg") || contentType.includes("jpg") ? "jpg"
    : contentType.includes("png") ? "png"
    : contentType.includes("mp3") || contentType.includes("mpeg") ? "mp3"
    : contentType.includes("wav") ? "wav"
    : "bin";

  const filename = `upload-${Date.now()}.${ext}`;

  // fal.ai file upload endpoint
  const initiateResponse = await fetch("https://rest.alpha.fal.ai/storage/upload/initiate", {
    method: "POST",
    headers: getFalHeaders(),
    body: JSON.stringify({
      file_name: filename,
      content_type: contentType,
    }),
  });

  if (!initiateResponse.ok) {
    // Fallback: try direct upload endpoint
    const uploadResponse = await fetch("https://fal.run/fal-ai/any/upload", {
      method: "POST",
      headers: {
        "Authorization": `Key ${FAL_KEY}`,
        "Content-Type": contentType,
      },
      body: buffer,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload to fal.ai storage: ${uploadResponse.status}`);
    }

    const result = await uploadResponse.json() as any;
    return result.url;
  }

  const { upload_url, file_url } = await initiateResponse.json() as any;

  // Upload the actual file
  const uploadResponse = await fetch(upload_url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: buffer,
  });

  if (!uploadResponse.ok) {
    throw new Error(`Failed to upload file to fal.ai: ${uploadResponse.status}`);
  }

  console.log(`[fal.ai] File uploaded to storage: ${file_url}`);
  return file_url;
}
