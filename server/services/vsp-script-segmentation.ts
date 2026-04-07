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
  durations: DurationTier = [4, 8, 12]
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
  // Build a concise prompt — Veo responds better to shorter, direct prompts
  const parts: string[] = [];

  // 1. Core photorealism directive (always first — most important)
  parts.push(`Cinematic footage shot on 35mm film. Documentary-style realism. Real skin with visible pores, natural imperfections, subtle asymmetry. Practical warm lighting from real lamps. Handheld camera with natural micro-sway. Shallow depth of field. No AI look, no glossy skin, no perfect symmetry.`);

  // 2. Style block (character description, color palette, cinematography)
  if (styleBlock) {
    parts.push(styleBlock);
  }

  // 3. Visual context (condensed from the AI-generated visual prompt)
  // Only use the first 400 chars to keep it concise
  if (visualPrompt) {
    const condensed = visualPrompt.length > 400 ? visualPrompt.substring(0, 400) + '...' : visualPrompt;
    parts.push(condensed);
  }

  // 4. Continuity for clips 2+
  if (previousSegment) {
    parts.push(`Continuation of previous shot. Same person, clothes, setting, lighting, camera angle. Seamless transition.`);
  }

  // 5. The dialogue — keep it clean and explicit
  parts.push(`The speaker says exactly: "${segment.scriptSegment}"`);
  parts.push(`After saying the last word, the speaker pauses and holds a gentle expression. Silence. Do not speak any additional words beyond the script above.`);

  return parts.join('\n\n');
}

/**
 * Create a clip prompt for Kling v3
 * IMPORTANT: Kling multi_prompt has a 512 character limit per shot.
 * Must be extremely concise — just character description + dialogue.
 */
export function createKlingClipPrompt(
  visualPrompt: string,
  segment: ScriptSegment,
  styleBlock?: string
): string {
  // Extract just the character description from style block (most important part)
  let charDesc = '';
  if (styleBlock) {
    const charMatch = styleBlock.match(/CHARACTER:\s*([^\n|]+)/);
    if (charMatch) charDesc = charMatch[1].trim();
    const wardrobeMatch = styleBlock.match(/WARDROBE:\s*([^\n|]+)/);
    if (wardrobeMatch) charDesc += '. ' + wardrobeMatch[1].trim();
  }

  // Build concise prompt within 512 chars
  // Priority: character look + dialogue (these matter most for Kling)
  const dialogue = segment.scriptSegment.trim();

  let prompt = '';
  if (charDesc) {
    // Truncate character desc to leave room for dialogue
    const maxCharDesc = 300 - dialogue.length;
    const trimmedChar = charDesc.length > maxCharDesc ? charDesc.substring(0, maxCharDesc).trim() + '...' : charDesc;
    prompt = `Photorealistic talking head video. ${trimmedChar} She speaks to camera: "${dialogue}"`;
  } else {
    prompt = `Photorealistic talking head video. Woman speaks warmly to camera: "${dialogue}"`;
  }

  // Hard cap at 512
  if (prompt.length > 512) {
    prompt = prompt.substring(0, 509) + '..."';
  }

  return prompt;
}
