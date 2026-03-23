/**
 * AWS Lambda function for video watermarking using FFmpeg.
 *
 * Expects event: { bucket, videoKey, watermarkKey, outputKey }
 * Returns: { outputKey }
 *
 * Requires:
 * - FFmpeg Lambda Layer (provides /opt/bin/ffmpeg)
 * - S3 read/write permissions on the bucket
 * - Memory: 2048 MB recommended
 * - Timeout: 290 seconds
 * - Ephemeral storage: 2048 MB
 */

import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { execFile } from "child_process";
import { createWriteStream, createReadStream, statSync, unlinkSync } from "fs";
import { pipeline } from "stream/promises";

const s3 = new S3Client({});
const FFMPEG_PATH = "/opt/bin/ffmpeg";

// Watermark settings
const WATERMARK_WIDTH_PERCENT = 50;
const WATERMARK_OPACITY = 0.7;
const WATERMARK_PADDING = 20;

async function downloadFromS3(bucket, key, localPath) {
  const response = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  await pipeline(response.Body, createWriteStream(localPath));
}

function runFFmpeg(args) {
  return new Promise((resolve, reject) => {
    const proc = execFile(FFMPEG_PATH, args, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        console.error("[FFmpeg] stderr:", stderr);
        reject(new Error(`FFmpeg failed: ${error.message}`));
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

export async function handler(event) {
  const { bucket, videoKey, watermarkKey, outputKey } = event;

  if (!bucket || !videoKey || !watermarkKey || !outputKey) {
    throw new Error("Missing required fields: bucket, videoKey, watermarkKey, outputKey");
  }

  console.log(`[Watermark] Starting: video=${videoKey}, output=${outputKey}`);

  // Determine input extension
  const ext = videoKey.split(".").pop() || "mp4";
  const inputPath = `/tmp/input.${ext}`;
  const watermarkPath = "/tmp/watermark.png";
  const outputPath = "/tmp/output.mp4";

  // Download video and watermark from S3
  console.log("[Watermark] Downloading video from S3...");
  await downloadFromS3(bucket, videoKey, inputPath);
  console.log("[Watermark] Downloading watermark from S3...");
  await downloadFromS3(bucket, watermarkKey, watermarkPath);

  const inputStat = statSync(inputPath);
  console.log(`[Watermark] Input video size: ${(inputStat.size / 1024 / 1024).toFixed(1)} MB`);

  // Build FFmpeg filter
  const filterComplex = [
    `[1:v]scale=iw*${WATERMARK_WIDTH_PERCENT}/100:-1,format=rgba,`,
    `colorchannelmixer=aa=${WATERMARK_OPACITY}[wm];`,
    `[0:v][wm]overlay=W-w-${WATERMARK_PADDING}:${WATERMARK_PADDING}`,
  ].join("");

  // Run FFmpeg
  console.log("[Watermark] Processing video with FFmpeg...");
  await runFFmpeg([
    "-i", inputPath,
    "-i", watermarkPath,
    "-filter_complex", filterComplex,
    "-c:a", "copy",
    "-c:v", "libx264",
    "-preset", "fast",
    "-crf", "23",
    "-y", outputPath,
  ]);

  const outputStat = statSync(outputPath);
  console.log(`[Watermark] Output video size: ${(outputStat.size / 1024 / 1024).toFixed(1)} MB`);

  // Upload result to S3
  console.log("[Watermark] Uploading watermarked video to S3...");
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: outputKey,
    Body: createReadStream(outputPath),
    ContentType: "video/mp4",
    ContentLength: outputStat.size,
  }));

  // Cleanup /tmp
  [inputPath, watermarkPath, outputPath].forEach(f => {
    try { unlinkSync(f); } catch {}
  });

  console.log(`[Watermark] Complete: ${outputKey}`);
  return { outputKey };
}
