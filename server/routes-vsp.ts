import { Router } from "express";
import type { Express } from "express";
import { storage } from "./storage";
import { verifyAdminAuth } from "./auth-middleware";
import { z, ZodError } from "zod";
import {
  vspScriptGenerationSchema,
  vspCaptionGenerationSchema,
  vspVideoGenerationSchema,
  insertVspContentProjectSchema,
  insertVspCampaignSchema,
  insertVspContentCalendarSchema,
  insertVspContentTemplateSchema,
  insertVspBulkGenerationJobSchema,
  insertVspContentCategorySchema,
  insertVspContentSubtopicSchema,
  insertVspScriptStyleSchema,
  insertVspCaptionStyleSchema,
  vspPublishToPostBridgeSchema
} from "../shared/schema";
import { generateScript, generateCaption, generateSoraVisualPrompt } from "./services/vsp-openai";
import {
  generateVideo,
  getVideoStatus,
  calculateCredits,
  getAvailableVoices,
  getAvailableMediaTypes,
  getAvailableGenerationPresets,
  getAvailableQualityTiers,
  getAvailableCaptionStyles,
  getAvailableAudioOptions,
  getAvailableAspectRatios,
  getAvailableCaptionPositions
} from "./services/vsp-revid";
import { generateVeoClip, waitForVeoVideo, pollVeoOperation, downloadVeoVideo } from "./services/vsp-veo";
import { generateKlingClip, pollKlingJob, waitForKlingVideo } from "./services/vsp-kling";
import { generateOmniHumanVideo, waitForOmniHumanVideo } from "./services/vsp-omnihuman";
import { generateAndUploadTTS, listTTSVoices } from "./services/vsp-tts";
import { getSocialAccounts, publishToPostBridge } from "./services/vsp-postbridge";
import { BulkContentGenerator } from "./services/vsp-bulk-generator";
import { segmentScriptForSora, createClipPrompt, createKlingClipPrompt, buildStyleBlock } from "./services/vsp-script-segmentation";
import { uploadVideoToS3, getPresignedUrl, getSignedVideoUrl } from "./s3";

function segmentScriptForVeo(
  script: { content: string },
  primaryDuration: number,
  availableDurations: number[],
  totalWords: number
): Array<{ clipNumber: number; scriptSegment: string; duration: number; wordCount: number; startTime: number; endTime: number; isLastClip: boolean }> {
  // Very conservative WPS — leaves 1.5-2s buffer at end so speaker finishes
  // and holds a natural pause before clip ends. Real speech is 2.3-2.8 WPS.
  const WORDS_PER_SECOND = 1.7;
  const maxWordsPerClip = Math.floor(primaryDuration * WORDS_PER_SECOND);

  // Split into sentences first for cleaner breaks
  const sentences = script.content.split(/(?<=[.!?])\s+/).filter(s => s.length > 0);
  const words = script.content.split(/\s+/).filter(w => w.length > 0);
  const segments: Array<{ clipNumber: number; scriptSegment: string; duration: number; wordCount: number; startTime: number; endTime: number; isLastClip: boolean }> = [];

  let currentStart = 0;
  let clipNumber = 1;
  let timeOffset = 0;

  while (currentStart < words.length) {
    const remainingWords = words.length - currentStart;

    // Pick best duration for this clip
    let clipDuration = primaryDuration;
    let clipMaxWords = maxWordsPerClip;

    // For the last clip, pick the shortest duration that fits
    if (remainingWords <= maxWordsPerClip) {
      for (const d of [...availableDurations].sort((a, b) => a - b)) {
        const maxForDuration = Math.floor(d * WORDS_PER_SECOND);
        if (remainingWords <= maxForDuration) {
          clipDuration = d;
          clipMaxWords = maxForDuration;
          break;
        }
      }
    }

    const endIndex = Math.min(currentStart + clipMaxWords, words.length);

    // ALWAYS break at sentence boundaries — never split mid-sentence
    let actualEnd = endIndex;
    if (endIndex < words.length) {
      // Search backwards from endIndex for a sentence-ending punctuation
      let bestBreak = -1;
      for (let i = endIndex - 1; i >= currentStart + Math.floor(clipMaxWords * 0.4); i--) {
        if (words[i].match(/[.!?]$/)) {
          bestBreak = i + 1;
          break;
        }
      }
      if (bestBreak > currentStart) {
        actualEnd = bestBreak;
      } else {
        // No sentence boundary found — look forward for one
        for (let i = endIndex; i < Math.min(endIndex + 5, words.length); i++) {
          if (words[i].match(/[.!?]$/)) {
            actualEnd = i + 1;
            break;
          }
        }
      }
    }

    const segmentWords = words.slice(currentStart, actualEnd);
    const segmentText = segmentWords.join(' ');
    const isLastClip = actualEnd >= words.length;

    segments.push({
      clipNumber,
      scriptSegment: segmentText,
      duration: clipDuration,
      wordCount: segmentWords.length,
      startTime: timeOffset,
      endTime: timeOffset + clipDuration,
      isLastClip,
    });

    timeOffset += clipDuration;
    currentStart = actualEnd;
    clipNumber++;
  }

  return segments;
}

