export interface VideoGenerationRequest {
  script: string;
  voice: string;
  style: string;
  duration: number;
  // New optional parameters
  generationPreset?: string;
  qualityTier?: string;
  captionStyle?: string;
  audio?: string;
  resolution?: '720p' | '1080p';
  compression?: 9 | 18 | 33;
  frameRate?: 30 | 60;
  hasToGenerateCover?: boolean;
  ratio?: '9 / 16' | '16 / 9' | '1 / 1';
  disableCaptions?: boolean;
  captionPositionName?: 'bottom' | 'middle' | 'top';
  hasToGenerateVoice?: boolean;
  hasToGenerateMusic?: boolean;
  generationMusicPrompt?: string;
}

export interface VideoGenerationResponse {
  videoUrl: string | null;
  status: 'processing' | 'completed' | 'failed';
  progress?: number;
  projectId?: string;
}


export interface CreditCalculationResponse {
  credits: number;
  estimatedCost?: number;
}

export interface VoiceOption {
  id: string;
  name: string;
  description: string;
  category?: 'preselected' | 'custom';
  recordingUrl?: string; // For custom recorded voices
}

export interface MediaTypeOption {
  id: string;
  name: string;
  description: string;
  revidType: string;
}

export interface GenerationPresetOption {
  id: string;
  name: string;
  description: string;
  category: 'basic' | 'realistic' | 'artistic' | 'cartoon' | 'games' | 'vintage' | 'specialty';
}

export interface QualityTierOption {
  id: string;
  name: string;
  description: string;
  creditMultiplier: number;
}

export interface CaptionStyleOption {
  id: string;
  name: string;
  description: string;
}

export interface CaptionPositionOption {
  id: string;
  name: string;
  description: string;
}

export interface AudioOption {
  id: string;
  name: string;
  description: string;
  url: string;
}

export interface AspectRatioOption {
  id: string;
  name: string;
  description: string;
  ratio: '9 / 16' | '16 / 9' | '1 / 1';
}

export interface TechnicalSettings {
  resolution: '720p' | '1080p';
  compression: 9 | 18 | 33;
  frameRate: 30 | 60;
}

