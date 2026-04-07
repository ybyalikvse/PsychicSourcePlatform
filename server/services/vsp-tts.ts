/**
 * Text-to-Speech via ElevenLabs API
 * Generates audio files for use with OmniHuman talking head videos
 */

import { uploadVideoToS3 } from "../s3";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "";
const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";

export interface TTSRequest {
  text: string;
  voiceId: string;
  modelId?: string; // Default: eleven_multilingual_v2
  stability?: number; // 0-1, default 0.5
  similarityBoost?: number; // 0-1, default 0.75
}

export interface TTSVoice {
  voice_id: string;
  name: string;
  category: string;
  labels: Record<string, string>;
  preview_url: string;
}

/**
 * Generate TTS audio using ElevenLabs
 * Returns an audio Buffer (mp3)
 */
export async function generateTTSAudio(request: TTSRequest): Promise<Buffer> {
  if (!ELEVENLABS_API_KEY) {
    throw new Error("ELEVENLABS_API_KEY is not set. Please add it to your environment variables.");
  }

  console.log(`[TTS] Generating audio for ${request.text.length} chars with voice ${request.voiceId}...`);

  const response = await fetch(`${ELEVENLABS_BASE}/text-to-speech/${request.voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY,
      "Content-Type": "application/json",
      "Accept": "audio/mpeg",
    },
    body: JSON.stringify({
      text: request.text,
      model_id: request.modelId || "eleven_multilingual_v2",
      voice_settings: {
        stability: request.stability ?? 0.5,
        similarity_boost: request.similarityBoost ?? 0.75,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs TTS failed (${response.status}): ${error}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  console.log(`[TTS] Audio generated (${(buffer.length / 1024).toFixed(1)} KB)`);
  return buffer;
}

/**
 * Generate TTS audio and upload to S3, returning a public URL
 */
export async function generateAndUploadTTS(
  text: string,
  voiceId: string,
  projectId: string
): Promise<string> {
  const audioBuffer = await generateTTSAudio({ text, voiceId });

  const filename = `vsp/${projectId}/tts-audio-${Date.now()}.mp3`;
  const { url } = await uploadVideoToS3(audioBuffer, filename, "audio/mpeg");

  console.log(`[TTS] Audio uploaded to S3: ${filename}`);
  return url;
}

/**
 * List available ElevenLabs voices
 */
export async function listTTSVoices(): Promise<TTSVoice[]> {
  if (!ELEVENLABS_API_KEY) {
    throw new Error("ELEVENLABS_API_KEY is not set");
  }

  const response = await fetch(`${ELEVENLABS_BASE}/voices`, {
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to list voices: ${response.status}`);
  }

  const data = await response.json() as any;
  return (data.voices || []) as TTSVoice[];
}
