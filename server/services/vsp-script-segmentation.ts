import { GeneratedScript } from './vsp-openai';

export interface ScriptSegment {
  clipNumber: number;
  scriptSegment: string;
  duration: number;
  wordCount: number;
  startTime: number;
  endTime: number;
}

export type DurationTier = number[];

export const STANDARD_DURATIONS: DurationTier = [4, 8, 12];
export const PRO_DURATIONS: DurationTier = [10, 15, 25];

export function getDurationTierForModel(model: string): { durations: DurationTier; maxClipDuration: number } {
  if (model === 'sora-2-pro') {
    return { durations: PRO_DURATIONS, maxClipDuration: 25 };
  }
  return { durations: STANDARD_DURATIONS, maxClipDuration: 12 };
}

export function getMaxSingleClipWords(model: string): number {
  const WORDS_PER_SECOND = 2.5;
  const { maxClipDuration } = getDurationTierForModel(model);
  return Math.floor(maxClipDuration * WORDS_PER_SECOND * 1.15);
}

function findNaturalBreakpoint(text: string, maxLength: number): number {
  if (text.length <= maxLength) return text.length;

  const sentenceEndings = /[.!?]\s+/g;
  let bestSplit = -1;
  let match;

  while ((match = sentenceEndings.exec(text)) !== null) {
    const position = match.index + match[0].length;
    if (position <= maxLength) {
      bestSplit = position;
    } else {
      break;
    }
  }

  if (bestSplit > 0) return bestSplit;

  const phraseEndings = /[,;—–-]\s+/g;
  while ((match = phraseEndings.exec(text)) !== null) {
    const position = match.index + match[0].length;
    if (position <= maxLength) {
      bestSplit = position;
    } else {
      break;
    }
  }

  if (bestSplit > 0) return bestSplit;

  const lastSpace = text.lastIndexOf(' ', maxLength);
  if (lastSpace > 0) return lastSpace + 1;

  return maxLength;
}

function pickDuration(estimatedDuration: number, durations: DurationTier): number {
  for (const d of durations) {
    if (estimatedDuration <= d) return d;
  }
  return durations[durations.length - 1];
}

export function segmentScriptForSora(
  script: GeneratedScript,
  maxClipDuration: number = 12,
  durations: DurationTier = STANDARD_DURATIONS
): ScriptSegment[] {
  const WORDS_PER_SECOND = 2.5;
  const CHARS_PER_WORD = 5;
  const content = script.content.trim();

  console.log(`Segmenting script: ${content.length} chars, max clip ${maxClipDuration}s, durations: [${durations.join(',')}]`);

  const segments: ScriptSegment[] = [];
  let currentPosition = 0;
  let clipNumber = 1;
  let currentTime = 0;

  while (currentPosition < content.length) {
    const remainingText = content.substring(currentPosition);

    const maxCharsForDuration = Math.floor(maxClipDuration * WORDS_PER_SECOND * CHARS_PER_WORD);

    const splitPosition = findNaturalBreakpoint(remainingText, maxCharsForDuration);
    const segmentText = remainingText.substring(0, splitPosition).trim();

    const wordCount = segmentText.split(/\s+/).filter(w => w.length > 0).length;
    const estimatedDuration = wordCount / WORDS_PER_SECOND;

    const clipDuration = pickDuration(estimatedDuration, durations);

    segments.push({
      clipNumber,
      scriptSegment: segmentText,
      duration: clipDuration,
      wordCount: wordCount,
      startTime: currentTime,
      endTime: currentTime + clipDuration
    });

    console.log(`  Clip ${clipNumber}: ${wordCount} words, ${clipDuration}s (${currentTime}s-${currentTime + clipDuration}s)`);
    console.log(`     Text: "${segmentText.substring(0, 60)}${segmentText.length > 60 ? '...' : ''}"`);

    currentPosition += splitPosition;
    currentTime += clipDuration;
    clipNumber++;
  }

  console.log(`Created ${segments.length} clip segments (total duration: ${currentTime}s)`);

  return segments;
}

export interface StyleBlock {
  characterDescription: string;
  settingDescription: string;
  cinematographyStyle: string;
  colorPalette: string;
}

export function buildStyleBlock(
  characterProfile?: { description: string; wardrobe?: string; distinctiveFeatures?: string },
  colorPalette?: string[],
  cinematography?: { cameraStyle?: string; lightingStyle?: string },
  customInstructions?: string
): string {
  const parts: string[] = [];

  parts.push('=== VISUAL CONSISTENCY BLOCK (SAME FOR ALL CLIPS) ===');

  if (characterProfile) {
    let charBlock = `CHARACTER: ${characterProfile.description}`;
    if (characterProfile.wardrobe) charBlock += ` | WARDROBE: ${characterProfile.wardrobe}`;
    if (characterProfile.distinctiveFeatures) charBlock += ` | FEATURES: ${characterProfile.distinctiveFeatures}`;
    parts.push(charBlock);
  }

  if (colorPalette && colorPalette.length > 0) {
    parts.push(`COLOR PALETTE: ${colorPalette.join(', ')}`);
  }

  if (cinematography) {
    const cineParts: string[] = [];
    if (cinematography.cameraStyle) cineParts.push(`Camera: ${cinematography.cameraStyle}`);
    if (cinematography.lightingStyle) cineParts.push(`Lighting: ${cinematography.lightingStyle}`);
    if (cineParts.length > 0) parts.push(`CINEMATOGRAPHY: ${cineParts.join(' | ')}`);
  }

  if (customInstructions) {
    parts.push(`STYLE INSTRUCTIONS: ${customInstructions}`);
  }

  parts.push('=== END CONSISTENCY BLOCK ===');

  return parts.join('\n');
}

export function createClipPrompt(
  visualPrompt: string,
  segment: ScriptSegment,
  previousSegment: ScriptSegment | null,
  customInstructions?: string,
  hasReferenceImage?: boolean,
  styleBlock?: string
): string {
  let prompt = '';

  if (styleBlock) {
    prompt += `${styleBlock}\n\n`;
  }

  prompt += `${visualPrompt}\n\n`;

  if (hasReferenceImage) {
    if (previousSegment) {
      prompt += `REFERENCE IMAGE: This image is the LAST FRAME of the previous clip. Continue this EXACT scene — same person, same clothes, same setting, same camera angle. The video should look like a seamless continuation.\n\n`;
    } else {
      prompt += `REFERENCE IMAGE: Use this image to establish the character's appearance, setting, and visual style. Maintain these exact details throughout.\n\n`;
    }
  }

  if (previousSegment) {
    prompt += `CONTINUITY REQUIREMENTS:\n`;
    prompt += `- This is clip ${segment.clipNumber} — a DIRECT CONTINUATION of the previous clip\n`;
    prompt += `- CRITICAL: Same person, same face, same clothing, same setting, same lighting\n`;
    prompt += `- The camera and scene should flow naturally as if this is one continuous shot\n`;
    prompt += `- Previous clip ended with: "${previousSegment.scriptSegment.slice(-80)}"\n\n`;
  } else {
    prompt += `This is the FIRST clip. Establish the character, setting, and visual style that will be maintained throughout all subsequent clips.\n\n`;
  }

  prompt += `SCRIPT FOR THIS CLIP (${segment.duration} seconds):\n"${segment.scriptSegment}"`;

  return prompt;
}