// Available voice options based on Revid.ai platform
export const AVAILABLE_VOICES: VoiceOption[] = [
  // Preselected Voice Library
  { id: 'cgSgspJ2msm6clMCkdW9', name: 'Jessica', description: 'Female - Warm & Friendly', category: 'preselected' },
  { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily', description: 'Female - Gentle & Soothing', category: 'preselected' },

  // Custom Voice Creation (uses custom recordings)
  { id: 'nPczCjzI2devNBz1zQrb', name: 'Amara', description: 'Female - Custom Voice', category: 'custom', recordingUrl: 'https://cdn.revid.ai/uploads/1759301410518-audio.mp3' },

  // Additional Voices
  { id: 'rU18Fk3uSDhmg5Xh41o4', name: 'Charlotte', description: 'Female - Professional & Clear' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Callum', description: 'Male - Confident & Authoritative' },
  { id: 'ThT5KcBeYPX3keUQqHPh', name: 'Rachel', description: 'Female - Energetic & Engaging' },
  { id: 'ZQe5CZNOzWyzPSCn5a3c', name: 'Daniel', description: 'Male - Calm & Trustworthy' },
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Emily', description: 'Female - Young & Vibrant' },
  { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Marcus', description: 'Male - Deep & Resonant' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sophie', description: 'Female - Sophisticated & Elegant' }
];

// Available media type options - Exact Revid.ai API values
export const AVAILABLE_MEDIA_TYPES: MediaTypeOption[] = [
  { id: 'stockVideo', name: 'Stock Video', description: 'Fast generation with high-quality stock footage', revidType: 'stockVideo' },
  { id: 'aiVideo', name: 'AI Generated', description: 'Custom AI-generated visuals for unique content', revidType: 'aiVideo' },
  { id: 'movingImage', name: 'Moving Images', description: 'AI images animated with motion effects', revidType: 'movingImage' }
];

// Available generation presets - Exact Revid.ai API values
export const AVAILABLE_GENERATION_PRESETS: GenerationPresetOption[] = [
  { id: 'DEFAULT', name: 'Default', description: 'Standard generation style', category: 'basic' },

  // Realistic Styles
  { id: 'REALISM', name: 'Enhanced Realism', description: 'Enhanced photorealistic quality', category: 'realistic' },
  { id: 'ULTRA_REALISM', name: 'Ultra Realism', description: 'Maximum photorealistic quality', category: 'realistic' },
  { id: 'PHOTOGRAPHY', name: 'Photography', description: 'Professional photography style', category: 'realistic' },
  { id: 'RAYTRACED', name: 'Raytraced', description: 'High-quality raytraced rendering', category: 'realistic' },

  // Artistic Styles
  { id: 'GHIBLI', name: 'Studio Ghibli', description: 'Studio Ghibli anime style', category: 'artistic' },
  { id: 'ANIME', name: 'Anime', description: 'Vibrant anime aesthetic', category: 'artistic' },
  { id: 'ANIME_SR', name: 'Anime SR', description: 'Super resolution anime style', category: 'artistic' },
  { id: 'MANGA', name: 'Manga', description: 'Japanese manga comic style', category: 'artistic' },
  { id: 'ILLUSTRATION', name: 'Illustration', description: 'Digital illustration style', category: 'artistic' },
  { id: 'STYLIZED_ILLUSTRATION', name: 'Stylized Illustration', description: 'Modern stylized illustration', category: 'artistic' },
  { id: 'CHILDRENS_BOOK_ILLUSTRATIONS', name: "Children's Book", description: 'Childrens book illustration style', category: 'artistic' },
  { id: 'SKETCH_COLOR', name: 'Colored Sketch', description: 'Hand-drawn colored pencil style', category: 'artistic' },
  { id: 'SKETCH_BW', name: 'Black & White Sketch', description: 'Classic pencil sketch style', category: 'artistic' },
  { id: 'INK', name: 'Ink Wash', description: 'Traditional ink painting', category: 'artistic' },
  { id: 'R_TECHNICAL_DRAWING', name: 'Technical Drawing', description: 'Technical blueprint style', category: 'artistic' },
  { id: 'R_TECHNICAL_DRAWING_RECRAFT', name: 'Technical Drawing Recraft', description: 'Recraft technical drawing', category: 'artistic' },

  // Cartoon & Animation Styles
  { id: 'PIXAR', name: 'Pixar 3D', description: '3D animated Pixar style', category: 'cartoon' },
  { id: 'FLAT_ANIMATION', name: 'Flat Animation', description: 'Flat 2D animation style', category: 'cartoon' },
  { id: 'RECRO_CARTOON', name: 'Retro Cartoon', description: 'Vintage cartoon styling', category: 'cartoon' },
  { id: 'PIXEL_ART', name: 'Pixel Art', description: '8-bit pixel art style', category: 'cartoon' },

  // Game & Pop Culture Styles
  { id: 'NINTENDO', name: 'Nintendo', description: 'Nintendo game art style', category: 'games' },
  { id: 'MINECRAFT', name: 'Minecraft', description: 'Minecraft blocky aesthetic', category: 'games' },
  { id: 'LEGO', name: 'LEGO Bricks', description: 'Hyper-realistic LEGO brick style', category: 'games' },
  { id: 'SPIDER', name: 'Spider-Verse', description: 'Spider-Verse comic style', category: 'games' },

  // Historical & Art Movement Styles
  { id: '1950S_ADVERTISEMENT', name: '1950s Advertisement', description: 'Vintage 1950s ad style', category: 'vintage' },
  { id: 'RENAISSANCE_FRESCO', name: 'Renaissance Fresco', description: 'Renaissance fresco painting', category: 'vintage' },
  { id: 'NEW_YORKER', name: 'New Yorker', description: 'New Yorker cartoon style', category: 'vintage' },
  { id: 'MODERN_NOIR_MINIMALISM', name: 'Modern Noir', description: 'Modern noir minimalist style', category: 'vintage' },

  // Specialty Styles
  { id: 'RENDER_3D', name: '3D Render', description: 'Professional 3D rendering', category: 'specialty' },
  { id: 'FANTASY', name: 'Fantasy', description: 'Epic fantasy world styling', category: 'specialty' },
  { id: 'SCIFI', name: 'Sci-Fi', description: 'Futuristic science fiction aesthetic', category: 'specialty' },
  { id: 'ENVIRONMENT', name: 'Environment', description: 'Detailed environmental scenes', category: 'specialty' },
  { id: 'MOVIE', name: 'Movie Style', description: 'Cinematic movie quality', category: 'specialty' },
  { id: 'CREATIVE', name: 'Creative', description: 'Artistic creative style', category: 'specialty' }
];

// Available quality tiers - Note: Only 'base' is available on current plan
export const AVAILABLE_QUALITY_TIERS: QualityTierOption[] = [
  { id: 'base', name: 'Base Quality', description: 'Available on your plan (720p, 30fps, standard compression)', creditMultiplier: 1.0 },
  { id: 'pro', name: 'Pro Quality', description: 'Requires upgrade (1080p, 30fps, medium compression)', creditMultiplier: 1.5 },
  { id: 'ultra', name: 'Ultra Quality', description: 'Requires upgrade (1080p, 60fps, low compression)', creditMultiplier: 2.0 }
];

// Available caption style presets - Exact Revid.ai API values
export const AVAILABLE_CAPTION_STYLES: CaptionStyleOption[] = [
  { id: 'Basic', name: 'Basic', description: 'Basic caption style' },
  { id: 'Revid', name: 'Revid', description: 'Revid signature style' },
  { id: 'Hormozi', name: 'Hormozi', description: 'Alex Hormozi style captions' },
  { id: 'Ali', name: 'Ali', description: 'Ali Abdaal style captions' },
  { id: 'Wrap 1', name: 'Wrap 1', description: 'Standard wrapped text style' },
  { id: 'Wrap 2', name: 'Wrap 2', description: 'Alternative wrapped text layout' },
  { id: 'Faceless', name: 'Faceless', description: 'Faceless content style captions' },
  { id: 'Elegant', name: 'Elegant', description: 'Elegant caption style' },
  { id: 'Difference', name: 'Difference', description: 'High contrast difference style' },
  { id: 'Opacity', name: 'Opacity', description: 'Opacity-based caption style' },
  { id: 'Playful', name: 'Playful', description: 'Playful and fun caption style' },
  { id: 'Bold Punch', name: 'Bold Punch', description: 'Bold and punchy captions' },
  { id: 'Movie', name: 'Movie', description: 'Cinematic movie-style captions' },
  { id: 'Outline', name: 'Outline', description: 'Outlined text caption style' },
  { id: 'Cove', name: 'Cove', description: 'Cove caption style' }
];

// Available aspect ratio options - Exact Revid.ai API values
export const AVAILABLE_ASPECT_RATIOS: AspectRatioOption[] = [
  { id: '9:16', name: 'Vertical (9:16)', description: 'TikTok/Reels format - Perfect for mobile', ratio: '9 / 16' },
  { id: '16:9', name: 'Horizontal (16:9)', description: 'YouTube/Desktop format', ratio: '16 / 9' },
  { id: '1:1', name: 'Square (1:1)', description: 'Instagram/Social media format', ratio: '1 / 1' }
];

// Available caption position options - Exact Revid.ai API values
export const AVAILABLE_CAPTION_POSITIONS: CaptionPositionOption[] = [
  { id: 'bottom', name: 'Bottom', description: 'Captions at bottom of video' },
  { id: 'middle', name: 'Middle', description: 'Captions in center of video' },
  { id: 'top', name: 'Top', description: 'Captions at top of video' }
];

// Available background audio options (only verified working options)
export const AVAILABLE_AUDIO_OPTIONS: AudioOption[] = [
  { id: 'Observer', name: 'Observer', description: 'Ambient, observational background music (verified)', url: 'https://cdn.revid.ai/audio/observer.mp3' },
  { id: 'none', name: 'No Music', description: 'Generate video without background music', url: '' }
];

export async function getAvailableVoices(): Promise<VoiceOption[]> {
  // Since Revid.ai doesn't provide a voices endpoint, return our curated list
  // This could be expanded in the future if they add such an endpoint
  return AVAILABLE_VOICES;
}

export async function getAvailableMediaTypes(): Promise<MediaTypeOption[]> {
  // Since Revid.ai doesn't provide a media types endpoint, return our curated list
  // This could be expanded in the future if they add such an endpoint
  return AVAILABLE_MEDIA_TYPES;
}

export async function getAvailableGenerationPresets(): Promise<GenerationPresetOption[]> {
  return AVAILABLE_GENERATION_PRESETS;
}

export async function getAvailableQualityTiers(): Promise<QualityTierOption[]> {
  return AVAILABLE_QUALITY_TIERS;
}

export async function getAvailableCaptionStyles(): Promise<CaptionStyleOption[]> {
  return AVAILABLE_CAPTION_STYLES;
}

export async function getAvailableAudioOptions(): Promise<AudioOption[]> {
  return AVAILABLE_AUDIO_OPTIONS;
}

export async function getAvailableAspectRatios(): Promise<AspectRatioOption[]> {
  return AVAILABLE_ASPECT_RATIOS;
}

export async function getAvailableCaptionPositions(): Promise<CaptionPositionOption[]> {
  return AVAILABLE_CAPTION_POSITIONS;
}

export async function generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
  const apiKey = process.env.REVID_API_KEY || process.env.REVID_API_KEY_ENV_VAR || "default_key";

  // Retry logic for API calls
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Find the voice by the request voice ID or name
      const voice = AVAILABLE_VOICES.find(v =>
        v.id === request.voice ||
        v.name.toLowerCase().includes(request.voice.toLowerCase()) ||
        request.voice.includes(v.name.toLowerCase())
      ) || AVAILABLE_VOICES[0]; // Default to first voice if not found

      // Find the media type by the request style ID or name
      const mediaType = AVAILABLE_MEDIA_TYPES.find(m =>
        m.id === request.style ||
        m.name.toLowerCase().includes(request.style.toLowerCase()) ||
        request.style.includes(m.id.toLowerCase())
      ) || AVAILABLE_MEDIA_TYPES[0]; // Default to first media type if not found

      // Find generation preset (defaults to DEFAULT if not specified)
      const generationPreset = AVAILABLE_GENERATION_PRESETS.find(p =>
        p.id === request.generationPreset
      ) || AVAILABLE_GENERATION_PRESETS[0];

      // Find quality tier (defaults to base if not specified)
      const qualityTier = AVAILABLE_QUALITY_TIERS.find(q =>
        q.id === request.qualityTier
      ) || AVAILABLE_QUALITY_TIERS[0];

      // Find caption style (defaults to wrap-1 if not specified)
      const captionStyle = AVAILABLE_CAPTION_STYLES.find(c =>
        c.id === request.captionStyle
      ) || AVAILABLE_CAPTION_STYLES[4]; // Default to "Wrap 1" which is index 4

      // Find audio option - ALWAYS use Observer as fallback/background music
      // Even with music generation, Revid.ai requires a background music URL
      let audioOption = AVAILABLE_AUDIO_OPTIONS.find(a =>
        a.id === request.audio
      ) || AVAILABLE_AUDIO_OPTIONS.find(a => a.id === 'Observer') || AVAILABLE_AUDIO_OPTIONS[0];

      // If user explicitly selected "none", use empty URL (but this will likely result in no audio)
      if (request.audio === 'none' && !request.hasToGenerateMusic) {
        audioOption = { id: 'none', name: 'None', description: 'No audio', url: '' };
      }

      // Apply quality tier specific settings - distinct behaviors for Base/Pro/Ultra
      let finalResolution = request.resolution;
      let finalCompression = request.compression;
      let finalFrameRate = request.frameRate;
      let enhancedGeneration = false;

      // Quality tier configurations
      if (qualityTier.id === 'base') {
        finalResolution = finalResolution || '720p';
        finalCompression = finalCompression || 33; // High compression for cost efficiency
        finalFrameRate = finalFrameRate || 30;
        enhancedGeneration = false;
      } else if (qualityTier.id === 'pro') {
        finalResolution = finalResolution || '1080p';
        finalCompression = finalCompression || 18; // Medium compression
        finalFrameRate = finalFrameRate || 30;
        enhancedGeneration = true; // Enable enhanced generation for Pro
      } else if (qualityTier.id === 'ultra') {
        finalResolution = finalResolution || '1080p';
        finalCompression = finalCompression || 9; // Low compression for highest quality
        finalFrameRate = finalFrameRate || 60; // High frame rate for smooth motion
        enhancedGeneration = true; // Enable enhanced generation for Ultra
      }

      // Use duration parameter to adjust generation settings if provided
      const videoDuration = request.duration || 30; // Default to 30 seconds
      let adjustedGenerationPrompt = "High quality, engaging content";
      if (videoDuration > 60) {
        adjustedGenerationPrompt = "High quality, engaging content with extended narrative flow";
      } else if (videoDuration < 15) {
        adjustedGenerationPrompt = "High quality, engaging content with quick visual impact";
      }

      // Create the request body according to Revid.ai V2 API format (from working example)
      const requestBody = {
        webhook: "", // Optional webhook URL
        resolution: finalResolution, // Quality tier specific resolution
        compression: finalCompression, // Quality tier specific compression
        frameRate: finalFrameRate, // Quality tier specific frame rate
        creationParams: {
          mediaType: mediaType.revidType, // stockVideo, movingImage, or aiVideo
          inputText: request.script,
          flowType: "text-to-video",
          slug: "create-tiktok-video",
          slugNew: "ai-tiktok-video-generator",
          isCopiedFrom: false,
          hasToGenerateVoice: request.hasToGenerateVoice !== undefined ? request.hasToGenerateVoice : true, // User controlled voice generation
          hasToTranscript: false,
          hasToSearchMedia: true,
          hasAvatar: false,
          hasWebsiteRecorder: false,
          hasTextSmallAtBottom: false,
          ratio: request.ratio || "9 / 16", // Use request ratio or default to vertical
          selectedAudio: null, // Always null per working example
          selectedVoice: voice.id,
          selectedAvatarType: "",
          websiteToRecord: "",
          hasToGenerateCover: request.hasToGenerateCover || false,
          coverTextType: request.hasToGenerateCover ? "layers" : undefined, // Add coverTextType when generating cover
          nbGenerations: 1,
          disableCaptions: request.disableCaptions || false,
          mediaMultiplier: "medium", // Critical: must be included
          characters: [],
          imageGenerationModel: "good",
          videoGenerationModel: "base",
          hasEnhancedGeneration: enhancedGeneration, // Quality tier specific enhanced generation
          hasEnhancedGenerationPro: false,
          useLegacyVoiceModel: false,
          captionPresetName: request.disableCaptions ? undefined : captionStyle.name, // User selectable caption style (undefined if captions disabled)
          captionPositionName: request.disableCaptions ? undefined : (request.captionPositionName || 'bottom'), // Caption position (undefined if captions disabled)
          sourceType: "contentScraping",
          selectedStoryStyle: {
            label: "General",
            value: "custom"
          },
          durationSeconds: videoDuration, // Explicitly include duration
          generationPreset: generationPreset.id, // User selectable artistic style
          scrapingPrompt: null,
          generationMusicPrompt: request.hasToGenerateMusic ? (request.generationMusicPrompt || null) : null, // Use null instead of empty string
          hasToGenerateMusic: request.hasToGenerateMusic || false,
          isOptimizedForChinese: false,
          generationUserPrompt: adjustedGenerationPrompt, // Duration-adjusted AI generation prompt
          maxNbMedias: null,
          enableNsfwFilter: false,
          addStickers: false,
          typeMovingImageAnim: "dynamic",
          hasToGenerateSoundEffects: false,
          fetchNews: null,
          selectedCharacters: [],
          lang: "",
          voiceStability: null,
          voiceSpeed: 1,
          selectedRecording: voice.recordingUrl || null, // Custom voice recording URL (for voices like Amara)
          selectedRecordingType: voice.recordingUrl ? "audio" : null, // Type of recording
          disableAudio: false,
          disableVoice: false,
          hasMergeVideosFull: true,
          inputMedias: [],
          hasToGenerateVideos: true,
          audioUrl: audioOption.url, // CRITICAL: Always include audioUrl even with hasToGenerateMusic
          watermark: null,
          origin: "/create"
        }
      };

      console.log(`Attempt ${attempt}/${maxRetries}: Generating video with Revid.ai`);
      console.log(`  Script: "${request.script.substring(0, 50)}..."`);
      console.log(`  Voice: ${voice.name} (${voice.id})`);
      console.log(`  Voice Recording URL: ${voice.recordingUrl || 'None (standard TTS)'}`);
      console.log(`  Audio/Music URL: ${audioOption.url}`);
      console.log(`  Style: ${generationPreset.name} (${generationPreset.id})`);
      console.log(`  Quality: ${qualityTier.name} (Enhanced: ${enhancedGeneration})`);
      console.log(`  Resolution: ${requestBody.resolution}, Compression: ${requestBody.compression}, FPS: ${requestBody.frameRate}`);
      console.log(`  Audio: ${audioOption.name}`);
      console.log(`  Duration: ${videoDuration}s`);
      console.log(`  Aspect Ratio: ${requestBody.creationParams.ratio}`);
      console.log(`  Captions: ${request.disableCaptions ? 'Disabled' : `${captionStyle.name} at ${request.captionPositionName || 'bottom'}`}`);
      console.log(`  Voice Narration: Enabled (using ${voice.name})`);
      console.log(`  Music Generation: ${requestBody.creationParams.hasToGenerateMusic ? 'Generate music' : 'Use library/silent'}`);
      if (requestBody.creationParams.hasToGenerateMusic) {
        console.log(`  Music Prompt: "${requestBody.creationParams.generationMusicPrompt || '(auto-generated from video text)'}"`);
      }
      console.log(`  Cover Generation: ${requestBody.creationParams.hasToGenerateCover ? 'Yes' : 'No'}`);
      console.log('Full Request Body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch('https://www.revid.ai/api/public/v2/render', {
        method: 'POST',
        headers: {
          'key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`Revid.ai API error (attempt ${attempt}): ${response.status} ${response.statusText}`);
        console.log(`Error response body: ${errorText}`);

        // If it's a 500 error and we have retries left, wait and try again
        if (response.status === 500 && attempt < maxRetries) {
          const waitTime = attempt * 2000; // Wait 2s, 4s, 6s between retries
          console.log(`Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          lastError = new Error(`Revid.ai API error: ${response.status} ${response.statusText} - ${errorText}`);
          continue;
        }

        throw new Error(`Revid.ai API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();

      // Success! Return the result
      console.log('Video generation request successful');
      return {
        videoUrl: data.videoUrl || data.url || null,
        status: data.status || 'processing',
        progress: data.progress,
        projectId: data.pid || data.projectId || data.id
      };

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      if (attempt < maxRetries && (error as any)?.message?.includes('500')) {
        console.log(`Attempt ${attempt} failed, retrying...`);
        continue;
      }

      // If we're out of retries or it's not a retryable error, throw
      break;
    }
  }

  // If we get here, all retries failed
  throw new Error(`Failed to generate video after ${maxRetries} attempts. Last error: ${lastError?.message || 'Unknown error'}. Note: Revid.ai API is currently in beta and experiencing server issues.`);
}

export interface CreditCalculationRequest {
  script: string;
  voice: string;
  style: string;
  // New optional parameters for accurate credit calculation
  generationPreset?: string;
  qualityTier?: string;
  captionStyle?: string;
  audio?: string;
  resolution?: '720p' | '1080p';
  compression?: 9 | 18 | 33;
  frameRate?: 30 | 60;
  hasToGenerateCover?: boolean;
  ratio?: '9 / 16' | '16 / 9' | '1 / 1';
  disableCaptions?: boolean;
  captionPositionName?: 'bottom' | 'middle' | 'top';
  hasToGenerateVoice?: boolean;
  hasToGenerateMusic?: boolean;
}

export async function calculateCredits(request: CreditCalculationRequest): Promise<CreditCalculationResponse> {
  const apiKey = process.env.REVID_API_KEY || process.env.REVID_API_KEY_ENV_VAR || "default_key";

  try {
    // Find all the options for the request using the same logic as video generation
    const voice = AVAILABLE_VOICES.find(v =>
      v.id === request.voice ||
      v.name.toLowerCase().includes(request.voice.toLowerCase()) ||
      request.voice.includes(v.name.toLowerCase())
    ) || AVAILABLE_VOICES[0];

    const mediaType = AVAILABLE_MEDIA_TYPES.find(m =>
      m.id === request.style ||
      m.name.toLowerCase().includes(request.style.toLowerCase()) ||
      request.style.includes(m.id.toLowerCase())
    ) || AVAILABLE_MEDIA_TYPES[0];

    const generationPreset = AVAILABLE_GENERATION_PRESETS.find(p => p.id === request.generationPreset) || AVAILABLE_GENERATION_PRESETS[0];
    const qualityTier = AVAILABLE_QUALITY_TIERS.find(q => q.id === request.qualityTier) || AVAILABLE_QUALITY_TIERS[0];
    const captionStyle = AVAILABLE_CAPTION_STYLES.find(c => c.id === request.captionStyle) || AVAILABLE_CAPTION_STYLES[4]; // Default to "Wrap 1"

    // Find audio option and handle music generation/no music modes
    let audioOption = AVAILABLE_AUDIO_OPTIONS.find(a => a.id === request.audio) || AVAILABLE_AUDIO_OPTIONS[0];

    // Override audio if generating music or no music mode
    if (request.hasToGenerateMusic || !request.audio || request.audio === '') {
      audioOption = { id: 'none', name: 'None', description: 'No audio', url: '' };
    }

    // Apply the same quality tier logic as video generation
    let finalResolution = request.resolution;
    let finalCompression = request.compression;
    let finalFrameRate = request.frameRate;
    let enhancedGeneration = false;

    if (qualityTier.id === 'base') {
      finalResolution = finalResolution || '720p';
      finalCompression = finalCompression || 33;
      finalFrameRate = finalFrameRate || 30;
      enhancedGeneration = false;
    } else if (qualityTier.id === 'pro') {
      finalResolution = finalResolution || '1080p';
      finalCompression = finalCompression || 18;
      finalFrameRate = finalFrameRate || 30;
      enhancedGeneration = true;
    } else if (qualityTier.id === 'ultra') {
      finalResolution = finalResolution || '1080p';
      finalCompression = finalCompression || 9;
      finalFrameRate = finalFrameRate || 60;
      enhancedGeneration = true;
    }

    // Create the request body for credit calculation including technical settings
    const requestBody = {
      resolution: finalResolution, // Include technical settings in credit calculation
      compression: finalCompression,
      frameRate: finalFrameRate,
      creationParams: {
        inputText: request.script,
        mediaType: mediaType.revidType,
        captionPresetName: captionStyle.name,
        selectedVoice: voice.id,
        hasEnhancedGeneration: enhancedGeneration, // Use quality tier specific enhanced generation
        generationPreset: generationPreset.id,
        generationUserPrompt: "High quality, engaging content",
        selectedAudio: audioOption.id !== 'none' ? audioOption.name : null,
        audioUrl: audioOption.id !== 'none' ? audioOption.url : null,
        origin: "/create",
        flowType: "text-to-video",
        slug: "create-tiktok-video",
        hasToGenerateVoice: request.hasToGenerateVoice !== undefined ? request.hasToGenerateVoice : true,
        hasToGenerateMusic: request.hasToGenerateMusic || false,
        hasToTranscript: false,
        hasToSearchMedia: true,
        hasAvatar: false,
        hasWebsiteRecorder: false,
        hasTextSmallAtBottom: false,
        ratio: "9 / 16",
        sourceType: "contentScraping",
        selectedStoryStyle: {
          "value": "custom",
          "label": "Custom"
        },
        hasToGenerateVideos: true,
        hasToGenerateCover: request.hasToGenerateCover || false
      }
    };

    console.log('Credit calculation request:', {
      quality: qualityTier.name,
      resolution: finalResolution,
      compression: finalCompression,
      frameRate: finalFrameRate,
      enhanced: enhancedGeneration,
      scriptLength: request.script.length
    });

    const response = await fetch('https://www.revid.ai/api/public/v2/calculate-credits', {
      method: 'POST',
      headers: {
        'key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`Revid.ai credit calculation API error: ${response.status} ${response.statusText}`);
      console.log(`Error response: ${errorText}`);

      // Enhanced fallback calculation with all parameters
      return calculateFallbackCredits(request, qualityTier, finalResolution, finalFrameRate, mediaType);
    }

    const data = await response.json();
    console.log('Credit calculation API response:', data);

    // Try different possible response field names since the API structure might vary
    const creditsValue = data.credits || data.credit || data.totalCredits || data.cost || data.estimatedCredits;

    if (creditsValue !== undefined && creditsValue !== null) {
      console.log(`Credit calculation successful: ${creditsValue} credits`);
      return {
        credits: creditsValue,
        estimatedCost: creditsValue * 0.02
      };
    } else {
      console.log('No credits field found in API response, using fallback calculation');
      return calculateFallbackCredits(request, qualityTier, finalResolution, finalFrameRate, mediaType);
    }

  } catch (error) {
    console.log(`Credit calculation failed: ${error}`);
    // Use fallback calculation with default values when API fails
    const fallbackQualityTier = AVAILABLE_QUALITY_TIERS.find(q => q.id === request.qualityTier) || AVAILABLE_QUALITY_TIERS[0];
    const fallbackMediaType = AVAILABLE_MEDIA_TYPES.find(m =>
      m.id === request.style ||
      m.name.toLowerCase().includes(request.style.toLowerCase()) ||
      request.style.includes(m.id.toLowerCase())
    ) || AVAILABLE_MEDIA_TYPES[0];

    let fallbackResolution = request.resolution || '1080p';
    let fallbackFrameRate = request.frameRate || 30;

    return calculateFallbackCredits(request, fallbackQualityTier, fallbackResolution, fallbackFrameRate, fallbackMediaType);
  }
}

// Enhanced fallback credit calculation function with all parameters
function calculateFallbackCredits(
  request: CreditCalculationRequest,
  qualityTier: QualityTierOption,
  resolution: string | undefined,
  frameRate: number | undefined,
  mediaType: MediaTypeOption
): CreditCalculationResponse {
  const finalResolution = resolution || '1080p';
  const finalFrameRate = frameRate || 30;
  const scriptLength = request.script.length;
  let baseCredits = 1; // Base API call cost
  let generationCredits = 8; // Base generation cost

  // Script length factor - longer scripts need more processing
  if (scriptLength > 1500) {
    generationCredits += 4;
  } else if (scriptLength > 1000) {
    generationCredits += 2;
  } else if (scriptLength > 500) {
    generationCredits += 1;
  }

  // Media type factor - AI generation is more expensive
  if (mediaType.revidType === 'aiVideo') {
    generationCredits += 6; // Most expensive
  } else if (mediaType.revidType === 'movingImage') {
    generationCredits += 3; // Medium cost
  } // stockVideo is base cost

  // Resolution factor
  if (finalResolution === '1080p') {
    generationCredits += 2;
  }

  // Frame rate factor
  if (finalFrameRate === 60) {
    generationCredits += 3;
  }

  // Apply quality tier multiplier
  generationCredits = Math.round(generationCredits * qualityTier.creditMultiplier);

  const totalCredits = baseCredits + generationCredits;

  console.log(`Fallback credit calculation: Base(${baseCredits}) + Generation(${generationCredits}) = ${totalCredits}`);

  return {
    credits: totalCredits,
    estimatedCost: totalCredits * 0.02
  };
}

export async function getVideoStatus(projectId: string): Promise<VideoGenerationResponse> {
  const apiKey = process.env.REVID_API_KEY || process.env.REVID_API_KEY_ENV_VAR || "default_key";

  try {
    const response = await fetch(`https://www.revid.ai/api/public/v2/status?pid=${projectId}`, {
      headers: {
        'key': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get video status: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Video status response for ${projectId}:`, data);

    return {
      videoUrl: data.videoUrl || data.url || data.downloadUrl || null,
      status: data.status || 'processing',
      progress: data.progress || data.progressPercentage,
      projectId: projectId
    };
  } catch (error) {
    throw new Error(`Failed to get video status: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
