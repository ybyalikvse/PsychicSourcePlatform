import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";
import { getSignedVideoUrl, uploadVideoToS3 } from "./s3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WATERMARK_PATH = path.join(__dirname, "assets", "watermark.png");
// Watermark sizing: percentage of video width
const WATERMARK_WIDTH_PERCENT = 12;
// Opacity: 0.0 (invisible) to 1.0 (fully opaque)
const WATERMARK_OPACITY = 0.7;
// Padding from bottom-right corner (pixels)
const WATERMARK_PADDING = 20;

/**
 * Apply a watermark to a video stored in S3.
 * Downloads the original, overlays the watermark PNG in the bottom-right,
 * uploads the watermarked version, and returns the new S3 key.
 */
export async function watermarkVideo(
  originalS3Key: string,
  requestId: string
): Promise<string> {
  console.log(`[Watermark] Starting watermark for request ${requestId}, key: ${originalS3Key}`);

  // Load watermark image
  if (!fs.existsSync(WATERMARK_PATH)) {
    throw new Error(`Watermark file not found at ${WATERMARK_PATH}`);
  }
  const watermarkData = new Uint8Array(fs.readFileSync(WATERMARK_PATH));

  // Download original video from S3
  const signedUrl = await getSignedVideoUrl(originalS3Key);
  console.log(`[Watermark] Downloading original video...`);
  const videoResponse = await fetch(signedUrl);
  if (!videoResponse.ok) {
    throw new Error(`Failed to download video: ${videoResponse.status}`);
  }
  const videoData = new Uint8Array(await videoResponse.arrayBuffer());
  console.log(`[Watermark] Downloaded ${(videoData.length / 1024 / 1024).toFixed(1)} MB`);

  // Determine file extension from original key
  const ext = originalS3Key.split(".").pop() || "mp4";
  const inputFile = `input.${ext}`;
  const outputFile = `output.mp4`;

  // Initialize FFmpeg WASM with local core
  const ffmpeg = new FFmpeg();
  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });
  console.log(`[Watermark] FFmpeg loaded`);

  // Write files to FFmpeg virtual filesystem
  await ffmpeg.writeFile(inputFile, videoData);
  await ffmpeg.writeFile("watermark.png", watermarkData);

  // Apply watermark overlay:
  // - Scale watermark to WATERMARK_WIDTH_PERCENT of video width
  // - Set opacity to WATERMARK_OPACITY
  // - Position in bottom-right with WATERMARK_PADDING
  const filterComplex = [
    `[1:v]scale=iw*${WATERMARK_WIDTH_PERCENT}/100:-1,format=rgba,`,
    `colorchannelmixer=aa=${WATERMARK_OPACITY}[wm];`,
    `[0:v][wm]overlay=W-w-${WATERMARK_PADDING}:H-h-${WATERMARK_PADDING}`,
  ].join("");

  console.log(`[Watermark] Processing video...`);
  await ffmpeg.exec([
    "-i", inputFile,
    "-i", "watermark.png",
    "-filter_complex", filterComplex,
    "-c:a", "copy",
    "-c:v", "libx264",
    "-preset", "fast",
    "-crf", "23",
    outputFile,
  ]);
  console.log(`[Watermark] Video processed`);

  // Read the output
  const outputData = await ffmpeg.readFile(outputFile);
  if (!(outputData instanceof Uint8Array)) {
    throw new Error("FFmpeg output is not binary data");
  }
  const outputBuffer = Buffer.from(outputData);
  console.log(`[Watermark] Output size: ${(outputBuffer.length / 1024 / 1024).toFixed(1)} MB`);

  // Upload watermarked version to S3
  const watermarkedKey = `video-submissions/${requestId}_watermarked_${Date.now()}.mp4`;
  const { key } = await uploadVideoToS3(outputBuffer, watermarkedKey, "video/mp4");
  console.log(`[Watermark] Uploaded watermarked video: ${key}`);

  // Cleanup
  await ffmpeg.deleteFile(inputFile);
  await ffmpeg.deleteFile(outputFile);
  await ffmpeg.deleteFile("watermark.png");
  ffmpeg.terminate();

  return key;
}
