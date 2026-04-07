import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "default_key"
});

export interface ScriptSection {
  type: 'hook' | 'main' | 'cta';
  content: string;
  timing: string;
}

export interface GeneratedScript {
  content: string;
  sections: ScriptSection[];
  stats: {
    wordCount: number;
    duration: number;
    viralScore: number;
  };
}

export interface GeneratedCaption {
  text: string;
  hashtags: string[];
  engagementScore: number;
}

export async function generateScript(
  category: string,
  subtopic: string,
  promptTemplate: string,
  length: string
): Promise<GeneratedScript> {
  const durationSeconds = length === '15s' ? 15 : length === '30s' ? 30 : 60;

  // Calculate strict word count limits based on speaking rate (~2.5 words/second for TikTok pacing)
  const maxWordCount = Math.floor(durationSeconds * 2.5);
  const minWordCount = Math.floor(durationSeconds * 2.0);

  // Replace placeholders in the promptTemplate with actual values
  // Use replacement function to prevent $ characters from being treated as backreferences
  const processedTemplate = promptTemplate
    .replace(/{subtopic}/g, () => subtopic)
    .replace(/{category}/g, () => category)
    .replace(/{duration}/g, () => durationSeconds.toString());

  console.log('SCRIPT GENERATION - Using promptTemplate:', processedTemplate);
  console.log(`WORD COUNT TARGET: ${minWordCount}-${maxWordCount} words for ${durationSeconds}s video`);

  const prompt = `${processedTemplate}

CRITICAL WORD COUNT REQUIREMENT:
This script MUST be between ${minWordCount}-${maxWordCount} words total (for a ${durationSeconds}-second video at TikTok speaking pace).
- 15s video = 30-37 words maximum
- 30s video = 60-75 words maximum
- 60s video = 120-150 words maximum

Be CONCISE. Every word must count. Do NOT exceed ${maxWordCount} words under any circumstances.

Respond with JSON in this exact format:
{
  "content": "full script text (${minWordCount}-${maxWordCount} words ONLY)",
  "sections": [
    {
      "type": "hook",
      "content": "hook text (first 3 seconds)",
      "timing": "0-3s"
    },
    {
      "type": "main",
      "content": "main content text",
      "timing": "3-${durationSeconds-5}s"
    },
    {
      "type": "cta",
      "content": "call to action text",
      "timing": "${durationSeconds-5}-${durationSeconds}s"
    }
  ],
  "stats": {
    "wordCount": number (MUST be between ${minWordCount}-${maxWordCount}),
    "duration": ${durationSeconds},
    "viralScore": number (1-10 based on viral potential)
  }
}`;

  const maxRetries = 3;
  let attempts = 0;
  let result: any = null;
  let actualWordCount = 0;
  let estimatedDuration = 0;

  while (attempts < maxRetries) {
    attempts++;

    try {
      const response = await openai.chat.completions.create({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert viral content creator specializing in TikTok and Instagram Reels.
CRITICAL: You MUST respect word count limits. A ${durationSeconds}-second video needs EXACTLY ${minWordCount}-${maxWordCount} words.
${attempts > 1 ? `IMPORTANT: Previous attempt was too long. This time, be MORE CONCISE. Use ${Math.floor(maxWordCount * 0.8)} words or fewer.` : ''}`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
      });

      result = JSON.parse(response.choices[0].message.content || '{}');

      // Calculate actual word count and estimated duration
      actualWordCount = result.content ? result.content.trim().split(/\s+/).length : 0;
      estimatedDuration = Math.round(actualWordCount / 2.5); // 2.5 words per second

      console.log(`SCRIPT VALIDATION (Attempt ${attempts}/${maxRetries}):`);
      console.log(`   Requested: ${durationSeconds}s video (${minWordCount}-${maxWordCount} words)`);
      console.log(`   Generated: ${actualWordCount} words (~${estimatedDuration}s estimated duration)`);

      // Check if script is within acceptable bounds (allow up to 40% over for flexibility)
      if (actualWordCount <= maxWordCount * 1.4) {
        console.log(`Script is within acceptable length`);
        break; // Good enough, exit retry loop
      } else {
        console.log(`Script too long (${actualWordCount} words > ${Math.floor(maxWordCount * 1.4)} max). ${attempts < maxRetries ? 'Retrying...' : 'Using best result.'}`);
      }
    } catch (error) {
      if (attempts >= maxRetries) throw error;
      console.log(`Attempt ${attempts} failed, retrying...`);
    }
  }

  if (!result) {
    throw new Error('Failed to generate script after multiple attempts');
  }

  // Update stats with actual values
  if (result.stats) {
    result.stats.wordCount = actualWordCount;
    result.stats.estimatedDuration = estimatedDuration;
    result.stats.requestedDuration = durationSeconds;
  } else {
    result.stats = {
      wordCount: actualWordCount,
      duration: durationSeconds,
      estimatedDuration: estimatedDuration,
      requestedDuration: durationSeconds,
      viralScore: 7
    };
  }

    // CRITICAL FIX: Ensure sections text matches content exactly
    // OpenAI sometimes generates different text for sections vs content
    // We trust content as the source of truth and rebuild sections to match it
    if (result.content && result.sections && Array.isArray(result.sections)) {
      const sectionsText = result.sections.map((s: ScriptSection) => s.content).join(' ');

      // If sections don't match content, update section contents to match
      if (sectionsText.trim() !== result.content.trim()) {
        console.log('Warning: OpenAI generated mismatched content and sections. Syncing sections to match content.');

        // Split content roughly into sections (hook ~first 20%, main ~middle 60%, cta ~last 20%)
        const words = result.content.split(' ');
        const hookWords = Math.ceil(words.length * 0.2);
        const ctaWords = Math.ceil(words.length * 0.2);

        result.sections = [
          {
            type: 'hook',
            content: words.slice(0, hookWords).join(' '),
            timing: result.sections[0]?.timing || '0-3s'
          },
          {
            type: 'main',
            content: words.slice(hookWords, words.length - ctaWords).join(' '),
            timing: result.sections[1]?.timing || '3-10s'
          },
          {
            type: 'cta',
            content: words.slice(words.length - ctaWords).join(' '),
            timing: result.sections[2]?.timing || '10-15s'
          }
        ];
      }
  }

  return result as GeneratedScript;
}

export async function generateCaption(
  promptTemplate: string
): Promise<GeneratedCaption> {
  console.log('CAPTION GENERATION - Using promptTemplate:', promptTemplate);

  const prompt = `${promptTemplate}

Respond with JSON in this exact format:
{
  "text": "caption text with emojis",
  "hashtags": ["hashtag1", "hashtag2", ...],
  "engagementScore": number (1-10 based on engagement potential)
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini", // Faster and more cost-effective
      messages: [
        {
          role: "system",
          content: "You are a social media expert who creates high-converting captions that drive engagement and viral growth."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result as GeneratedCaption;
  } catch (error) {
    throw new Error(`Failed to generate caption: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateSoraVisualPrompt(
  script: GeneratedScript,
  category: string,
  subtopic: string,
  customInstructions?: string,
  characterProfile?: { description: string; wardrobe?: string; distinctiveFeatures?: string },
  colorPalette?: string[],
  cinematography?: { cameraStyle?: string; lightingStyle?: string }
): Promise<string> {
  const customInstructionSection = customInstructions
    ? `\n\nCUSTOM INSTRUCTIONS from the user (incorporate these into your directions):\n"${customInstructions}"\n`
    : '';

  // Build character consistency section
  let characterSection = '';
  if (characterProfile) {
    characterSection = `\n\nCHARACTER CONSISTENCY REQUIREMENTS (MUST include these exact details in EVERY clip):
- Physical Description: ${characterProfile.description}${characterProfile.wardrobe ? `\n- Wardrobe: ${characterProfile.wardrobe}` : ''}${characterProfile.distinctiveFeatures ? `\n- Distinctive Features: ${characterProfile.distinctiveFeatures}` : ''}`;
  }

  // Build color palette section
  let colorSection = '';
  if (colorPalette && colorPalette.length > 0) {
    colorSection = `\n\nCOLOR PALETTE (use these EXACT colors consistently):
${colorPalette.map((color, i) => `${i + 1}. ${color}`).join('\n')}`;
  }

  // Build cinematography section
  let cinematographySection = '';
  if (cinematography) {
    cinematographySection = `\n\nCINEMATOGRAPHY REQUIREMENTS:${cinematography.cameraStyle ? `\n- Camera Style: ${cinematography.cameraStyle}` : ''}${cinematography.lightingStyle ? `\n- Lighting Style: ${cinematography.lightingStyle}` : ''}`;
  }

  const prompt = `You are creating a concise visual prompt for Veo 3.1 AI video generation. Keep your output SHORT (100-150 words max). Veo works best with direct, specific prompts — not long essays.

SCRIPT (the character speaks these exact words):
"${script.content}"

Category: ${category}
Topic: ${subtopic}${customInstructionSection}${characterSection}${colorSection}${cinematographySection}

Write a SHORT prompt that covers:
1. Start with: "The speaker says: [first 20 words of script]..."
2. Character appearance (${characterProfile ? 'use the exact description above' : 'specific age, features, clothing'})
3. Setting and mood (cozy, warm, inviting — specific details)
4. Voice delivery (warm, conversational, unhurried pace)

MANDATORY REALISM RULES (weave these naturally into your prompt):
- "Shot on 35mm film" or "documentary-style footage" — this triggers Veo's realism mode
- Mention specific skin details: "visible pores, natural laugh lines, slight skin unevenness"
- "Practical warm lighting from real lamps" — never say "studio lighting"
- "Handheld camera with subtle natural movement"
- "Muted, desaturated color grading" — avoid words like "vibrant" or "stunning"
- NEVER use words: cinematic, beautiful, stunning, perfect, flawless, gorgeous, polished

OUTPUT: One concise paragraph, 100-150 words. No bullet points. No section headers.`;

  try {
    const response = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert video director who creates detailed visual and audio directions for AI video generation."
        },
        {
          role: "user",
          content: prompt
        }
      ],
    });

    const visualPrompt = response.choices[0].message.content?.trim() || '';

    if (!visualPrompt) {
      throw new Error('Failed to generate visual prompt - empty response');
    }

    console.log('Generated Sora visual prompt:', visualPrompt.substring(0, 200) + '...');

    return visualPrompt;
  } catch (error) {
    throw new Error(`Failed to generate Sora visual prompt: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