export function registerVspRoutes(app: Express) {
  const router = Router();

  // All VSP endpoints are admin-only. Cost-bomb surface (LLM + video-gen APIs)
  // and no legitimate unauthenticated consumer exists.
  router.use(verifyAdminAuth);

  // Get all content projects
  router.get("/projects", async (req, res) => {
    try {
      const projects = await storage.getVspProjects();
      res.json(projects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  // Get single content project
  router.get("/projects/:id", async (req, res) => {
    try {
      const project = await storage.getVspProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  // Create new content project
  router.post("/projects", async (req, res) => {
    try {
      const validatedData = insertVspContentProjectSchema.parse(req.body);
      const project = await storage.createVspProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      res.status(400).json({ error: "Invalid project data" });
    }
  });

  // Generate script
  router.post("/generate/script", async (req, res) => {
    try {
      const { category, subtopic, style, length } = vspScriptGenerationSchema.parse(req.body);

      // Look up the script style to get its promptTemplate
      const scriptStyle = await storage.getVspScriptStyle(style);
      if (!scriptStyle) {
        return res.status(400).json({ error: "Script style not found" });
      }

      // Fetch subtopic to get its description
      const subtopicData = await storage.getVspContentSubtopic(subtopic);
      if (!subtopicData) {
        return res.status(400).json({ error: "Subtopic not found" });
      }

      // Create new project
      const project = await storage.createVspProject({
        category,
        subtopic,
        status: "draft"
      });

      // Generate script using the description only (not the name)
      const subtopicForAI = subtopicData.description || subtopicData.name;
      const script = await generateScript(category, subtopicForAI, scriptStyle.promptTemplate, length);

      // Update project with script
      const updatedProject = await storage.updateVspProject(project.id, {
        script,
        status: "script_generated"
      });

      res.json(updatedProject);
    } catch (error) {
      console.error("Script generation error:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to generate script"
      });
    }
  });

  // Save custom script (user-provided, not AI-generated)
  router.post("/projects/custom-script", async (req, res) => {
    try {
      const customScriptSchema = z.object({
        category: z.string().default("custom"),
        subtopic: z.string().default("custom-script"),
        script: z.string().min(1).max(5000),
        length: z.enum(['15s', '30s', '60s']).optional()
      });

      const { category, subtopic, script, length } = customScriptSchema.parse(req.body);

      // Calculate word count and estimated duration
      const wordCount = script.trim().split(/\s+/).length;
      const estimatedDuration = Math.round(wordCount / 2.5); // ~2.5 words per second

      // Parse length to get target duration
      const targetDuration = length === '15s' ? 15 : length === '30s' ? 30 : length === '60s' ? 60 : estimatedDuration;

      // Create new project with the custom script
      const project = await storage.createVspProject({
        category,
        subtopic,
        status: "draft"
      });

      // Format script in the same structure as AI-generated scripts
      const formattedScript = {
        content: script.trim(),
        sections: [
          {
            type: "main" as const,
            content: script.trim(),
            timing: `0-${targetDuration}s`
          }
        ],
        stats: {
          wordCount,
          duration: targetDuration,
          viralScore: 7
        }
      };

      // Update project with the custom script
      const updatedProject = await storage.updateVspProject(project.id, {
        script: formattedScript,
        status: "script_generated"
      });

      console.log(`Custom script saved: ${wordCount} words, ~${estimatedDuration}s duration`);
      res.json(updatedProject);
    } catch (error) {
      console.error("Custom script save error:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to save custom script"
      });
    }
  });

  // Regenerate script for existing project
  router.post("/projects/:projectId/regenerate-script", async (req, res) => {
    try {
      const { projectId } = req.params;
      const { style, length } = req.body;

      const project = await storage.getVspProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Look up the script style to get its promptTemplate
      const scriptStyle = await storage.getVspScriptStyle(style);
      if (!scriptStyle) {
        return res.status(400).json({ error: "Script style not found" });
      }

      // Fetch subtopic to get its description
      const subtopicData = await storage.getVspContentSubtopic(project.subtopic);
      if (!subtopicData) {
        return res.status(400).json({ error: "Subtopic not found" });
      }

      // Use project's existing category/subtopic description, with provided style/length
      const subtopicForAI = subtopicData.description || subtopicData.name;
      const script = await generateScript(
        project.category,
        subtopicForAI,
        scriptStyle.promptTemplate,
        length || '30s'
      );

      const updatedProject = await storage.updateVspProject(projectId, {
        script,
        status: "script_generated"
      });

      res.json(updatedProject);
    } catch (error) {
      console.error("Script regeneration error:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to regenerate script"
      });
    }
  });

  // Generate caption
  router.post("/generate/caption", async (req, res) => {
    try {
      const { projectId, tone, hashtagCount } = vspCaptionGenerationSchema.parse(req.body);

      const project = await storage.getVspProject(projectId);
      if (!project || !project.script) {
        return res.status(404).json({ error: "Project or script not found" });
      }

      // Fetch caption style template by ID
      const captionStyle = await storage.getVspCaptionStyle(tone);
      if (!captionStyle) {
        return res.status(400).json({ error: `Caption style '${tone}' not found` });
      }

      // Fetch subtopic to get its description
      const subtopicData = await storage.getVspContentSubtopic(project.subtopic);
      const subtopicForAI = subtopicData?.description || project.subtopic;

      // Replace placeholders in the promptTemplate with actual values
      // Use replacement function to prevent $ characters from being treated as backreferences
      const processedTemplate = captionStyle.promptTemplate
        .replace(/{subtopic}/g, () => subtopicForAI)
        .replace(/{category}/g, () => project.category)
        .replace(/{script}/g, () => project.script!.content) // Already checked for null above
        .replace(/{hashtagCount}/g, () => hashtagCount.toString());

      const caption = await generateCaption(processedTemplate);

      const updatedProject = await storage.updateVspProject(projectId, {
        caption,
        status: "caption_generated"
      });

      res.json(updatedProject);
    } catch (error) {
      console.error("Caption generation error:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to generate caption"
      });
    }
  });

  // Get available voices for video generation
  router.get("/voices", async (req, res) => {
    try {
      const voices = await getAvailableVoices();
      res.json(voices);
    } catch (error) {
      console.error("Failed to fetch voices:", error);
      res.status(500).json({ error: "Failed to fetch available voices" });
    }
  });

  // Get available media types for video generation
  router.get("/media-types", async (req, res) => {
    try {
      const mediaTypes = await getAvailableMediaTypes();
      res.json(mediaTypes);
    } catch (error) {
      console.error("Failed to fetch media types:", error);
      res.status(500).json({ error: "Failed to fetch available media types" });
    }
  });

  router.get("/generation-presets", async (req, res) => {
    try {
      const presets = await getAvailableGenerationPresets();
      res.json(presets);
    } catch (error) {
      console.error("Failed to fetch generation presets:", error);
      res.status(500).json({ error: "Failed to fetch available generation presets" });
    }
  });

  router.get("/quality-tiers", async (req, res) => {
    try {
      const tiers = await getAvailableQualityTiers();
      res.json(tiers);
    } catch (error) {
      console.error("Failed to fetch quality tiers:", error);
      res.status(500).json({ error: "Failed to fetch available quality tiers" });
    }
  });

  router.get("/caption-styles", async (req, res) => {
    try {
      const styles = await getAvailableCaptionStyles();
      res.json(styles);
    } catch (error) {
      console.error("Failed to fetch caption styles:", error);
      res.status(500).json({ error: "Failed to fetch available caption styles" });
    }
  });

  router.get("/audio-options", async (req, res) => {
    try {
      const audioOptions = await getAvailableAudioOptions();
      res.json(audioOptions);
    } catch (error) {
      console.error("Failed to fetch audio options:", error);
      res.status(500).json({ error: "Failed to fetch available audio options" });
    }
  });

  router.get("/aspect-ratios", async (req, res) => {
    try {
      const aspectRatios = await getAvailableAspectRatios();
      res.json(aspectRatios);
    } catch (error) {
      console.error("Failed to fetch aspect ratios:", error);
      res.status(500).json({ error: "Failed to fetch available aspect ratios" });
    }
  });

  router.get("/caption-positions", async (req, res) => {
    try {
      const positions = await getAvailableCaptionPositions();
      res.json(positions);
    } catch (error) {
      console.error("Failed to fetch caption positions:", error);
      res.status(500).json({ error: "Failed to fetch available caption positions" });
    }
  });

  // Calculate credits for video generation - only for Revid engine
  router.post("/calculate-credits", async (req, res) => {
    try {
      const parsedBody = vspVideoGenerationSchema.parse(req.body);
      const {
        projectId,
        videoEngine = 'revid',
        style,
        voice,
        generationPreset,
        qualityTier,
        captionStyle,
        audio,
        resolution,
        compression,
        frameRate,
        hasToGenerateCover,
        ratio,
        disableCaptions,
        captionPositionName,
        hasToGenerateVoice,
        hasToGenerateMusic
      } = parsedBody;

      // Veo uses Google API pricing, not Revid credits
      if (videoEngine === 'veo') {
        return res.json({ credits: 0, note: "Veo videos use Google API pricing, not Revid credits" });
      }

      if (!style || !voice) {
        return res.status(400).json({ error: "Style and voice are required for Revid credit calculation" });
      }

      const project = await storage.getVspProject(projectId);
      if (!project || !project.script) {
        return res.status(404).json({ error: "Project or script not found" });
      }

      // Credits are based on script content and new parameters
      const credits = await calculateCredits({
        script: project.script.content,
        voice: voice,
        style: style,
        generationPreset,
        qualityTier,
        captionStyle,
        audio,
        resolution,
        compression: compression as 9 | 18 | 33 | undefined,
        frameRate: frameRate as 30 | 60 | undefined,
        hasToGenerateCover,
        ratio: ratio as '9 / 16' | '16 / 9' | '1 / 1' | undefined,
        disableCaptions,
        captionPositionName: captionPositionName as 'bottom' | 'middle' | 'top' | undefined,
        hasToGenerateVoice,
        hasToGenerateMusic
      });

      res.json(credits);
    } catch (error) {
      console.error("Credit calculation error:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to calculate credits"
      });
    }
  });

  // Generate video
  router.post("/generate/video", async (req, res) => {
    try {
      const parsedBody = vspVideoGenerationSchema.parse(req.body);
      const {
        projectId,
        videoEngine = 'revid',
        // Revid parameters
        style,
        voice,
        generationPreset,
        qualityTier,
        captionStyle,
        audio,
        resolution,
        compression,
        frameRate,
        hasToGenerateCover,
        ratio,
        disableCaptions,
        captionPositionName,
        hasToGenerateVoice,
        hasToGenerateMusic,
        // Veo parameters
        veoAspectRatio,
        veoResolution,
        veoCustomInstructions,
        veoReferenceImages,
        veoFirstFrameImage,
        veoLastFrameImage,
        veoPersonGeneration,
        veoNumberOfVideos,
        // Character Consistency Settings
        characterProfile,
        colorPalette,
        cinematography
      } = parsedBody;

      const project = await storage.getVspProject(projectId);
      if (!project || !project.script) {
        return res.status(404).json({ error: "Project or script not found" });
      }

      console.log(`\n=== VIDEO GENERATION (${videoEngine.toUpperCase()}) ===`);
      console.log(`Project ID: ${projectId}`);
      console.log(`Engine: ${videoEngine}`);
      console.log(`Script: "${project.script.content.substring(0, 100)}..."`);
      console.log(`===============================\n`);

      // Save settings immediately so they persist even if generation fails
      // (excludes large base64 image blobs — only saves text/config fields)
      const initialVideoSettings: any = { videoEngine };
      if (videoEngine === 'veo') {
        Object.assign(initialVideoSettings, {
          veoAspectRatio, veoResolution, veoCustomInstructions,
          veoPersonGeneration, veoNumberOfVideos,
          veoDuration: (parsedBody as any).veoDuration || 'auto',
          characterProfile, colorPalette, cinematography,
        });
      }

      await storage.updateVspProject(projectId, {
        status: "video_generating",
        videoSettings: initialVideoSettings,
      });

      if (videoEngine === 'veo') {
        // Handle Veo 3.1 video generation
        const subtopicData = await storage.getVspContentSubtopic(project.subtopic);
        const subtopicForAI = subtopicData?.description || project.subtopic;

        const visualPrompt = await generateSoraVisualPrompt(
          project.script,
          project.category,
          subtopicForAI,
          veoCustomInstructions,
          characterProfile,
          colorPalette,
          cinematography
        );

        const styleBlock = buildStyleBlock(characterProfile, colorPalette, cinematography, veoCustomInstructions);

        const WORDS_PER_SECOND = 2.5;
        const veoDurationSetting = (parsedBody as any).veoDuration || 'auto';
        const scriptWordCount = project.script.content.split(' ').length;

        // Smart duration logic:
        // - "auto": use 8s clips for most, pick best shorter duration for remainder
        // - specific value: use that duration for all clips
        let primaryDuration: number;
        let availableDurations: number[];

        // Scene extension only works with 720p — downgrade for multi-clip
        const effectiveResolution = (veoResolution === '1080p' || veoResolution === '4k') ? '720p' : veoResolution;

        // 1080p and 4k require 8s clips — override duration setting
        const requiresEightSeconds = veoResolution === '1080p' || veoResolution === '4k';

        if (requiresEightSeconds) {
          primaryDuration = 8;
          availableDurations = [8];
        } else if (veoDurationSetting === 'auto') {
          primaryDuration = 8;
          availableDurations = [8, 6, 4]; // prefer 8s, fall back to 6 or 4 for last clip
        } else {
          primaryDuration = parseInt(veoDurationSetting);
          availableDurations = [primaryDuration];
        }

        const MAX_SINGLE_CLIP_WORDS = Math.floor(primaryDuration * WORDS_PER_SECOND * 1.15);
        const needsMultiClip = scriptWordCount > MAX_SINGLE_CLIP_WORDS;

        console.log(`Veo script analysis: ${scriptWordCount} words, duration mode: ${veoDurationSetting}, primary: ${primaryDuration}s`);
        console.log(`Multi-clip mode: ${needsMultiClip ? 'YES' : 'NO'}`);

        if (needsMultiClip) {
          console.log('Starting sequential Veo multi-clip generation with scene extension...');

          const segments = segmentScriptForVeo(project.script, primaryDuration, availableDurations, scriptWordCount);
          console.log(`Created ${segments.length} clip segments`);

          const clips: Array<{
            clipNumber: number;
            scriptSegment: string;
            duration: number;
            prompt: string;
            operationName?: string;
            videoUrl?: string;
            videoFileId?: string;
            status: 'pending' | 'generating' | 'completed' | 'failed';
            error?: string;
            attempts?: number;
            progress?: number;
          }> = [];

          let lastVideoObject: { uri: string } | undefined;

          const makeVeoSettings = () => {
            // Strip base64 images from settings to avoid JSON column size issues
            const settings: any = {
              videoEngine: 'veo' as const,
              veoAspectRatio,
              veoResolution,
              veoCustomInstructions,
              veoDuration: veoDurationSetting,
              veoPersonGeneration,
              veoNumberOfVideos,
              characterProfile,
              colorPalette,
              cinematography,
              veoVisualPrompt: visualPrompt,
              veoClips: clips,
              veoStitchingStatus: 'pending' as const,
              // Store image presence flags instead of full base64
              hasReferenceImages: !!(veoReferenceImages && veoReferenceImages.length),
              hasFirstFrameImage: !!veoFirstFrameImage,
              hasLastFrameImage: !!veoLastFrameImage,
            };
            return settings;
          };

          for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            const previousSegment = i > 0 ? segments[i - 1] : null;

            const clipPrompt = createClipPrompt(
              visualPrompt,
              segment,
              previousSegment,
              veoCustomInstructions,
              !!(veoReferenceImages && veoReferenceImages.length > 0 && i === 0),
              styleBlock
            );

            const clip: typeof clips[0] = {
              clipNumber: segment.clipNumber,
              scriptSegment: segment.scriptSegment,
              duration: segment.duration,
              prompt: clipPrompt,
              status: 'generating',
              attempts: 1,
              progress: 0
            };

            console.log(`Submitting Veo clip ${segment.clipNumber}/${segments.length}${lastVideoObject ? ' (with scene extension)' : ''}...`);

            try {
              const result = await generateVeoClip({
                prompt: clipPrompt,
                clipNumber: clip.clipNumber,
                aspectRatio: veoAspectRatio as '9:16' | '16:9' | undefined,
                referenceImages: i === 0 ? veoReferenceImages : undefined,
                resolution: effectiveResolution as any,
                extendVideo: lastVideoObject,
                firstFrameImage: i === 0 ? veoFirstFrameImage : undefined,
                lastFrameImage: i === 0 ? veoLastFrameImage : undefined,
                personGeneration: veoPersonGeneration,
                durationSeconds: segment.duration,
              });

              clip.operationName = result.operationName;
            } catch (submitErr) {
              console.error(`Failed to submit Veo clip ${clip.clipNumber}:`, submitErr);
              clip.status = 'failed';
              clip.error = submitErr instanceof Error ? submitErr.message : 'Failed to submit clip';
              clips.push(clip);
              await storage.updateVspProject(projectId, { videoSettings: makeVeoSettings(), status: 'video_generating' });
              lastVideoObject = undefined; // Reset scene extension since this clip failed
              continue; // Skip to next clip
            }

            clips.push(clip);

            try {
              const settingsToSave = makeVeoSettings();
              const settingsSize = JSON.stringify(settingsToSave).length;
              console.log(`Saving videoSettings for clip ${clip.clipNumber} (${(settingsSize / 1024).toFixed(1)}KB)...`);
              await storage.updateVspProject(projectId, {
                videoSettings: settingsToSave,
                status: 'video_generating'
              });
              console.log(`videoSettings saved successfully for clip ${clip.clipNumber}`);
            } catch (saveErr) {
              console.error(`FAILED to save videoSettings for clip ${clip.clipNumber}:`, saveErr);
            }

            if (i < segments.length - 1) {
              try {
                console.log(`Waiting for Veo clip ${segment.clipNumber} to complete for scene extension...`);
                const { videoBuffer, videoFileId, videoObject } = await waitForVeoVideo(
                  clip.operationName!,
                  async (status) => {
                    clip.progress = status === 'completed' ? 100 : 50;
                    await storage.updateVspProject(projectId, {
                      videoSettings: makeVeoSettings(),
                      status: 'video_generating'
                    });
                  }
                );

                clip.status = 'completed';
                clip.videoFileId = videoFileId;
                clip.progress = 100;

                if (videoObject) {
                  lastVideoObject = { uri: videoObject.uri };
                  console.log(`Using Veo clip ${segment.clipNumber} video as extension source for next clip`);
                }

                await storage.updateVspProject(projectId, {
                  videoSettings: makeVeoSettings(),
                  status: 'video_generating'
                });
              } catch (err) {
                console.warn(`Failed to wait for Veo clip ${segment.clipNumber}:`, err);
                clip.status = 'failed';
                clip.error = err instanceof Error ? err.message : 'Failed to generate clip';
              }
            }
          }

          const updatedProject = await storage.updateVspProject(projectId, {
            videoSettings: makeVeoSettings(),
            status: 'video_generating'
          });

          console.log(`Sequential Veo multi-clip generation complete: ${clips.length} clips`);
          return res.json(updatedProject);
        } else {
          // SINGLE-CLIP VEO WORKFLOW
          console.log('Starting single-clip Veo generation...');

          const veoResult = await generateVeoClip({
            prompt: visualPrompt,
            clipNumber: 1,
            aspectRatio: veoAspectRatio as '9:16' | '16:9' | undefined,
            referenceImages: veoReferenceImages,
            resolution: veoResolution as any,
            firstFrameImage: veoFirstFrameImage,
            lastFrameImage: veoLastFrameImage,
            personGeneration: veoPersonGeneration,
            numberOfVideos: veoNumberOfVideos,
            durationSeconds: primaryDuration,
          });

          const updatedProject = await storage.updateVspProject(projectId, {
            videoSettings: {
              videoEngine: 'veo',
              veoAspectRatio,
              veoResolution,
              veoCustomInstructions,
              veoReferenceImages,
              veoDuration: veoDurationSetting,
              veoFirstFrameImage,
              veoLastFrameImage,
              veoPersonGeneration,
              veoNumberOfVideos,
              characterProfile,
              colorPalette,
              cinematography,
              veoVisualPrompt: visualPrompt,
            },
            status: 'video_generating',
            veoOperationName: veoResult.operationName,
          });

          res.json(updatedProject);
        }
      } else if (videoEngine === 'kling') {
        // === KLING V3 VIDEO GENERATION ===
        const klingAspectRatio = parsedBody.klingAspectRatio || '9:16';
        const klingDuration = parsedBody.klingDuration || '10';
        const klingTier = (parsedBody as any).klingTier || 'pro';
        const klingReferenceImage = parsedBody.klingReferenceImage;
        const klingCustomInstructions = parsedBody.klingCustomInstructions;
        const klingElementBinding = parsedBody.klingElementBinding !== false;
        const klingUseMultiPrompt = (parsedBody as any).klingUseMultiPrompt !== false; // default true

        console.log(`[Kling] Starting generation for project ${projectId}`);
        console.log(`[Kling] Tier: ${klingTier}, Aspect: ${klingAspectRatio}, Duration: ${klingDuration}s, MultiPrompt: ${klingUseMultiPrompt}`);

        // Generate visual prompt using existing AI prompt generator
        const visualPrompt = await generateSoraVisualPrompt(
          project.script,
          project.category,
          project.subtopic,
          klingCustomInstructions,
          characterProfile,
          colorPalette,
          cinematography
        );

        const styleBlock = buildStyleBlock(characterProfile, colorPalette, cinematography, klingCustomInstructions);

        // Segment script using the same smart approach as Veo
        // Kling supports 3-15s per shot. Use segmentScriptForVeo with available durations.
        const maxShotDuration = parseInt(klingDuration);
        const wordCount = project.script.content.trim().split(/\s+/).length;

        // Build available durations: 3 to maxShotDuration
        const availableKlingDurations: number[] = [];
        for (let d = 3; d <= maxShotDuration; d++) availableKlingDurations.push(d);

        const finalSegments = segmentScriptForVeo(
          project.script,
          maxShotDuration,
          availableKlingDurations,
          wordCount
        );

        const totalShotDuration = finalSegments.reduce((sum, s) => sum + s.duration, 0);
        console.log(`[Kling] Script: ${wordCount} words, ${finalSegments.length} shots, ${totalShotDuration}s total (max ${klingDuration}s/shot)`);

        // Build prompts for each segment
        const shotPrompts = finalSegments.map(seg => createKlingClipPrompt(visualPrompt, seg, styleBlock));

        // Estimate cost based on actual shot durations
        const totalSeconds = finalSegments.reduce((sum, s) => sum + s.duration, 0);
        const costPerSec = klingTier === 'standard' ? 0.126 : 0.168;
        const estimatedCost = (totalSeconds * costPerSec).toFixed(2);
        console.log(`[Kling] Estimated cost: $${estimatedCost} (${totalSeconds}s x $${costPerSec}/s)`);

        // Multi-prompt only works if total duration ≤ 15s (Kling API limit)
        const canUseMultiPrompt = klingUseMultiPrompt && finalSegments.length > 1 && totalShotDuration <= 15;
        if (!canUseMultiPrompt && klingUseMultiPrompt && totalShotDuration > 15) {
          console.log(`[Kling] Multi-prompt disabled: total ${totalShotDuration}s exceeds 15s limit. Using separate clips.`);
        }

        if (canUseMultiPrompt) {
          // === MULTI-PROMPT: One API call for all shots ===
          const multiPromptSegments = finalSegments.map((seg, i) => ({
            prompt: shotPrompts[i],
            duration: seg.duration,
          }));

          // Save settings immediately
          await storage.updateVspProject(projectId, {
            videoSettings: {
              videoEngine: 'kling',
              klingAspectRatio,
              klingDuration,
              klingTier,
              klingElementBinding,
              klingCustomInstructions,
              klingUseMultiPrompt: true,
              characterProfile: characterProfile ? { description: characterProfile.description, wardrobe: characterProfile.wardrobe } : undefined,
              colorPalette,
              cinematography,
              klingVisualPrompt: visualPrompt,
              klingMultiShot: true,
              klingShots: finalSegments.map((seg, i) => ({
                shotNumber: seg.clipNumber,
                scriptSegment: seg.scriptSegment,
                duration: seg.duration,
                prompt: shotPrompts[i],
              })),
              klingRequestId: '',
              klingModelId: '',
              klingStatus: 'generating',
              klingEstimatedCost: estimatedCost,
            },
            status: 'video_generating',
          });

          try {
            const { generateKlingMultiShot } = await import("./services/vsp-kling");
            const result = await generateKlingMultiShot({
              segments: multiPromptSegments,
              aspectRatio: klingAspectRatio as "16:9" | "9:16" | "1:1",
              referenceImage: klingReferenceImage,
              tier: klingTier as any,
              generateAudio: true,
            });

            await storage.updateVspProject(projectId, {
              videoSettings: {
                ...((await storage.getVspProject(projectId))?.videoSettings || {}),
                klingRequestId: result.requestId,
                klingModelId: result.modelId,
                klingStatusUrl: result.statusUrl,
                klingResponseUrl: result.responseUrl,
                klingStatus: 'generating',
              },
              falRequestId: result.requestId,
            });

            const updatedProject = await storage.getVspProject(projectId);
            res.json(updatedProject);
          } catch (err) {
            console.error(`[Kling] Multi-shot submission failed:`, err);
            await storage.updateVspProject(projectId, {
              videoSettings: {
                ...((await storage.getVspProject(projectId))?.videoSettings || {}),
                klingStatus: 'failed',
                klingError: err instanceof Error ? err.message : 'Submission failed',
              },
              status: 'video_failed',
            });
            throw err;
          }

        } else {
          // === SINGLE-CLIP or LEGACY MULTI-CLIP (separate API calls) ===
          const klingClips = finalSegments.map(seg => ({
            clipNumber: seg.clipNumber,
            scriptSegment: seg.scriptSegment,
            duration: seg.duration,
            prompt: '',
            requestId: '',
            modelId: '',
            videoUrl: '',
            status: 'pending' as const,
            error: '',
            attempts: 0,
          }));

          await storage.updateVspProject(projectId, {
            videoSettings: {
              videoEngine: 'kling',
              klingAspectRatio,
              klingDuration,
              klingTier,
              klingElementBinding,
              klingCustomInstructions,
              klingUseMultiPrompt: false,
              characterProfile: characterProfile ? { description: characterProfile.description, wardrobe: characterProfile.wardrobe } : undefined,
              colorPalette,
              cinematography,
              klingVisualPrompt: visualPrompt,
              klingClips,
              klingStitchingStatus: 'pending',
              klingEstimatedCost: estimatedCost,
            },
            status: 'video_generating',
          });

          // Submit clips 2 at a time
          for (let i = 0; i < finalSegments.length; i += 2) {
            const batch = finalSegments.slice(i, i + 2);
            const results = await Promise.all(batch.map(async (segment, batchIdx) => {
              try {
                const result = await generateKlingClip({
                  prompt: shotPrompts[i + batchIdx],
                  clipNumber: segment.clipNumber,
                  aspectRatio: klingAspectRatio as "16:9" | "9:16" | "1:1",
                  duration: klingDuration,
                  referenceImage: klingReferenceImage,
                  tier: klingTier as any,
                });
                return { clipNumber: segment.clipNumber, ...result, prompt: shotPrompts[i + batchIdx], error: '' };
              } catch (err) {
                console.error(`[Kling] Clip ${segment.clipNumber} submission failed:`, err);
                return { clipNumber: segment.clipNumber, requestId: '', modelId: '', statusUrl: '', responseUrl: '', prompt: shotPrompts[i + batchIdx], error: err instanceof Error ? err.message : 'Submission failed' };
              }
            }));

            for (const result of results) {
              const clipIdx = result.clipNumber - 1;
              klingClips[clipIdx].requestId = result.requestId;
              klingClips[clipIdx].modelId = result.modelId || '';
              (klingClips[clipIdx] as any).statusUrl = result.statusUrl || '';
              (klingClips[clipIdx] as any).responseUrl = result.responseUrl || '';
              klingClips[clipIdx].prompt = result.prompt;
              (klingClips[clipIdx] as any).status = result.error ? 'failed' : 'generating';
              klingClips[clipIdx].error = result.error;
            }

            await storage.updateVspProject(projectId, {
              videoSettings: {
                ...((await storage.getVspProject(projectId))?.videoSettings || {}),
                klingClips,
              },
            });
          }

          const project2 = await storage.getVspProject(projectId);
          res.json(project2);
        }

      } else if (videoEngine === 'omnihuman') {
        // === OMNIHUMAN 1.5 TALKING HEAD VIDEO ===
        const omniReferenceImage = parsedBody.omniReferenceImage;
        let omniAudioUrl = parsedBody.omniAudioUrl;
        const omniResolution = parsedBody.omniResolution || '1080p';
        const omniVoiceId = parsedBody.omniVoiceId;

        if (!omniReferenceImage) {
          return res.status(400).json({ error: "OmniHuman requires a reference image" });
        }

        console.log(`[OmniHuman] Starting generation for project ${projectId}`);

        // If voice ID is set but no audio URL, generate TTS first
        if (omniVoiceId && !omniAudioUrl) {
          console.log(`[OmniHuman] Generating TTS audio with voice ${omniVoiceId}...`);
          omniAudioUrl = await generateAndUploadTTS(
            project.script.content,
            omniVoiceId,
            projectId
          );
          console.log(`[OmniHuman] TTS audio uploaded: ${omniAudioUrl}`);
        }

        if (!omniAudioUrl) {
          return res.status(400).json({ error: "OmniHuman requires audio. Either upload an audio file or select a TTS voice." });
        }

        // Save settings immediately
        await storage.updateVspProject(projectId, {
          videoSettings: {
            videoEngine: 'omnihuman',
            omniResolution,
            omniVoiceId,
            omniAudioUrl,
            omniRequestId: '',
            omniModelId: '',
            omniStatus: 'generating',
          },
          status: 'video_generating',
        });

        try {
          const result = await generateOmniHumanVideo({
            referenceImage: omniReferenceImage,
            audioUrl: omniAudioUrl,
            resolution: omniResolution as "720p" | "1080p",
          });

          await storage.updateVspProject(projectId, {
            videoSettings: {
              videoEngine: 'omnihuman',
              omniResolution,
              omniVoiceId,
              omniAudioUrl,
              omniRequestId: result.requestId,
              omniModelId: result.modelId,
              omniStatus: 'generating',
            },
            falRequestId: result.requestId,
          });

          const updatedProject = await storage.getVspProject(projectId);
          res.json(updatedProject);
        } catch (err) {
          console.error(`[OmniHuman] Generation failed:`, err);
          await storage.updateVspProject(projectId, {
            videoSettings: {
              videoEngine: 'omnihuman',
              omniResolution,
              omniVoiceId,
              omniAudioUrl,
              omniStatus: 'failed',
              omniError: err instanceof Error ? err.message : 'Generation failed',
            },
            status: 'video_failed',
          });
          throw err;
        }

      } else {
        // Handle Revid video generation (existing logic)
        if (!style || !voice) {
          return res.status(400).json({
            error: "Revid parameters (style, voice) are required when using Revid engine"
          });
        }

        const videoSettings = {
          videoEngine: 'revid' as const,
          style,
          voice,
          length: project.script.stats.duration,
          format: ratio || "9:16",
          generationPreset,
          qualityTier,
          captionStyle,
          audio,
          resolution,
          compression: compression as 9 | 18 | 33 | undefined,
          frameRate: frameRate as 30 | 60 | undefined,
          hasToGenerateCover,
          ratio: ratio as '9 / 16' | '16 / 9' | '1 / 1' | undefined,
          disableCaptions,
          captionPositionName: captionPositionName as 'bottom' | 'middle' | 'top' | undefined,
          hasToGenerateVoice,
          hasToGenerateMusic
        };

        await storage.updateVspProject(projectId, {
          videoSettings
        });

        const videoResult = await generateVideo({
          script: project.script.content,
          voice,
          style,
          duration: project.script.stats.duration,
          generationPreset,
          qualityTier,
          captionStyle,
          audio,
          resolution,
          compression: compression as 9 | 18 | 33 | undefined,
          frameRate: frameRate as 30 | 60 | undefined,
          hasToGenerateCover,
          ratio: ratio as '9 / 16' | '16 / 9' | '1 / 1' | undefined,
          disableCaptions,
          captionPositionName: captionPositionName as 'bottom' | 'middle' | 'top' | undefined,
          hasToGenerateVoice,
          hasToGenerateMusic
        });

        const updatedProject = await storage.updateVspProject(projectId, {
          videoUrl: videoResult.videoUrl,
          status: videoResult.videoUrl ? "completed" : "video_generating",
          revidProjectId: videoResult.projectId
        });

        res.json(updatedProject);
      }
    } catch (error) {
      console.error("Video generation error:", error);

      // Reset project status if it was set to video_generating
      const failedProjectId = req.body?.projectId;
      if (failedProjectId) {
        try {
          await storage.updateVspProject(failedProjectId, { status: 'video_failed' });
        } catch {}
      }

      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to generate video"
      });
    }
  });

  // Regenerate a single Sora clip
  // Mark a single clip as failed manually
  router.post("/projects/:projectId/sora-clips/:clipNumber/mark-failed", async (req, res) => {
    try {
      const { projectId, clipNumber } = req.params;
      const clipIndex = parseInt(clipNumber) - 1; // Convert to 0-based index

      const project = await storage.getVspProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Support both Sora and Veo clips based on active engine
      const engine = project.videoSettings?.videoEngine;
      const clipsArray = engine === 'veo' ? project.videoSettings?.veoClips : project.videoSettings?.soraClips;

      if (!clipsArray || clipIndex < 0 || clipIndex >= clipsArray.length) {
        return res.status(400).json({ error: "Invalid clip number" });
      }

      const clips = clipsArray;
      const clip = clips[clipIndex];

      console.log(`Manually marking ${engine || 'sora'} clip ${clipNumber} as failed`);

      // Update clip status to failed
      clip.status = 'failed';
      clip.error = 'Manually marked as failed due to download timeout';

      // Check if all clips are now failed — update project status
      const allFailed = clips.every((c: any) => c.status === 'failed');
      if (allFailed) {
        if (engine === 'veo' && project.videoSettings) {
          project.videoSettings.veoStitchingStatus = 'cancelled';
        }
        await storage.updateVspProject(projectId, {
          videoSettings: project.videoSettings,
          status: 'video_failed'
        });
      }

      // Save updated project
      const updatedProject = await storage.updateVspProject(projectId, {
        videoSettings: project.videoSettings
      });

      console.log(`Clip ${clipNumber} marked as failed`);
      res.json(updatedProject);
    } catch (error) {
      console.error("Mark clip failed error:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to mark clip as failed"
      });
    }
  });

  // Regenerate a single clip
  router.post("/projects/:projectId/sora-clips/:clipNumber/regenerate", async (req, res) => {
    try {
      const { projectId, clipNumber } = req.params;
      const clipIndex = parseInt(clipNumber) - 1;

      const project = await storage.getVspProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const engine = project.videoSettings?.videoEngine;
      const clipsArray = engine === 'veo' ? project.videoSettings?.veoClips : null;

      if (!clipsArray || clipIndex < 0 || clipIndex >= clipsArray.length) {
        return res.status(400).json({ error: "Invalid clip number" });
      }

      const clip = clipsArray[clipIndex];

      if ((clip.attempts || 0) >= 3) {
        return res.status(400).json({ error: "Maximum regeneration attempts (3) reached for this clip" });
      }

      console.log(`Regenerating Veo clip ${clipNumber} (attempt ${(clip.attempts || 0) + 1})...`);

      // Find previous clip's video for scene extension
      let extendVideo: { uri: string } | undefined;
      if (clipIndex > 0) {
        const prevClip = clipsArray[clipIndex - 1];
        if (prevClip.status === 'completed' && prevClip.videoFileId) {
          extendVideo = { uri: prevClip.videoFileId };
        }
      }

      // Scene extension requires 720p — don't pass higher resolution when extending
      const regenResolution = extendVideo ? '720p' : project.videoSettings?.veoResolution;

      const result = await generateVeoClip({
        prompt: clip.prompt,
        clipNumber: parseInt(clipNumber),
        aspectRatio: project.videoSettings?.veoAspectRatio as '9:16' | '16:9' | undefined,
        resolution: regenResolution as any,
        durationSeconds: clip.duration,
        extendVideo,
      });

      // Update clip
      clip.operationName = result.operationName;
      clip.status = 'generating';
      clip.error = undefined;
      clip.progress = 0;
      clip.attempts = (clip.attempts || 0) + 1;

      // Reset stitching status if it was completed/failed
      if (project.videoSettings) {
        if (engine === 'veo' && project.videoSettings.veoStitchingStatus !== 'pending') {
          project.videoSettings.veoStitchingStatus = 'pending';
        }
      }

      const updatedProject = await storage.updateVspProject(projectId, {
        videoSettings: project.videoSettings,
        status: 'video_generating'
      });

      console.log(`Veo clip ${clipNumber} regeneration submitted: ${result.operationName}`);
      res.json(updatedProject);
    } catch (error) {
      console.error("Regenerate clip error:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to regenerate clip"
      });
    }
  });

  // Cancel video generation
  router.post("/projects/:projectId/cancel-video", async (req, res) => {
    try {
      const { projectId } = req.params;
      const project = await storage.getVspProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      console.log(`Cancelling video generation for project ${projectId}`);

      // Mark all generating clips as cancelled
      const engine = project.videoSettings?.videoEngine;
      if (engine === 'veo' && project.videoSettings?.veoClips) {
        for (const clip of project.videoSettings.veoClips) {
          if (clip.status === 'generating' || clip.status === 'pending') {
            clip.status = 'failed';
            clip.error = 'Cancelled by user';
          }
        }
        project.videoSettings.veoStitchingStatus = 'cancelled';
      }

      const updatedProject = await storage.updateVspProject(projectId, {
        videoSettings: project.videoSettings,
        status: 'video_failed'
      });

      res.json(updatedProject);
    } catch (error) {
      console.error("Cancel video error:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to cancel video"
      });
    }
  });

  // Reset video — go back to script stage
  router.post("/projects/:projectId/reset-video", async (req, res) => {
    try {
      const { projectId } = req.params;
      const project = await storage.getVspProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      console.log(`Resetting video for project ${projectId}`);

      const updatedProject = await storage.updateVspProject(projectId, {
        videoSettings: null,
        videoUrl: null,
        veoOperationName: null,
        status: project.script ? 'script_ready' : 'draft'
      });

      res.json(updatedProject);
    } catch (error) {
      console.error("Reset video error:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to reset video"
      });
    }
  });

  // Update project
  router.patch("/projects/:id", async (req, res) => {
    try {
      const projectData = req.body;
      const updatedProject = await storage.updateVspProject(req.params.id, projectData);

      if (!updatedProject) {
        return res.status(404).json({ error: "Project not found" });
      }

      res.json(updatedProject);
    } catch (error) {
      console.error("Project update error:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to update project"
      });
    }
  });

  // Check video status
  router.get("/projects/:id/video-status", async (req, res) => {
    try {
      const project = await storage.getVspProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Determine which engine was used based on stored IDs
      const isVeoMultiClip = project.videoSettings?.veoClips && project.videoSettings.veoClips.length > 0;

      if (isVeoMultiClip) {
        // VEO MULTI-CLIP STATUS CHECK
        const { stitchVideoClips } = await import('./services/vsp-video-stitching');

        const clips = project.videoSettings!.veoClips!;
        let allCompleted = true;
        let anyFailed = false;

        for (const clip of clips) {
          const shouldCheck = clip.operationName && (
            clip.status === 'generating' ||
            (clip.status === 'failed' && clip.error?.includes('not ready'))
          );

          if (shouldCheck) {
            if (clip.status === 'failed') {
              clip.status = 'generating';
              delete clip.error;
            }

            const statusResult = await pollVeoOperation(clip.operationName!);

            if (statusResult.done && !statusResult.error) {
              clip.videoFileId = statusResult.videoFileId;
              clip.status = 'completed';
              clip.progress = 100;
              console.log(`Veo clip ${clip.clipNumber} completed`);

              // Upload individual clip to S3 if not already done
              if (!clip.videoUrl && clip.operationName) {
                try {
                  const { buffer: clipBuffer } = await downloadVeoVideo(clip.operationName);
                  const clipS3Url = (await uploadVideoToS3(clipBuffer, `${req.params.id}/veo-clip-${clip.clipNumber}`, 'video/mp4')).url;
                  clip.videoUrl = clipS3Url;
                  console.log(`Veo clip ${clip.clipNumber} uploaded to S3`);
                } catch (uploadErr) {
                  console.warn(`Failed to upload clip ${clip.clipNumber} to S3:`, uploadErr);
                  // Non-fatal — clip is still completed, just not in S3
                }
              }
            } else if (statusResult.error) {
              clip.status = 'failed';
              clip.error = statusResult.error;
              anyFailed = true;
            } else {
              clip.progress = 50;
            }
          }

          if (clip.status !== 'completed') {
            allCompleted = false;
          }
        }

        const allFailed = clips.every(c => c.status === 'failed');
        if (allFailed && project.videoSettings && project.videoSettings.veoStitchingStatus === 'pending') {
          const failedSettings = { ...project.videoSettings, veoStitchingStatus: 'cancelled' as const };
          await storage.updateVspProject(req.params.id, { videoSettings: failedSettings, status: 'video_failed' });
          return res.json({
            ...project, videoSettings: failedSettings, status: 'video_failed',
            clipProgress: { total: clips.length, completed: 0, failed: clips.length }
          });
        }

        if (allCompleted && project.videoSettings && project.videoSettings.veoStitchingStatus === 'pending') {
          console.log('All Veo clips completed. Downloading last clip as final video (Veo extension produces continuous video)...');
          try {
            const lastClip = clips[clips.length - 1];

            if (!lastClip.operationName) {
              throw new Error('Last clip has no operation name');
            }

            const { buffer: videoBuffer } = await downloadVeoVideo(lastClip.operationName);
            const s3Url = (await uploadVideoToS3(videoBuffer, req.params.id, 'veo-final')).url;

            const finalSettings = { ...project.videoSettings, veoStitchingStatus: 'completed' as const };
            const updatedProject = await storage.updateVspProject(req.params.id, {
              videoUrl: s3Url, videoSettings: finalSettings, status: 'completed'
            });

            console.log('Veo multi-clip video completed and uploaded to S3');
            return res.json(updatedProject);
          } catch (error) {
            console.error('Veo video completion failed:', error);
            const failedSettings = { ...project.videoSettings!, veoStitchingStatus: 'failed' as const };
            await storage.updateVspProject(req.params.id, { videoSettings: failedSettings, status: 'video_failed' });
            return res.status(500).json({ error: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}` });
          }
        }

        if (project.videoSettings) {
          await storage.updateVspProject(req.params.id, { videoSettings: project.videoSettings });
        }

        res.json({
          ...project, videoSettings: project.videoSettings,
          clipProgress: {
            total: clips.length,
            completed: clips.filter(c => c.status === 'completed').length,
            failed: clips.filter(c => c.status === 'failed').length
          }
        });
      } else if (project.veoOperationName) {
        // SINGLE-CLIP VEO STATUS CHECK
        const statusResult = await pollVeoOperation(project.veoOperationName);

        if (statusResult.done && !statusResult.error && !project.videoUrl) {
          try {
            console.log('Downloading Veo video:', project.veoOperationName);
            const { buffer: videoBuffer } = await downloadVeoVideo(project.veoOperationName);
            const s3Url = (await uploadVideoToS3(videoBuffer, req.params.id, 'veo-single')).url;
            const updatedProject = await storage.updateVspProject(req.params.id, {
              videoUrl: s3Url,
              status: 'completed'
            });
            return res.json(updatedProject);
          } catch (error) {
            console.error('Failed to download Veo video:', error);
            await storage.updateVspProject(req.params.id, { status: 'video_failed' });
            return res.status(500).json({ error: `Failed to download video: ${error instanceof Error ? error.message : 'Unknown error'}` });
          }
        } else if (statusResult.error) {
          await storage.updateVspProject(req.params.id, { status: 'video_failed' });
          return res.status(500).json({ error: statusResult.error });
        }

        res.json({ ...project, videoStatus: { status: statusResult.done ? 'completed' : 'generating' } });
      }

      // --- fal.ai Kling multi-prompt (single job) polling ---
      const isKlingMultiShot = project.videoSettings?.videoEngine === 'kling' && project.videoSettings?.klingMultiShot;
      if (isKlingMultiShot) {
        const requestId = project.videoSettings.klingRequestId;

        // If no requestId, the submission failed — mark as failed
        if (!requestId) {
          if (project.status === 'video_generating') {
            await storage.updateVspProject(req.params.id, {
              videoSettings: { ...project.videoSettings, klingStatus: 'failed', klingError: 'Job submission failed' },
              status: 'video_failed',
            });
          }
          const updated = await storage.getVspProject(req.params.id);
          return res.json({ status: updated?.status, videoUrl: updated?.videoUrl, videoSettings: updated?.videoSettings });
        }
        const modelId = project.videoSettings.klingModelId;
        const statusUrl = project.videoSettings.klingStatusUrl;
        const responseUrl = project.videoSettings.klingResponseUrl;

        try {
          const status = await pollKlingJob(requestId, modelId, statusUrl, responseUrl);

          if (status.done) {
            if (status.videoUrl) {
              // Multi-prompt returns a single stitched video — download and upload to S3
              const { downloadFalVideo } = await import("./services/vsp-fal");
              const videoBuffer = await downloadFalVideo(status.videoUrl);
              const s3Result = await uploadVideoToS3(videoBuffer, `vsp/${req.params.id}/kling-multishot-final.mp4`);

              await storage.updateVspProject(req.params.id, {
                videoUrl: s3Result.url,
                videoSettings: { ...project.videoSettings, klingStatus: 'completed' },
                status: 'completed',
              });
              console.log(`[Kling] Multi-shot video completed and uploaded to S3`);
            } else if (status.error) {
              await storage.updateVspProject(req.params.id, {
                videoSettings: { ...project.videoSettings, klingStatus: 'failed', klingError: status.error },
                status: 'video_failed',
              });
            }
          }
        } catch (err) {
          console.error('[Kling] Multi-shot polling error:', err);
        }

        const updated = await storage.getVspProject(req.params.id);
        return res.json({
          status: updated?.status,
          videoUrl: updated?.videoUrl,
          videoSettings: updated?.videoSettings,
        });
      }

      // --- fal.ai Kling multi-clip polling (legacy separate clips) ---
      const isKlingMultiClip = project.videoSettings?.videoEngine === 'kling' && project.videoSettings?.klingClips?.length > 0;
      if (isKlingMultiClip) {
        const clips = project.videoSettings.klingClips;
        let allDone = true;
        let anyFailed = false;

        for (const clip of clips) {
          if (clip.status === 'generating' && clip.requestId && clip.modelId) {
            const status = await pollKlingJob(clip.requestId, clip.modelId, clip.statusUrl, clip.responseUrl);
            if (status.done) {
              if (status.videoUrl) {
                // Download and upload to S3
                try {
                  const { downloadFalVideo } = await import("./services/vsp-fal");
                  const videoBuffer = await downloadFalVideo(status.videoUrl);
                  const s3Result = await uploadVideoToS3(videoBuffer, `vsp/${req.params.id}/kling-clip-${clip.clipNumber}.mp4`);
                  clip.videoUrl = s3Result.url;
                  clip.status = 'completed';
                } catch (err) {
                  clip.status = 'failed';
                  clip.error = err instanceof Error ? err.message : 'Download failed';
                }
              } else if (status.error) {
                clip.status = 'failed';
                clip.error = status.error;
              }
            } else {
              allDone = false;
            }
          } else if (clip.status === 'pending' || clip.status === 'generating') {
            allDone = false;
          }
          if (clip.status === 'failed') anyFailed = true;
        }

        // Save updated clip statuses
        await storage.updateVspProject(req.params.id, {
          videoSettings: { ...project.videoSettings, klingClips: clips },
        });

        if (allDone && !anyFailed) {
          // All clips done — stitch them together
          const completedClips = clips.filter((c: any) => c.status === 'completed' && c.videoUrl).sort((a: any, b: any) => a.clipNumber - b.clipNumber);

          if (completedClips.length > 1) {
            try {
              console.log(`[Kling] Stitching ${completedClips.length} clips...`);
              await storage.updateVspProject(req.params.id, {
                videoSettings: { ...project.videoSettings, klingClips: clips, klingStitchingStatus: 'stitching' },
              });

              const { stitchVideoClips } = await import("./services/vsp-video-stitching");
              const videoClips = completedClips.map((c: any) => ({
                clipNumber: c.clipNumber,
                videoData: c.videoUrl, // S3 URL — stitcher will download it
                duration: c.duration,
              }));

              const stitchedDataUrl = await stitchVideoClips(videoClips);
              // Upload stitched video to S3
              const stitchedBuffer = Buffer.from(stitchedDataUrl.split(',')[1], 'base64');
              const s3Result = await uploadVideoToS3(stitchedBuffer, `vsp/${req.params.id}/kling-final-stitched.mp4`);

              await storage.updateVspProject(req.params.id, {
                videoUrl: s3Result.url,
                videoSettings: { ...project.videoSettings, klingClips: clips, klingStitchingStatus: 'completed' },
                status: 'completed',
              });
              console.log(`[Kling] Stitching complete!`);
            } catch (err) {
              console.error(`[Kling] Stitching failed:`, err);
              // Fall back to last clip
              const lastClip = completedClips[completedClips.length - 1];
              await storage.updateVspProject(req.params.id, {
                videoUrl: lastClip.videoUrl,
                videoSettings: { ...project.videoSettings, klingClips: clips, klingStitchingStatus: 'failed' },
                status: 'completed',
              });
            }
          } else if (completedClips.length === 1) {
            await storage.updateVspProject(req.params.id, {
              videoUrl: completedClips[0].videoUrl,
              videoSettings: { ...project.videoSettings, klingClips: clips, klingStitchingStatus: 'completed' },
              status: 'completed',
            });
          }
        }

        const updated = await storage.getVspProject(req.params.id);
        return res.json({
          status: updated?.status,
          videoUrl: updated?.videoUrl,
          videoSettings: updated?.videoSettings,
        });
      }

      // --- fal.ai OmniHuman single-job polling ---
      const isOmniHuman = project.videoSettings?.videoEngine === 'omnihuman' && project.videoSettings?.omniRequestId;
      if (isOmniHuman) {
        const { pollFalJob, getFalResult, downloadFalVideo } = await import("./services/vsp-fal");
        const modelId = project.videoSettings.omniModelId || 'fal-ai/bytedance/omnihuman/v1.5';
        const requestId = project.videoSettings.omniRequestId;

        try {
          const status = await pollFalJob(modelId, requestId);

          if (status.status === 'COMPLETED') {
            const result = await getFalResult(modelId, requestId);
            const videoUrl = result?.video?.url || result?.data?.video?.url || result?.output?.video?.url;

            if (videoUrl) {
              const videoBuffer = await downloadFalVideo(videoUrl);
              const s3Result = await uploadVideoToS3(videoBuffer, `vsp/${req.params.id}/omnihuman-final.mp4`);

              await storage.updateVspProject(req.params.id, {
                videoUrl: s3Result.url,
                videoSettings: { ...project.videoSettings, omniStatus: 'completed' },
                status: 'completed',
              });
            }
          } else if (status.status === 'FAILED') {
            await storage.updateVspProject(req.params.id, {
              videoSettings: { ...project.videoSettings, omniStatus: 'failed', omniError: 'Generation failed' },
              status: 'video_failed',
            });
          }
        } catch (err) {
          console.error('[OmniHuman] Polling error:', err);
        }

        const updated = await storage.getVspProject(req.params.id);
        return res.json({
          status: updated?.status,
          videoUrl: updated?.videoUrl,
          videoSettings: updated?.videoSettings,
        });
      }

      if (project.revidProjectId) {
        // Check Revid video status
        const statusResult = await getVideoStatus(project.revidProjectId);

        if (statusResult.videoUrl) {
          const updatedProject = await storage.updateVspProject(req.params.id, {
            videoUrl: statusResult.videoUrl,
            status: "completed"
          });
          res.json(updatedProject);
        } else {
          res.json({ ...project, videoStatus: statusResult });
        }
      } else {
        return res.status(404).json({ error: "No video generation job ID found" });
      }
    } catch (error) {
      console.error("Video status check error:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to check video status"
      });
    }
  });

  // List available TTS voices for OmniHuman
  router.get("/tts/voices", async (req, res) => {
    try {
      const voices = await listTTSVoices();
      res.json(voices);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to list voices" });
    }
  });

  // Delete project
  router.delete("/projects/:id", async (req, res) => {
    try {
      const success = await storage.deleteVspProject(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  // =================== VIDEO PROXY ROUTE ===================
  router.get("/video-proxy-key", async (req, res) => {
    try {
      const key = req.query.key as string;
      if (!key) {
        return res.status(400).json({ error: "Missing key parameter" });
      }
      const freshUrl = await getSignedVideoUrl(key);
      return res.redirect(freshUrl);
    } catch (error) {
      console.error("Video proxy key error:", error);
      res.status(500).json({ error: "Failed to generate video URL" });
    }
  });

  // Proxy for Gemini/Veo clip videos (requires API key)
  router.get("/veo-clip-proxy", async (req, res) => {
    try {
      const uri = req.query.uri as string;
      if (!uri || !uri.includes('generativelanguage.googleapis.com')) {
        return res.status(400).json({ error: "Invalid Veo video URI" });
      }
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
      }
      const separator = uri.includes('?') ? '&' : '?';
      const downloadUrl = `${uri}${separator}key=${apiKey}`;
      const videoResponse = await fetch(downloadUrl);
      if (!videoResponse.ok) {
        return res.status(videoResponse.status).json({ error: "Failed to fetch video from Gemini" });
      }
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      const buffer = Buffer.from(await videoResponse.arrayBuffer());
      res.send(buffer);
    } catch (error) {
      console.error("Veo clip proxy error:", error);
      res.status(500).json({ error: "Failed to proxy video" });
    }
  });

  router.get("/video-proxy", async (req, res) => {
    try {
      let url = req.query.url as string;
      if (!url) {
        return res.status(400).json({ error: "Missing url parameter" });
      }

      // Handle JSON-encoded videoUrl: {"key":"...","url":"..."}
      if (url.startsWith('{')) {
        try {
          const parsed = JSON.parse(url);
          if (parsed.key) {
            // Use key directly for a fresh presigned URL
            const freshUrl = await getSignedVideoUrl(parsed.key);
            return res.redirect(freshUrl);
          }
          url = parsed.url || url;
        } catch {
          // not JSON, use as-is
        }
      }

      if (!url.includes('.s3.') || !url.includes('amazonaws.com')) {
        return res.status(400).json({ error: "Invalid video URL" });
      }

      // Strip query params from expired presigned URLs before re-signing
      const cleanUrl = url.split('?')[0];
      const presignedUrl = await getPresignedUrl(cleanUrl);
      return res.redirect(presignedUrl);
    } catch (error) {
      console.error("Video proxy error:", error);
      res.status(500).json({ error: "Failed to generate video URL" });
    }
  });

  // =================== POST-BRIDGE PUBLISHING ROUTES ===================

  // Get connected social media accounts from Post-Bridge
  router.get("/postbridge/accounts", async (req, res) => {
    try {
      const accounts = await getSocialAccounts();
      res.json(accounts);
    } catch (error) {
      console.error("Failed to fetch social accounts:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to fetch social accounts"
      });
    }
  });

  // Publish project to Post-Bridge
  router.post("/projects/:id/publish", async (req, res) => {
    try {
      const project = await storage.getVspProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      if (!project.videoUrl) {
        return res.status(400).json({ error: "Project does not have a completed video" });
      }

      // Validate request body with schema
      const validatedData = vspPublishToPostBridgeSchema.parse(req.body);
      const { socialAccountIds, scheduledAt, platformConfigurations } = validatedData;

      // Extract caption text and combine with hashtags
      let captionText = "";
      if (typeof project.caption === 'string') {
        captionText = project.caption;
      } else if (project.caption) {
        // Combine caption text with hashtags
        const text = project.caption.text || "";
        const hashtags = project.caption.hashtags || [];
        const hashtagString = hashtags.length > 0 ? "\n\n" + hashtags.join(" ") : "";
        captionText = text + hashtagString;
      }

      console.log('Publishing caption to TikTok:', captionText);

      const result = await publishToPostBridge({
        caption: captionText,
        videoUrl: project.videoUrl,
        socialAccountIds,
        scheduledAt: scheduledAt || undefined,
        platformConfigurations: platformConfigurations || undefined,
      });

      res.json({
        success: true,
        postId: result.id,
        status: result.status,
        message: result.status === 'scheduled'
          ? 'Post scheduled successfully'
          : 'Post published successfully'
      });
    } catch (error) {
      console.error("Failed to publish to Post-Bridge:", error);

      // Handle validation errors
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: "Invalid request data",
          details: error.errors
        });
      }

      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to publish to Post-Bridge"
      });
    }
  });

  // =================== CALENDAR & CAMPAIGN ROUTES ===================

  // Campaign routes
  router.get("/campaigns", async (req, res) => {
    try {
      const campaigns = await storage.getVspCampaigns();
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  router.get("/campaigns/active", async (req, res) => {
    try {
      const campaigns = await storage.getVspActiveCampaigns();
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active campaigns" });
    }
  });

  router.post("/campaigns", async (req, res) => {
    try {
      const validatedData = insertVspCampaignSchema.parse(req.body);
      const campaign = await storage.createVspCampaign(validatedData);
      res.status(201).json(campaign);
    } catch (error) {
      res.status(400).json({ error: "Invalid campaign data" });
    }
  });

  router.put("/campaigns/:id", async (req, res) => {
    try {
      const validatedData = req.body;
      const campaign = await storage.updateVspCampaign(req.params.id, validatedData);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      res.status(400).json({ error: "Invalid campaign data" });
    }
  });

  router.delete("/campaigns/:id", async (req, res) => {
    try {
      const success = await storage.deleteVspCampaign(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete campaign" });
    }
  });

  // Content Calendar routes
  router.get("/calendar", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      if (startDate && endDate) {
        const events = await storage.getVspContentCalendarEventsByDateRange(
          startDate as string,
          endDate as string
        );
        const projects = await storage.getVspProjectsByDateRange(
          startDate as string,
          endDate as string
        );
        res.json({ events, projects });
      } else {
        const events = await storage.getVspContentCalendarEvents();
        const projects = await storage.getVspProjects();
        res.json({ events, projects });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch calendar data" });
    }
  });

  router.post("/calendar", async (req, res) => {
    try {
      const validatedData = insertVspContentCalendarSchema.parse(req.body);
      const event = await storage.createVspContentCalendar(validatedData);
      res.status(201).json(event);
    } catch (error) {
      res.status(400).json({ error: "Invalid calendar event data" });
    }
  });

  router.put("/calendar/:id", async (req, res) => {
    try {
      const validatedData = insertVspContentCalendarSchema.partial().parse(req.body);
      const event = await storage.updateVspContentCalendar(req.params.id, validatedData);
      if (!event) {
        return res.status(404).json({ error: "Calendar event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(400).json({ error: "Invalid calendar event data" });
    }
  });

  router.delete("/calendar/:id", async (req, res) => {
    try {
      const success = await storage.deleteVspContentCalendar(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Calendar event not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete calendar event" });
    }
  });

  // Content Template routes
  router.get("/templates", async (req, res) => {
    try {
      const { category } = req.query;
      const templates = category
        ? await storage.getVspContentTemplatesByCategory(category as string)
        : await storage.getVspContentTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  router.post("/templates", async (req, res) => {
    try {
      const validatedData = insertVspContentTemplateSchema.parse(req.body);
      const template = await storage.createVspContentTemplate(validatedData);
      res.status(201).json(template);
    } catch (error) {
      res.status(400).json({ error: "Invalid template data" });
    }
  });

  router.put("/templates/:id", async (req, res) => {
    try {
      const validatedData = req.body;
      const template = await storage.updateVspContentTemplate(req.params.id, validatedData);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      res.status(400).json({ error: "Invalid template data" });
    }
  });

  router.delete("/templates/:id", async (req, res) => {
    try {
      const success = await storage.deleteVspContentTemplate(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete template" });
    }
  });

  // Bulk operations for content planning
  router.post("/calendar/bulk-schedule", async (req, res) => {
    try {
      const { events } = req.body;
      const createdEvents = [];

      for (const eventData of events) {
        const validatedData = insertVspContentCalendarSchema.parse(eventData);
        const event = await storage.createVspContentCalendar(validatedData);
        createdEvents.push(event);
      }

      res.status(201).json(createdEvents);
    } catch (error) {
      res.status(400).json({ error: "Failed to bulk schedule events" });
    }
  });

  // Assign project to campaign
  router.put("/projects/:id/campaign", async (req, res) => {
    try {
      const { campaignId } = req.body;
      const project = await storage.updateVspProject(req.params.id, { campaignId });
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(400).json({ error: "Failed to assign campaign" });
    }
  });

  // Schedule project to date
  router.put("/projects/:id/schedule", async (req, res) => {
    try {
      const { scheduledDate } = req.body;
      const existingProject = await storage.getVspProject(req.params.id);
      const project = await storage.updateVspProject(req.params.id, {
        scheduledDate,
        status: scheduledDate ? "scheduled" : existingProject?.status
      });
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(400).json({ error: "Failed to schedule project" });
    }
  });

  // =================== CAMPAIGN TEMPLATES & BULK GENERATION ===================

  // Campaign Templates routes
  router.get("/campaign-templates", async (req, res) => {
    try {
      const templates = await storage.getVspCampaignTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching campaign templates:", error);
      res.status(500).json({ error: "Failed to fetch campaign templates" });
    }
  });

  router.get("/campaign-templates/:id", async (req, res) => {
    try {
      const template = await storage.getVspCampaignTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Campaign template not found" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch campaign template" });
    }
  });

  // Bulk Generation routes (supports both template and custom campaigns)
  router.post("/campaigns/:id/generate-from-template", async (req, res) => {
    try {
      const { templateId, startDate, options, customTemplate } = req.body;
      const campaignId = req.params.id;

      const generator = new BulkContentGenerator();

      // If it's a custom template, use the provided customTemplate data
      if (templateId === 'custom' && customTemplate) {
        const results = await generator.generateCustomCampaign(
          campaignId,
          customTemplate,
          startDate,
          {
            generateScripts: options?.generateScripts ?? true,
            generateCaptions: options?.generateCaptions ?? true,
            scriptStyle: options?.scriptStyle || 'emotional-hook',
            scriptLength: options?.scriptLength || '30s'
          }
        );

        return res.json({
          success: true,
          message: `Generated ${results.length} content pieces`,
          projects: results
        });
      }

      // Otherwise use the existing template-based generation
      const results = await generator.generateCompleteCampaign(
        templateId,
        campaignId,
        startDate,
        {
          generateScripts: options?.generateScripts ?? true,
          generateCaptions: options?.generateCaptions ?? true,
          scriptStyle: options?.scriptStyle || 'emotional-hook',
          scriptLength: options?.scriptLength || '30s'
        }
      );

      res.json({
        success: true,
        message: `Generated ${results.length} content pieces`,
        projects: results
      });
    } catch (error) {
      console.error("Bulk generation error:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to generate campaign content"
      });
    }
  });

  router.post("/campaigns/:id/bulk-generate-scripts", async (req, res) => {
    try {
      const { style, length } = req.body;
      const campaignId = req.params.id;

      const generator = new BulkContentGenerator();
      const results = await generator.bulkGenerateScripts(campaignId, { style, length });

      res.json({
        success: true,
        message: `Generated scripts for ${results.length} projects`,
        projects: results
      });
    } catch (error) {
      console.error("Bulk script generation error:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to generate scripts"
      });
    }
  });

  router.post("/campaigns/:id/bulk-generate-captions", async (req, res) => {
    try {
      const campaignId = req.params.id;

      const generator = new BulkContentGenerator();
      const results = await generator.bulkGenerateCaptions(campaignId);

      res.json({
        success: true,
        message: `Generated captions for ${results.length} projects`,
        projects: results
      });
    } catch (error) {
      console.error("Bulk caption generation error:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to generate captions"
      });
    }
  });

  // Create campaign from template
  router.post("/campaigns/from-template", async (req, res) => {
    try {
      const { templateId, campaignName, startDate, customizations } = req.body;

      const template = await storage.getVspCampaignTemplate(templateId);
      if (!template) {
        return res.status(404).json({ error: "Campaign template not found" });
      }

      // Create campaign
      const campaign = await storage.createVspCampaign({
        name: campaignName || template.name,
        description: template.description || '',
        startDate,
        endDate: new Date(new Date(startDate).getTime() + template.duration * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        goals: template.goals || null,
        color: customizations?.color || '#3b82f6',
        status: 'planning'
      });

      // Generate content from template
      const generator = new BulkContentGenerator();
      const projects = await generator.generateFromTemplate(templateId, campaign.id, startDate);

      res.json({
        campaign,
        projects,
        message: `Created campaign with ${projects.length} scheduled content pieces`
      });

    } catch (error) {
      console.error("Campaign creation error:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to create campaign from template"
      });
    }
  });

  // =================== DYNAMIC CONTENT MANAGEMENT ===================

  // Content Categories
  router.get("/admin/content-categories", async (req, res) => {
    try {
      const categories = await storage.getVspContentCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching content categories:", error);
      res.status(500).json({ error: "Failed to fetch content categories" });
    }
  });

  router.get("/admin/content-categories/:id", async (req, res) => {
    try {
      const category = await storage.getVspContentCategory(req.params.id);
      if (!category) {
        return res.status(404).json({ error: "Content category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch content category" });
    }
  });

  router.post("/admin/content-categories", async (req, res) => {
    try {
      const validatedData = insertVspContentCategorySchema.parse(req.body);
      const category = await storage.createVspContentCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating content category:", error);
      res.status(400).json({ error: "Failed to create content category" });
    }
  });

  router.put("/admin/content-categories/:id", async (req, res) => {
    try {
      const category = await storage.updateVspContentCategory(req.params.id, req.body);
      if (!category) {
        return res.status(404).json({ error: "Content category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(400).json({ error: "Failed to update content category" });
    }
  });

  router.delete("/admin/content-categories/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteVspContentCategory(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Content category not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: "Failed to delete content category" });
    }
  });

  // Content Subtopics
  router.get("/admin/content-subtopics", async (req, res) => {
    try {
      const categoryId = req.query.categoryId as string;
      const subtopics = await storage.getVspContentSubtopics(categoryId);
      res.json(subtopics);
    } catch (error) {
      console.error("Error fetching content subtopics:", error);
      res.status(500).json({ error: "Failed to fetch content subtopics" });
    }
  });

  router.get("/admin/content-subtopics/:id", async (req, res) => {
    try {
      const subtopic = await storage.getVspContentSubtopic(req.params.id);
      if (!subtopic) {
        return res.status(404).json({ error: "Content subtopic not found" });
      }
      res.json(subtopic);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch content subtopic" });
    }
  });

  router.post("/admin/content-subtopics", async (req, res) => {
    try {
      const validatedData = insertVspContentSubtopicSchema.parse(req.body);
      const subtopic = await storage.createVspContentSubtopic(validatedData);
      res.status(201).json(subtopic);
    } catch (error) {
      console.error("Error creating content subtopic:", error);
      res.status(400).json({ error: "Failed to create content subtopic" });
    }
  });

  router.put("/admin/content-subtopics/:id", async (req, res) => {
    try {
      const subtopic = await storage.updateVspContentSubtopic(req.params.id, req.body);
      if (!subtopic) {
        return res.status(404).json({ error: "Content subtopic not found" });
      }
      res.json(subtopic);
    } catch (error) {
      res.status(400).json({ error: "Failed to update content subtopic" });
    }
  });

  router.delete("/admin/content-subtopics/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteVspContentSubtopic(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Content subtopic not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: "Failed to delete content subtopic" });
    }
  });

  // Script Styles
  router.get("/admin/script-styles", async (req, res) => {
    try {
      const styles = await storage.getVspScriptStyles();
      res.json(styles);
    } catch (error) {
      console.error("Error fetching script styles:", error);
      res.status(500).json({ error: "Failed to fetch script styles" });
    }
  });

  router.get("/admin/script-styles/:id", async (req, res) => {
    try {
      const style = await storage.getVspScriptStyle(req.params.id);
      if (!style) {
        return res.status(404).json({ error: "Script style not found" });
      }
      res.json(style);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch script style" });
    }
  });

  router.post("/admin/script-styles", async (req, res) => {
    try {
      const validatedData = insertVspScriptStyleSchema.parse(req.body);
      const style = await storage.createVspScriptStyle(validatedData);
      res.status(201).json(style);
    } catch (error) {
      console.error("Error creating script style:", error);
      res.status(400).json({ error: "Failed to create script style" });
    }
  });

  router.put("/admin/script-styles/:id", async (req, res) => {
    try {
      const style = await storage.updateVspScriptStyle(req.params.id, req.body);
      if (!style) {
        return res.status(404).json({ error: "Script style not found" });
      }
      res.json(style);
    } catch (error) {
      res.status(400).json({ error: "Failed to update script style" });
    }
  });

  router.delete("/admin/script-styles/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteVspScriptStyle(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Script style not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: "Failed to delete script style" });
    }
  });

  // Caption Styles
  router.get("/admin/caption-styles", async (req, res) => {
    try {
      const styles = await storage.getVspCaptionStyles();
      res.json(styles);
    } catch (error) {
      console.error("Error fetching caption styles:", error);
      res.status(500).json({ error: "Failed to fetch caption styles" });
    }
  });

  router.get("/admin/caption-styles/:id", async (req, res) => {
    try {
      const style = await storage.getVspCaptionStyle(req.params.id);
      if (!style) {
        return res.status(404).json({ error: "Caption style not found" });
      }
      res.json(style);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch caption style" });
    }
  });

  router.post("/admin/caption-styles", async (req, res) => {
    try {
      const validatedData = insertVspCaptionStyleSchema.parse(req.body);
      const style = await storage.createVspCaptionStyle(validatedData);
      res.status(201).json(style);
    } catch (error) {
      console.error("Error creating caption style:", error);
      res.status(400).json({ error: "Failed to create caption style" });
    }
  });

  router.put("/admin/caption-styles/:id", async (req, res) => {
    try {
      const style = await storage.updateVspCaptionStyle(req.params.id, req.body);
      if (!style) {
        return res.status(404).json({ error: "Caption style not found" });
      }
      res.json(style);
    } catch (error) {
      res.status(400).json({ error: "Failed to update caption style" });
    }
  });

  router.delete("/admin/caption-styles/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteVspCaptionStyle(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Caption style not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: "Failed to delete caption style" });
    }
  });

  // Migration endpoint to populate database with existing static data
  router.post("/admin/migrate-static-data", async (req, res) => {
    try {
      // Categories from topics.ts
      const categoriesData = [
        { id: "love-relationships", name: "Love & Relationships", icon: "fas fa-heart", color: "text-red-500" },
        { id: "career-finance", name: "Career & Finance", icon: "fas fa-chart-line", color: "text-green-500" },
        { id: "health-wellness", name: "Health & Wellness", icon: "fas fa-leaf", color: "text-emerald-500" },
        { id: "mental-health", name: "Anxiety & Mental Health", icon: "fas fa-brain", color: "text-purple-500" },
        { id: "family-parenting", name: "Family & Parenting", icon: "fas fa-users", color: "text-blue-500" },
        { id: "life-transitions", name: "Life Transitions & Major Change", icon: "fas fa-route", color: "text-orange-500" },
        { id: "loss-grieving", name: "Loss & Grieving", icon: "fas fa-dove", color: "text-gray-500" },
        { id: "meaning-destiny", name: "Life, Destiny & Meaning", icon: "fas fa-compass", color: "text-indigo-500" }
      ];

      // Subtopics data mapped to categories
      const subtopicsData = [
        // Love & Relationships
        { id: "breakup-heartbreak", name: "Breakup & Heartbreak", categoryId: "love-relationships" },
        { id: "toxic-relationships", name: "Toxic Relationships", categoryId: "love-relationships" },
        { id: "dating-loneliness", name: "Dating & Loneliness", categoryId: "love-relationships" },
        { id: "twin-flame", name: "Twin Flame & Soulmate Confusion", categoryId: "love-relationships" },
        { id: "cheating-betrayal", name: "Cheating & Betrayal", categoryId: "love-relationships" },
        { id: "divorce-separation", name: "Divorce & Separation", categoryId: "love-relationships" },
        { id: "communication-conflict", name: "Communication & Conflict", categoryId: "love-relationships" },
        { id: "commitment-stages", name: "Commitment & Relationship Stages", categoryId: "love-relationships" },
        { id: "sexual-intimacy", name: "Sexual Intimacy & Physical Connection", categoryId: "love-relationships" },
        { id: "family-pressures", name: "Family & External Pressures", categoryId: "love-relationships" },
        { id: "love-manifestation", name: "Love Manifestation & Attraction", categoryId: "love-relationships" },
        { id: "astrology-cosmic", name: "Astrology & Cosmic Influences", categoryId: "love-relationships" },
        { id: "spiritual-tools", name: "Spiritual Tools & Guidance", categoryId: "love-relationships" },
        { id: "healing-growth", name: "Healing & Growth", categoryId: "love-relationships" },
        // Career & Finance
        { id: "career-change", name: "Career Change & Transitions", categoryId: "career-finance" },
        { id: "financial-stress", name: "Financial Stress & Money Anxiety", categoryId: "career-finance" },
        { id: "entrepreneurship", name: "Entrepreneurship & Business", categoryId: "career-finance" },
        { id: "workplace-toxic", name: "Workplace Toxicity", categoryId: "career-finance" },
        { id: "money-manifestation", name: "Money Manifestation", categoryId: "career-finance" },
        { id: "budgeting-saving", name: "Budgeting & Saving", categoryId: "career-finance" },
        { id: "passive-income", name: "Passive Income Strategies", categoryId: "career-finance" },
        { id: "job-searching", name: "Job Searching & Interviews", categoryId: "career-finance" },
        // Health & Wellness
        { id: "chronic-illness", name: "Chronic Illness & Pain", categoryId: "health-wellness" },
        { id: "weight-body-image", name: "Weight & Body Image", categoryId: "health-wellness" },
        { id: "fitness-motivation", name: "Fitness & Motivation", categoryId: "health-wellness" },
        { id: "nutrition-diet", name: "Nutrition & Diet", categoryId: "health-wellness" },
        { id: "sleep-issues", name: "Sleep Issues", categoryId: "health-wellness" },
        { id: "energy-fatigue", name: "Energy & Chronic Fatigue", categoryId: "health-wellness" },
        { id: "holistic-healing", name: "Holistic Healing", categoryId: "health-wellness" },
        { id: "addiction-recovery", name: "Addiction & Recovery", categoryId: "health-wellness" },
        // Mental Health
        { id: "anxiety-panic", name: "Anxiety & Panic Attacks", categoryId: "mental-health" },
        { id: "depression-sadness", name: "Depression & Sadness", categoryId: "mental-health" },
        { id: "trauma-ptsd", name: "Trauma & PTSD", categoryId: "mental-health" },
        { id: "self-esteem", name: "Self-Esteem & Confidence", categoryId: "mental-health" },
        { id: "overthinking", name: "Overthinking & Racing Thoughts", categoryId: "mental-health" },
        { id: "social-anxiety", name: "Social Anxiety", categoryId: "mental-health" },
        { id: "therapy-healing", name: "Therapy & Professional Help", categoryId: "mental-health" },
        { id: "medication-mental-health", name: "Medication & Mental Health", categoryId: "mental-health" },
        // Family & Parenting
        { id: "difficult-children", name: "Difficult Children & Behavior", categoryId: "family-parenting" },
        { id: "family-drama", name: "Family Drama & Toxic Relatives", categoryId: "family-parenting" },
        { id: "parenting-stress", name: "Parenting Stress & Guilt", categoryId: "family-parenting" },
        { id: "single-parenting", name: "Single Parenting", categoryId: "family-parenting" },
        { id: "blended-families", name: "Blended Families", categoryId: "family-parenting" },
        { id: "teen-struggles", name: "Teen Struggles & Communication", categoryId: "family-parenting" },
        { id: "elderly-parents", name: "Caring for Elderly Parents", categoryId: "family-parenting" },
        { id: "infertility-pregnancy", name: "Infertility & Pregnancy Loss", categoryId: "family-parenting" },
        // Life Transitions
        { id: "midlife-crisis", name: "Midlife Crisis & Identity", categoryId: "life-transitions" },
        { id: "moving-relocation", name: "Moving & Relocation", categoryId: "life-transitions" },
        { id: "retirement", name: "Retirement & Aging", categoryId: "life-transitions" },
        { id: "major-decisions", name: "Major Life Decisions", categoryId: "life-transitions" },
        { id: "starting-over", name: "Starting Over", categoryId: "life-transitions" },
        { id: "empty-nest", name: "Empty Nest Syndrome", categoryId: "life-transitions" },
        { id: "life-purpose", name: "Finding Life Purpose", categoryId: "life-transitions" },
        { id: "change-resistance", name: "Resistance to Change", categoryId: "life-transitions" },
        // Loss & Grieving
        { id: "death-loved-one", name: "Death of Loved One", categoryId: "loss-grieving" },
        { id: "pet-loss", name: "Pet Loss", categoryId: "loss-grieving" },
        { id: "job-loss", name: "Job Loss", categoryId: "loss-grieving" },
        { id: "friendship-loss", name: "Loss of Friendship", categoryId: "loss-grieving" },
        { id: "miscarriage", name: "Miscarriage & Pregnancy Loss", categoryId: "loss-grieving" },
        { id: "home-loss", name: "Loss of Home", categoryId: "loss-grieving" },
        { id: "identity-loss", name: "Loss of Identity", categoryId: "loss-grieving" },
        { id: "grief-stages", name: "Grief Stages & Healing", categoryId: "loss-grieving" },
        // Life, Destiny & Meaning
        { id: "life-purpose-meaning", name: "Finding Life Purpose", categoryId: "meaning-destiny" },
        { id: "spiritual-awakening", name: "Spiritual Awakening", categoryId: "meaning-destiny" },
        { id: "manifestation", name: "Manifestation & Law of Attraction", categoryId: "meaning-destiny" },
        { id: "soul-purpose", name: "Soul Purpose & Mission", categoryId: "meaning-destiny" },
        { id: "synchronicities", name: "Synchronicities & Signs", categoryId: "meaning-destiny" },
        { id: "meditation-mindfulness", name: "Meditation & Mindfulness", categoryId: "meaning-destiny" },
        { id: "energy-healing", name: "Energy Healing", categoryId: "meaning-destiny" },
        { id: "psychic-abilities", name: "Psychic Abilities & Intuition", categoryId: "meaning-destiny" }
      ];

      // Script styles with AI prompts
      const scriptStylesData = [
        {
          id: "emotional-hook",
          name: "Emotional Hook",
          key: "emotional-hook",
          description: "Creates strong emotional connection with the audience",
          promptTemplate: `Generate a viral TikTok/Reel script about "{subtopic}" in the "{category}" category.

Style: Emotional Hook - Focus on creating a strong emotional connection with the audience
Duration: {duration} seconds
Format: Vertical video

Requirements:
- Start with a powerful emotional hook (first 3 seconds)
- Include personal, relatable stories
- Use emotional language and vulnerability
- End with a strong call-to-action
- Optimize for virality and engagement
- Keep language conversational and authentic
- Include emotional triggers and empathy

Respond with JSON in this exact format:
{
  "content": "full script text",
  "sections": [
    {
      "type": "hook",
      "content": "hook text",
      "timing": "0-3s"
    },
    {
      "type": "main",
      "content": "main content text",
      "timing": "3-{duration-5}s"
    },
    {
      "type": "cta",
      "content": "call to action text",
      "timing": "{duration-5}-{duration}s"
    }
  ],
  "stats": {
    "wordCount": number,
    "duration": {duration},
    "viralScore": number
  }
}`,
          sortOrder: 1
        },
        {
          id: "question-hook",
          name: "Question Hook",
          key: "question-hook",
          description: "Starts with an intriguing question to capture attention",
          promptTemplate: `Generate a viral TikTok/Reel script about "{subtopic}" in the "{category}" category.

Style: Question Hook - Start with an intriguing question that makes viewers want to stay for the answer
Duration: {duration} seconds
Format: Vertical video

Requirements:
- Start with a compelling question hook (first 3 seconds)
- Build suspense and curiosity
- Provide clear, valuable answers
- End with a strong call-to-action
- Optimize for virality and engagement
- Keep language conversational and relatable
- Use curiosity gaps effectively

Respond with JSON in this exact format:
{
  "content": "full script text",
  "sections": [
    {
      "type": "hook",
      "content": "hook text",
      "timing": "0-3s"
    },
    {
      "type": "main",
      "content": "main content text",
      "timing": "3-{duration-5}s"
    },
    {
      "type": "cta",
      "content": "call to action text",
      "timing": "{duration-5}-{duration}s"
    }
  ],
  "stats": {
    "wordCount": number,
    "duration": {duration},
    "viralScore": number
  }
}`,
          sortOrder: 2
        },
        {
          id: "story-driven",
          name: "Story-Driven",
          key: "story-driven",
          description: "Uses narrative storytelling to engage viewers",
          promptTemplate: `Generate a viral TikTok/Reel script about "{subtopic}" in the "{category}" category.

Style: Story-Driven - Use compelling narrative storytelling to engage viewers
Duration: {duration} seconds
Format: Vertical video

Requirements:
- Create a compelling story hook (first 3 seconds)
- Use narrative structure with beginning, middle, end
- Include personal anecdotes or case studies
- End with a strong call-to-action
- Optimize for virality and engagement
- Keep language conversational and relatable
- Include plot twists or revelations

Respond with JSON in this exact format:
{
  "content": "full script text",
  "sections": [
    {
      "type": "hook",
      "content": "hook text",
      "timing": "0-3s"
    },
    {
      "type": "main",
      "content": "main content text",
      "timing": "3-{duration-5}s"
    },
    {
      "type": "cta",
      "content": "call to action text",
      "timing": "{duration-5}-{duration}s"
    }
  ],
  "stats": {
    "wordCount": number,
    "duration": {duration},
    "viralScore": number
  }
}`,
          sortOrder: 3
        }
      ];

      // Caption styles with AI prompts
      const captionStylesData = [
        {
          id: "conversational",
          name: "Conversational",
          key: "conversational",
          description: "Friendly, approachable tone like talking to a friend",
          promptTemplate: `Create an engaging social media caption for a {category} video about "{subtopic}".

Script content: "{script}"
Tone: Conversational - Friendly and approachable, like talking to a friend
Hashtag count: {hashtagCount}

Requirements:
- Write in conversational, friendly tone
- Include a compelling hook
- Add relevant emojis sparingly
- Create {hashtagCount} highly relevant hashtags
- Include a call-to-action
- Optimize for engagement (comments, shares, saves)
- Keep authentic and relatable
- Use casual language and personal touches

Respond with JSON in this exact format:
{
  "text": "caption text with emojis",
  "hashtags": ["hashtag1", "hashtag2", ...],
  "engagementScore": number
}`,
          sortOrder: 1
        },
        {
          id: "motivational",
          name: "Motivational",
          key: "motivational",
          description: "Inspiring and uplifting tone to motivate viewers",
          promptTemplate: `Create an engaging social media caption for a {category} video about "{subtopic}".

Script content: "{script}"
Tone: Motivational - Inspiring and uplifting to motivate viewers
Hashtag count: {hashtagCount}

Requirements:
- Write in motivational, inspiring tone
- Include a compelling hook
- Add relevant emojis sparingly
- Create {hashtagCount} highly relevant hashtags
- Include a call-to-action
- Optimize for engagement (comments, shares, saves)
- Keep authentic and relatable
- Use empowering language and positive reinforcement

Respond with JSON in this exact format:
{
  "text": "caption text with emojis",
  "hashtags": ["hashtag1", "hashtag2", ...],
  "engagementScore": number
}`,
          sortOrder: 2
        },
        {
          id: "educational",
          name: "Educational",
          key: "educational",
          description: "Informative tone focused on teaching and sharing knowledge",
          promptTemplate: `Create an engaging social media caption for a {category} video about "{subtopic}".

Script content: "{script}"
Tone: Educational - Informative and focused on teaching and sharing knowledge
Hashtag count: {hashtagCount}

Requirements:
- Write in educational, informative tone
- Include a compelling hook
- Add relevant emojis sparingly
- Create {hashtagCount} highly relevant hashtags
- Include a call-to-action
- Optimize for engagement (comments, shares, saves)
- Keep authentic and relatable
- Use clear explanations and valuable insights

Respond with JSON in this exact format:
{
  "text": "caption text with emojis",
  "hashtags": ["hashtag1", "hashtag2", ...],
  "engagementScore": number
}`,
          sortOrder: 3
        }
      ];

      // Insert categories
      for (const category of categoriesData) {
        await storage.createVspContentCategory(category);
      }

      // Insert subtopics
      for (const subtopic of subtopicsData) {
        await storage.createVspContentSubtopic(subtopic);
      }

      // Insert script styles
      for (const style of scriptStylesData) {
        await storage.createVspScriptStyle(style);
      }

      // Insert caption styles
      for (const style of captionStylesData) {
        await storage.createVspCaptionStyle(style);
      }

      res.json({
        success: true,
        migrated: {
          categories: categoriesData.length,
          subtopics: subtopicsData.length,
          scriptStyles: scriptStylesData.length,
          captionStyles: captionStylesData.length
        }
      });
    } catch (error) {
      console.error("Migration error:", error);
      res.status(500).json({ error: "Migration failed", details: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Mount all routes under /api/vsp
  app.use("/api/vsp", router);
}
