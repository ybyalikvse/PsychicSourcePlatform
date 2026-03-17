import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const execAsync = promisify(exec);

export interface VideoClip {
  clipNumber: number;
  videoData: string; // base64 data URL or URL
  duration: number;
}

/**
 * Stitches multiple video clips into a single video using FFmpeg
 */
export async function stitchVideoClips(
  clips: VideoClip[],
  outputFormat: 'mp4' = 'mp4'
): Promise<string> {
  if (process.env.VERCEL) throw new Error("Video stitching not supported on Vercel serverless");

  const tmpDir = join(process.cwd(), 'tmp', 'video-stitching');

  // Create tmp directory if it doesn't exist
  if (!existsSync(tmpDir)) {
    await mkdir(tmpDir, { recursive: true });
  }

  const timestamp = Date.now();
  const clipPaths: string[] = [];
  const concatFilePath = join(tmpDir, `concat-${timestamp}.txt`);
  const outputPath = join(tmpDir, `stitched-${timestamp}.${outputFormat}`);

  try {
    console.log(`Starting video stitching for ${clips.length} clips...`);

    // Step 1: Save all clips as temporary files
    for (const clip of clips) {
      const clipPath = join(tmpDir, `clip-${timestamp}-${clip.clipNumber}.mp4`);

      // Extract base64 data from data URL
      let videoBuffer: Buffer;
      if (clip.videoData.startsWith('data:')) {
        const base64Data = clip.videoData.split(',')[1];
        videoBuffer = Buffer.from(base64Data, 'base64');
      } else {
        // If it's a URL, download it first
        const response = await fetch(clip.videoData);
        const arrayBuffer = await response.arrayBuffer();
        videoBuffer = Buffer.from(arrayBuffer);
      }

      await writeFile(clipPath, videoBuffer);
      clipPaths.push(clipPath);
      console.log(`  Saved clip ${clip.clipNumber} to ${clipPath}`);
    }

    // Step 2: Create concat file for FFmpeg
    const concatContent = clipPaths.map(path => `file '${path}'`).join('\n');
    await writeFile(concatFilePath, concatContent);
    console.log(`  Created concat file: ${concatFilePath}`);

    // Step 3: Use FFmpeg to concatenate videos
    const ffmpegCommand = `ffmpeg -f concat -safe 0 -i "${concatFilePath}" -c copy "${outputPath}" -y`;
    console.log(`  Running FFmpeg: ${ffmpegCommand}`);

    await execAsync(ffmpegCommand);

    console.log(`  Video stitching completed: ${outputPath}`);

    // Step 4: Read the stitched video and convert to base64 data URL
    const { readFile } = await import('fs/promises');
    const stitchedBuffer = await readFile(outputPath);
    const base64 = stitchedBuffer.toString('base64');
    const dataUrl = `data:video/mp4;base64,${base64}`;

    console.log(`  Converted to base64 (${(stitchedBuffer.length / 1024 / 1024).toFixed(2)} MB)`);

    // Step 5: Cleanup temporary files
    await cleanup([...clipPaths, concatFilePath, outputPath]);

    return dataUrl;
  } catch (error) {
    // Cleanup on error
    await cleanup([...clipPaths, concatFilePath, outputPath]);

    console.error('Video stitching failed:', error);
    throw new Error(`Failed to stitch videos: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Cleanup temporary files
 */
async function cleanup(filePaths: string[]): Promise<void> {
  for (const path of filePaths) {
    try {
      if (existsSync(path)) {
        await unlink(path);
        console.log(`  Cleaned up: ${path}`);
      }
    } catch (error) {
      console.warn(`  Failed to cleanup ${path}:`, error);
    }
  }
}
