import React, { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Wand2, Hash, Video, Loader2, Upload, X, PenLine, HelpCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { VspContentProject as ContentProject, VspScriptStyle as ScriptStyle, VspCaptionStyle as CaptionStyle } from "@shared/schema";

interface WorkflowCardsProps {
  selectedCategory: string | null;
  selectedSubtopic: string | null;
  currentProject: ContentProject | null;
  onProjectUpdate: (project: ContentProject) => void;
}

export function WorkflowCards({
  selectedCategory,
  selectedSubtopic,
  currentProject,
  onProjectUpdate,
}: WorkflowCardsProps) {
  const [scriptSettings, setScriptSettings] = useState({
    style: "",
    length: "30s",
  });
  
  const [scriptMode, setScriptMode] = useState<"ai" | "custom">("ai");
  const [customScript, setCustomScript] = useState("");
  
  const [captionSettings, setCaptionSettings] = useState({
    tone: "",
    hashtagCount: 10,
  });
  
  const [videoSettings, setVideoSettings] = useState({
    videoEngine: "revid" as "revid" | "veo" | "kling" | "omnihuman",
    
    // Revid.ai settings
    style: "stockVideo", // Media type ID (updated to match API)
    voice: "cgSgspJ2msm6clMCkdW9", // Voice ID (Jessica - preselected by default)
    generationPreset: "DEFAULT", // Generation preset
    qualityTier: "base", // Quality tier (base/pro/ultra)
    captionStyle: "Basic", // Caption style preset (updated to match API)
    audio: "Observer", // Background audio selection (verified working)
    resolution: "1080p" as "720p" | "1080p", // Video resolution
    compression: 18 as 9 | 18 | 33, // Compression level
    frameRate: 30 as 30 | 60, // Frame rate
    hasToGenerateCover: false, // Generate cover image for video
    ratio: "9 / 16" as "9 / 16" | "16 / 9" | "1 / 1", // Aspect ratio (default to vertical/TikTok)
    disableCaptions: false, // Captions enabled by default
    captionPositionName: "bottom" as "bottom" | "middle" | "top", // Caption position (default to bottom)
    hasToGenerateVoice: true, // Generate voice from text by default
    musicMode: "library" as "library" | "generate" | "none", // Music selection mode
    hasToGenerateMusic: false, // Generate music from AI
    generationMusicPrompt: "", // Optional prompt for AI music generation
    
    // Veo 3.1 settings
    veoAspectRatio: "9:16" as "9:16" | "16:9",
    veoResolution: "1080p" as "720p" | "1080p" | "4k",
    veoDuration: "auto" as "auto" | "4" | "6" | "8",
    veoCustomInstructions: "",
    veoReferenceImages: [] as string[],
    veoFirstFrameImage: undefined as string | undefined,
    veoLastFrameImage: undefined as string | undefined,
    veoPersonGeneration: "allow_adult" as "dont_allow" | "allow_adult" | "allow_all", // allow_adult is default behavior (not sent to API)
    veoNumberOfVideos: 1 as number,
    
    // Character Consistency Settings
    characterProfile: undefined as { description: string; wardrobe: string; distinctiveFeatures?: string } | undefined,
    colorPalette: [] as string[],
    cinematography: undefined as { cameraStyle?: string; lightingStyle?: string } | undefined,
    // Kling v3 settings
    klingAspectRatio: "9:16" as "16:9" | "9:16" | "1:1",
    klingDuration: "10" as string,
    klingTier: "pro" as "pro" | "standard",
    klingReferenceImage: undefined as string | undefined,
    klingCustomInstructions: "",
    klingElementBinding: true,
    klingUseMultiPrompt: true,
    // OmniHuman 1.5 settings
    omniReferenceImage: undefined as string | undefined,
    omniAudioUrl: "",
    omniResolution: "1080p" as "720p" | "1080p",
    omniVoiceId: "",
  });
  const [estimatedCredits, setEstimatedCredits] = useState<number | null>(null);
  const [calculatingCredits, setCalculatingCredits] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch available voices and media types
  const { data: availableVoices = [] } = useQuery<any[]>({
    queryKey: ["/api/vsp/voices"],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const { data: availableMediaTypes = [] } = useQuery<any[]>({
    queryKey: ["/api/vsp/media-types"], 
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch all new video generation options
  const { data: availableGenerationPresets = [] } = useQuery<any[]>({
    queryKey: ["/api/vsp/generation-presets"],
    staleTime: 5 * 60 * 1000,
  });

  const { data: availableQualityTiers = [] } = useQuery<any[]>({
    queryKey: ["/api/vsp/quality-tiers"],
    staleTime: 5 * 60 * 1000,
  });

  const { data: availableCaptionStyles = [] } = useQuery<any[]>({
    queryKey: ["/api/vsp/caption-styles"],
    staleTime: 5 * 60 * 1000,
  });

  const { data: availableAudioOptions = [] } = useQuery<any[]>({
    queryKey: ["/api/vsp/audio-options"],
    staleTime: 5 * 60 * 1000,
  });

  const { data: availableAspectRatios = [] } = useQuery<any[]>({
    queryKey: ["/api/vsp/aspect-ratios"],
    staleTime: 5 * 60 * 1000,
  });

  const { data: availableCaptionPositions = [] } = useQuery<any[]>({
    queryKey: ["/api/vsp/caption-positions"],
    staleTime: 5 * 60 * 1000,
  });

  // Fetch script and caption styles from API
  const { data: scriptStyles = [] } = useQuery<ScriptStyle[]>({
    queryKey: ["/api/vsp/admin/script-styles"],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const { data: captionStyles = [] } = useQuery<CaptionStyle[]>({
    queryKey: ["/api/vsp/admin/caption-styles"],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Set default styles when data loads
  React.useEffect(() => {
    if (scriptStyles.length > 0 && !scriptSettings.style) {
      const activeStyles = scriptStyles.filter(s => s.isActive).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      setScriptSettings(prev => ({ 
        ...prev, 
        style: activeStyles[0]?.id || scriptStyles[0]?.id || ''
      }));
    }
  }, [scriptStyles, scriptSettings.style]);

  React.useEffect(() => {
    if (captionStyles.length > 0 && !captionSettings.tone) {
      const activeStyles = captionStyles.filter(s => s.isActive).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      setCaptionSettings(prev => ({ 
        ...prev, 
        tone: activeStyles[0]?.id || captionStyles[0]?.id || ''
      }));
    }
  }, [captionStyles, captionSettings.tone]);

  const generateScriptMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCategory || !selectedSubtopic) {
        throw new Error("Please select a topic first");
      }
      
      const response = await apiRequest("POST", "/api/vsp/generate/script", {
        category: selectedCategory,
        subtopic: selectedSubtopic,
        style: scriptSettings.style,
        length: scriptSettings.length,
      });
      
      return await response.json();
    },
    onSuccess: (project: ContentProject) => {
      // Update the query cache directly for this specific project
      queryClient.setQueryData(["/api/vsp/projects", project.id], project);
      
      // Also update the projects list
      queryClient.setQueryData(["/api/vsp/projects"], (old: ContentProject[] | undefined) => {
        if (!old) return [project];
        const exists = old.some(p => p.id === project.id);
        if (exists) {
          return old.map(p => p.id === project.id ? project : p);
        } else {
          return [project, ...old]; // Add new project at the beginning
        }
      });
      
      // Update local state to trigger UI refresh
      onProjectUpdate(project);
      
      toast({
        title: "Script Generated!",
        description: "Your viral script is ready to use.",
      });
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate script",
        variant: "destructive",
      });
    },
  });

  const saveCustomScriptMutation = useMutation({
    mutationFn: async () => {
      if (!customScript.trim()) {
        throw new Error("Please enter your script");
      }
      
      const response = await apiRequest("POST", "/api/vsp/projects/custom-script", {
        category: selectedCategory || "custom",
        subtopic: selectedSubtopic || "custom-script",
        script: customScript.trim(),
        length: scriptSettings.length,
      });
      
      return await response.json();
    },
    onSuccess: (project: ContentProject) => {
      queryClient.setQueryData(["/api/vsp/projects", project.id], project);
      queryClient.setQueryData(["/api/vsp/projects"], (old: ContentProject[] | undefined) => {
        if (!old) return [project];
        const exists = old.some(p => p.id === project.id);
        if (exists) {
          return old.map(p => p.id === project.id ? project : p);
        } else {
          return [project, ...old];
        }
      });
      onProjectUpdate(project);
      toast({
        title: "Script Saved!",
        description: "Your custom script is ready to use.",
      });
    },
    onError: (error) => {
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save script",
        variant: "destructive",
      });
    },
  });

  const generateCaptionMutation = useMutation({
    mutationFn: async () => {
      if (!currentProject?.id) {
        throw new Error("No project found");
      }
      
      const response = await apiRequest("POST", "/api/vsp/generate/caption", {
        projectId: currentProject.id,
        tone: captionSettings.tone,
        hashtagCount: captionSettings.hashtagCount,
      });
      
      return await response.json();
    },
    onSuccess: (project: ContentProject) => {
      // Update the query cache directly for this specific project
      queryClient.setQueryData(["/api/vsp/projects", project.id], project);
      
      // Also update the projects list
      queryClient.setQueryData(["/api/vsp/projects"], (old: ContentProject[] | undefined) => {
        if (!old) return [project];
        const exists = old.some(p => p.id === project.id);
        if (exists) {
          return old.map(p => p.id === project.id ? project : p);
        } else {
          return [project, ...old]; // Add new project at the beginning
        }
      });
      
      // Update local state to trigger UI refresh
      onProjectUpdate(project);
      
      toast({
        title: "Caption Generated!",
        description: "Your engaging caption with hashtags is ready.",
      });
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate caption",
        variant: "destructive",
      });
    },
  });

  const calculateCreditsMutation = useMutation({
    mutationFn: async () => {
      if (!currentProject?.id) {
        throw new Error("No project found");
      }
      
      const response = await apiRequest("POST", "/api/vsp/calculate-credits", {
        projectId: currentProject.id,
        style: videoSettings.style,
        voice: videoSettings.voice,
        generationPreset: videoSettings.generationPreset,
        qualityTier: videoSettings.qualityTier,
        captionStyle: videoSettings.captionStyle,
        audio: videoSettings.audio,
        resolution: videoSettings.resolution,
        compression: videoSettings.compression,
        frameRate: videoSettings.frameRate,
        hasToGenerateCover: videoSettings.hasToGenerateCover,
        ratio: videoSettings.ratio,
        disableCaptions: videoSettings.disableCaptions,
        captionPositionName: videoSettings.captionPositionName,
        hasToGenerateVoice: videoSettings.hasToGenerateVoice,
        hasToGenerateMusic: videoSettings.hasToGenerateMusic,
      });
      
      return await response.json();
    },
    onSuccess: (data: { credits: number; estimatedCost?: number }) => {
      setEstimatedCredits(data.credits);
    },
    onError: (error) => {
      toast({
        title: "Credit Calculation Failed",
        description: error instanceof Error ? error.message : "Failed to calculate credits",
        variant: "destructive",
      });
    },
  });

  const generateVideoMutation = useMutation({
    mutationFn: async () => {
      if (!currentProject?.id) {
        throw new Error("No project found");
      }
      
      const basePayload = {
        projectId: currentProject.id,
        videoEngine: videoSettings.videoEngine,
      };

      let payload: any = basePayload;
      if (videoSettings.videoEngine === 'veo') {
        payload = {
          ...basePayload,
          veoAspectRatio: videoSettings.veoAspectRatio,
          veoResolution: videoSettings.veoResolution,
          veoCustomInstructions: videoSettings.veoCustomInstructions,
          veoReferenceImages: videoSettings.veoReferenceImages.length > 0 ? videoSettings.veoReferenceImages : undefined,
          veoDuration: videoSettings.veoDuration || 'auto',
          veoFirstFrameImage: videoSettings.veoFirstFrameImage,
          veoLastFrameImage: videoSettings.veoLastFrameImage,
          veoPersonGeneration: videoSettings.veoPersonGeneration,
          veoNumberOfVideos: videoSettings.veoNumberOfVideos,
          characterProfile: videoSettings.characterProfile,
          colorPalette: videoSettings.colorPalette.length > 0 ? videoSettings.colorPalette : undefined,
          cinematography: videoSettings.cinematography,
        };
      } else if (videoSettings.videoEngine === 'kling') {
        payload = {
          ...basePayload,
          klingAspectRatio: videoSettings.klingAspectRatio,
          klingDuration: videoSettings.klingDuration,
          klingTier: videoSettings.klingTier,
          klingReferenceImage: videoSettings.klingReferenceImage,
          klingCustomInstructions: videoSettings.klingCustomInstructions,
          klingElementBinding: videoSettings.klingElementBinding,
          klingUseMultiPrompt: videoSettings.klingUseMultiPrompt,
          characterProfile: videoSettings.characterProfile?.description ? videoSettings.characterProfile : undefined,
          colorPalette: videoSettings.colorPalette?.length > 0 ? videoSettings.colorPalette : undefined,
          cinematography: videoSettings.cinematography,
        };
      } else if (videoSettings.videoEngine === 'omnihuman') {
        payload = {
          ...basePayload,
          omniReferenceImage: videoSettings.omniReferenceImage,
          omniAudioUrl: videoSettings.omniAudioUrl,
          omniResolution: videoSettings.omniResolution,
          omniVoiceId: videoSettings.omniVoiceId,
        };
      } else {
        payload = {
          ...basePayload,
          style: videoSettings.style,
          voice: videoSettings.voice,
          generationPreset: videoSettings.generationPreset,
          qualityTier: videoSettings.qualityTier,
          captionStyle: videoSettings.captionStyle,
          audio: videoSettings.audio,
          resolution: videoSettings.resolution,
          compression: videoSettings.compression,
          frameRate: videoSettings.frameRate,
          hasToGenerateCover: videoSettings.hasToGenerateCover,
          ratio: videoSettings.ratio,
          disableCaptions: videoSettings.disableCaptions,
          captionPositionName: videoSettings.captionPositionName,
          hasToGenerateVoice: videoSettings.hasToGenerateVoice,
          hasToGenerateMusic: videoSettings.hasToGenerateMusic,
          generationMusicPrompt: videoSettings.generationMusicPrompt,
        };
      }
      
      const response = await apiRequest("POST", "/api/vsp/generate/video", payload);
      
      return await response.json();
    },
    onSuccess: (project: ContentProject) => {
      // Update the query cache directly for this specific project
      queryClient.setQueryData(["/api/vsp/projects", project.id], project);
      
      // Also update the projects list
      queryClient.setQueryData(["/api/vsp/projects"], (old: ContentProject[] | undefined) => {
        if (!old) return [project];
        const exists = old.some(p => p.id === project.id);
        if (exists) {
          return old.map(p => p.id === project.id ? project : p);
        } else {
          return [project, ...old]; // Add new project at the beginning
        }
      });
      
      // Update local state to trigger UI refresh
      onProjectUpdate(project);

      // Force video status polling to start immediately
      queryClient.invalidateQueries({ queryKey: ["/api/vsp/projects", project.id, "video-status"] });

      toast({
        title: "Video Generation Started!",
        description: "Your video is being created. This may take a few minutes.",
      });
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate video",
        variant: "destructive",
      });
    },
  });

  // Calculate credits when video settings change
  const handleSettingsChange = (key: string, value: any) => {
    let processedValue: any = value;
    
    // Convert string values to proper types for numeric settings
    if (key === "compression") {
      processedValue = parseInt(value as string) as 9 | 18 | 33;
    } else if (key === "frameRate") {
      processedValue = parseInt(value as string) as 30 | 60;
    }
    // Boolean values (like hasToGenerateCover) are passed through as-is
    
    setVideoSettings(prev => ({ ...prev, [key]: processedValue }));
    setEstimatedCredits(null); // Reset credits when settings change
    
    // Calculate credits after a short delay to avoid too many API calls
    setTimeout(() => {
      if (currentProject?.id && currentProject?.script) {
        calculateCreditsMutation.mutate();
      }
    }, 500);
  };

  // Calculate credits initially when script is available
  // Load video settings from project when project changes
  React.useEffect(() => {
    if (currentProject?.videoSettings) {
      const savedSettings = currentProject.videoSettings as any; // Type assertion for compatibility
      setVideoSettings(prev => ({
        ...prev,
        ...savedSettings,
        // Derive musicMode from hasToGenerateMusic and audio settings
        musicMode: savedSettings.hasToGenerateMusic 
          ? "generate" 
          : (!savedSettings.audio || savedSettings.audio === '') 
            ? "none" 
            : "library"
      }));
    }
  }, [currentProject?.id]);

  React.useEffect(() => {
    if (currentProject?.id && currentProject?.script && estimatedCredits === null) {
      calculateCreditsMutation.mutate();
    }
  }, [currentProject?.id, currentProject?.script]);

  // Populate custom script and switch to custom mode when loading a project with an existing script
  React.useEffect(() => {
    if (currentProject?.script?.content) {
      setCustomScript(currentProject.script.content);
      setScriptMode("custom");
    }
  }, [currentProject?.id]);

  const getStepStatus = (step: 1 | 2 | 3) => {
    if (!currentProject) {
      return step === 1 ? "ready" : "disabled";
    }
    
    switch (step) {
      case 1:
        return currentProject.script ? "completed" : "ready";
      case 2:
        // Video generation: only needs script, no longer requires caption
        return currentProject.videoUrl ? "completed" : 
               currentProject.status === "video_generating" ? "processing" :
               currentProject.script ? "ready" : "disabled";
      case 3:
        // Caption generation: independent, only needs script
        return currentProject.caption ? "completed" : currentProject.script ? "ready" : "disabled";
      default:
        return "disabled";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready": return "bg-green-500";
      case "completed": return "bg-blue-500";
      case "processing": return "bg-yellow-500";
      default: return "bg-gray-400";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "ready": return "Ready";
      case "completed": return "Completed";
      case "processing": return "Processing";
      default: return "Waiting";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Script Generation Card */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <h3 className="text-lg font-semibold">Generate Script</h3>
            </div>
            <div 
              className={`w-3 h-3 rounded-full ${getStatusColor(getStepStatus(1))}`} 
              title={getStatusText(getStepStatus(1))}
            />
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Script Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={scriptMode === "ai" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setScriptMode("ai")}
                  data-testid="button-mode-ai"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  AI Generated
                </Button>
                <Button
                  variant={scriptMode === "custom" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setScriptMode("custom")}
                  data-testid="button-mode-custom"
                >
                  <PenLine className="w-4 h-4 mr-2" />
                  Custom Script
                </Button>
              </div>
            </div>

            {scriptMode === "ai" ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Script Style</label>
                  <Select 
                    value={scriptSettings.style} 
                    onValueChange={(value) => setScriptSettings(prev => ({ ...prev, style: value }))}
                    data-testid="select-script-style"
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {scriptStyles
                        .filter(style => style.isActive)
                        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                        .map(style => (
                          <SelectItem key={style.id} value={style.id}>
                            {style.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Video Length</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["15s", "30s", "60s"].map((length) => (
                      <Button
                        key={length}
                        variant={scriptSettings.length === length ? "default" : "outline"}
                        size="sm"
                        onClick={() => setScriptSettings(prev => ({ ...prev, length }))}
                        data-testid={`button-length-${length}`}
                      >
                        {length}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => generateScriptMutation.mutate()}
                  disabled={!selectedCategory || !selectedSubtopic || generateScriptMutation.isPending}
                  data-testid="button-generate-script"
                >
                  {generateScriptMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4 mr-2" />
                  )}
                  Generate Script
                </Button>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Your Script
                    <span className="text-muted-foreground font-normal ml-2">
                      ({customScript.split(/\s+/).filter(w => w).length} words)
                    </span>
                  </label>
                  <Textarea
                    placeholder="Enter your custom script here... This is what will be spoken in the video."
                    value={customScript}
                    onChange={(e) => setCustomScript(e.target.value)}
                    className="min-h-[120px] resize-none"
                    data-testid="textarea-custom-script"
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={() => saveCustomScriptMutation.mutate()}
                  disabled={!customScript.trim() || saveCustomScriptMutation.isPending}
                  data-testid="button-save-custom-script"
                  title={!customScript.trim() ? "Enter your script above" : ""}
                >
                  {saveCustomScriptMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <PenLine className="w-4 h-4 mr-2" />
                  )}
                  Use This Script
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Video Generation Card */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <h3 className="text-lg font-semibold">Generate Video</h3>
            </div>
            <div 
              className={`w-3 h-3 rounded-full ${getStatusColor(getStepStatus(2))}`} 
              title={getStatusText(getStepStatus(2))}
            />
          </div>
          
          <div className={`space-y-4 ${getStepStatus(2) === "disabled" ? "opacity-50" : ""}`}>
            {/* Video Engine Selection */}
            <div className="p-4 bg-muted/30 rounded-lg border">
              <label className="block text-sm font-medium text-foreground mb-3">
                Video Generation Engine
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleSettingsChange("videoEngine", "revid")}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    videoSettings.videoEngine === "revid"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                  disabled={getStepStatus(2) === "disabled"}
                  data-testid="button-engine-revid"
                >
                  <div className="text-sm font-semibold">Revid.ai</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Full control • Voice • Music • Captions
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleSettingsChange("videoEngine", "veo")}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    videoSettings.videoEngine === "veo"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                  disabled={getStepStatus(2) === "disabled"}
                  data-testid="button-engine-veo"
                >
                  <div className="text-sm font-semibold">Veo 3.1</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Google AI • Native audio • Scene extension
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleSettingsChange("videoEngine", "kling")}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    videoSettings.videoEngine === "kling"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                  disabled={getStepStatus(2) === "disabled"}
                  data-testid="button-engine-kling"
                >
                  <div className="text-sm font-semibold">Kling v3 Pro</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Character lock • Element binding • 1080p
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleSettingsChange("videoEngine", "omnihuman")}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    videoSettings.videoEngine === "omnihuman"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                  disabled={getStepStatus(2) === "disabled"}
                  data-testid="button-engine-omnihuman"
                >
                  <div className="text-sm font-semibold">OmniHuman 1.5</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Talking head • Audio sync • 60s max
                  </div>
                </button>
              </div>
            </div>

            {/* Conditional rendering based on selected engine */}
            {videoSettings.videoEngine === "revid" ? (
              <>
                {/* Revid.ai Settings */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Media Type
                    {availableMediaTypes.length > 0 && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({availableMediaTypes.length} types available)
                      </span>
                    )}
                  </label>
              <Select 
                value={videoSettings.style} 
                onValueChange={(value) => handleSettingsChange("style", value)}
                disabled={getStepStatus(2) === "disabled"}
                data-testid="select-video-style"
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableMediaTypes.map((mediaType: any) => (
                    <SelectItem key={mediaType.id} value={mediaType.id}>
                      {mediaType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Voice Generation Toggle */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <label htmlFor="generate-voice" className="text-sm font-medium text-foreground">
                  Generate Voice from Text
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  {videoSettings.hasToGenerateVoice 
                    ? "Enable AI text-to-speech using the selected voice below" 
                    : "Disable voice narration (video will be silent)"}
                </p>
              </div>
              <Switch
                id="generate-voice"
                checked={videoSettings.hasToGenerateVoice}
                onCheckedChange={(checked) => handleSettingsChange("hasToGenerateVoice", checked)}
                disabled={getStepStatus(2) === "disabled"}
                data-testid="switch-generate-voice"
              />
            </div>

            {/* Voice Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Narration Voice
                {availableVoices.length > 0 && (
                  <span className="text-xs text-muted-foreground ml-2">
                    ({availableVoices.length} voices available)
                  </span>
                )}
              </label>
              <Select 
                value={videoSettings.voice} 
                onValueChange={(value) => handleSettingsChange("voice", value)}
                disabled={getStepStatus(2) === "disabled"}
                data-testid="select-video-voice"
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {/* Preselected Voices */}
                  {availableVoices.filter((v: any) => v.category === 'preselected').length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        Preselected Voices
                      </div>
                      {availableVoices
                        .filter((v: any) => v.category === 'preselected')
                        .map((voice: any) => (
                          <SelectItem key={voice.id} value={voice.id}>
                            {voice.name} - {voice.description}
                          </SelectItem>
                        ))}
                    </>
                  )}
                  
                  {/* Custom Voices */}
                  {availableVoices.filter((v: any) => v.category === 'custom').length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">
                        Custom Voices
                      </div>
                      {availableVoices
                        .filter((v: any) => v.category === 'custom')
                        .map((voice: any) => (
                          <SelectItem key={voice.id} value={voice.id}>
                            {voice.name} - {voice.description}
                          </SelectItem>
                        ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Generation Preset */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Generation Preset
                {availableGenerationPresets.length > 0 && (
                  <span className="text-xs text-muted-foreground ml-2">
                    ({availableGenerationPresets.length} presets available)
                  </span>
                )}
              </label>
              <Select 
                value={videoSettings.generationPreset} 
                onValueChange={(value) => handleSettingsChange("generationPreset", value)}
                disabled={getStepStatus(2) === "disabled"}
                data-testid="select-generation-preset"
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableGenerationPresets.reduce((acc: any, preset: any) => {
                    if (!acc[preset.category]) acc[preset.category] = [];
                    acc[preset.category].push(preset);
                    return acc;
                  }, {}) && Object.entries(
                    availableGenerationPresets.reduce((acc: any, preset: any) => {
                      if (!acc[preset.category]) acc[preset.category] = [];
                      acc[preset.category].push(preset);
                      return acc;
                    }, {})
                  ).map(([category, presets]: [string, any]) => (
                    <div key={category}>
                      <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase">
                        {category}
                      </div>
                      {presets.map((preset: any) => (
                        <SelectItem key={preset.id} value={preset.id}>
                          {preset.name} - {preset.description}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quality Tier */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Quality Tier
                <span className="text-xs text-muted-foreground ml-2">
                  (affects credit cost)
                </span>
              </label>
              <Select 
                value={videoSettings.qualityTier} 
                onValueChange={(value) => handleSettingsChange("qualityTier", value)}
                disabled={getStepStatus(2) === "disabled"}
                data-testid="select-quality-tier"
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableQualityTiers.map((tier: any) => (
                    <SelectItem key={tier.id} value={tier.id}>
                      {tier.name} - {tier.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Aspect Ratio */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Aspect Ratio
              </label>
              <Select 
                value={videoSettings.ratio || '9 / 16'} 
                onValueChange={(value) => handleSettingsChange("ratio", value)}
                disabled={getStepStatus(2) === "disabled"}
                data-testid="select-aspect-ratio"
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="9 / 16">Vertical (9:16) - TikTok/Reels</SelectItem>
                  <SelectItem value="16 / 9">Horizontal (16:9) - YouTube</SelectItem>
                  <SelectItem value="1 / 1">Square (1:1) - Instagram</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Caption Style */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Caption Style
              </label>
              <Select 
                value={videoSettings.captionStyle} 
                onValueChange={(value) => handleSettingsChange("captionStyle", value)}
                disabled={getStepStatus(2) === "disabled" || videoSettings.disableCaptions}
                data-testid="select-caption-style"
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableCaptionStyles.map((style: any) => (
                    <SelectItem key={style.id} value={style.id}>
                      {style.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Caption Position */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Caption Position
              </label>
              <Select 
                value={videoSettings.captionPositionName} 
                onValueChange={(value) => handleSettingsChange("captionPositionName", value)}
                disabled={getStepStatus(2) === "disabled" || videoSettings.disableCaptions}
                data-testid="select-caption-position"
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableCaptionPositions.map((position: any) => (
                    <SelectItem key={position.id} value={position.id}>
                      {position.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Disable Captions Toggle */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="disable-captions"
                checked={videoSettings.disableCaptions || false}
                onChange={(e) => handleSettingsChange("disableCaptions", e.target.checked)}
                disabled={getStepStatus(2) === "disabled"}
                className="w-4 h-4 rounded border-gray-300"
                data-testid="checkbox-disable-captions"
              />
              <label htmlFor="disable-captions" className="text-sm font-medium text-foreground">
                Disable Captions
              </label>
            </div>

            {/* Music Mode Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Select or Generate Music
              </label>
              <Select 
                value={videoSettings.musicMode} 
                onValueChange={(value: "library" | "generate" | "none") => {
                  setVideoSettings(prev => ({
                    ...prev,
                    musicMode: value,
                    hasToGenerateMusic: value === "generate",
                    audio: value === "none" ? "" : (value === "library" ? prev.audio || "Observer" : "")
                  }));
                  setEstimatedCredits(null);
                  setTimeout(() => {
                    if (currentProject?.id && currentProject?.script) {
                      calculateCreditsMutation.mutate();
                    }
                  }, 500);
                }}
                disabled={getStepStatus(2) === "disabled"}
                data-testid="select-music-mode"
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="library">Audio Library</SelectItem>
                  <SelectItem value="generate">Generate Music</SelectItem>
                  <SelectItem value="none">No Music (Silent)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Audio Library Selection - Only shown when mode is "library" */}
            {videoSettings.musicMode === "library" && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Background Music
                  <span className="text-xs text-muted-foreground ml-2">
                    ({availableAudioOptions.length} tracks available)
                  </span>
                </label>
                <Select 
                  value={videoSettings.audio} 
                  onValueChange={(value) => handleSettingsChange("audio", value)}
                  disabled={getStepStatus(2) === "disabled"}
                  data-testid="select-audio-option"
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAudioOptions.map((audio: any) => (
                      <SelectItem key={audio.id} value={audio.id}>
                        {audio.name} - {audio.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Music Generation Prompt - Shown when mode is "generate" */}
            {videoSettings.musicMode === "generate" && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Music Generation Prompt (Optional)
                </label>
                <textarea
                  value={videoSettings.generationMusicPrompt}
                  onChange={(e) => handleSettingsChange("generationMusicPrompt", e.target.value)}
                  placeholder="E.g., upbeat electronic music, calm piano melody, energetic hip-hop beat..."
                  className="w-full min-h-[80px] px-3 py-2 text-sm rounded-md border border-input bg-background"
                  disabled={getStepStatus(2) === "disabled"}
                  data-testid="input-music-prompt"
                />
                <p className="text-xs text-muted-foreground">
                  An instrumental track will be generated based on your video text. Add instructions above to guide the AI music generation (costs ~20 credits per minute).
                </p>
              </div>
            )}

            {/* No Music Info - Shown when mode is "none" */}
            {videoSettings.musicMode === "none" && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Video will be generated without background music
                </p>
              </div>
            )}

            {/* Technical Settings */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-foreground mb-3">Technical Settings</h4>
              
              <div className="grid grid-cols-3 gap-3">
                {/* Resolution */}
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Resolution
                  </label>
                  <Select 
                    value={videoSettings.resolution} 
                    onValueChange={(value) => handleSettingsChange("resolution", value)}
                    disabled={getStepStatus(2) === "disabled"}
                    data-testid="select-resolution"
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="720p">720p HD</SelectItem>
                      <SelectItem value="1080p">1080p Full HD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Compression */}
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Quality
                  </label>
                  <Select 
                    value={videoSettings.compression.toString()} 
                    onValueChange={(value) => handleSettingsChange("compression", value)}
                    disabled={getStepStatus(2) === "disabled"}
                    data-testid="select-compression"
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="9">Low (9)</SelectItem>
                      <SelectItem value="18">Medium (18)</SelectItem>
                      <SelectItem value="33">High (33)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Frame Rate */}
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Frame Rate
                  </label>
                  <Select 
                    value={videoSettings.frameRate.toString()} 
                    onValueChange={(value) => handleSettingsChange("frameRate", value)}
                    disabled={getStepStatus(2) === "disabled"}
                    data-testid="select-frame-rate"
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 fps</SelectItem>
                      <SelectItem value="60">60 fps</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Cover Generation Toggle */}
              <div className="mt-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-foreground">
                    Generate Cover Image
                  </label>
                  <Switch
                    checked={videoSettings.hasToGenerateCover}
                    onCheckedChange={(checked) => handleSettingsChange("hasToGenerateCover", checked)}
                    disabled={getStepStatus(2) === "disabled"}
                    data-testid="switch-generate-cover"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Generate a cover image for the video
                </p>
              </div>
            </div>
              </>
            ) : null}

            {videoSettings.videoEngine === "veo" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <span className="flex items-center gap-1.5">
                      Aspect Ratio
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs text-xs">
                          9:16 vertical for TikTok, Reels, and Shorts. 16:9 landscape for YouTube.
                        </TooltipContent>
                      </Tooltip>
                    </span>
                  </label>
                  <Select
                    value={videoSettings.veoAspectRatio}
                    onValueChange={(value) => handleSettingsChange("veoAspectRatio", value)}
                    disabled={getStepStatus(2) === "disabled"}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="9:16">
                        Vertical (9:16) - TikTok/Reels
                      </SelectItem>
                      <SelectItem value="16:9">
                        Landscape (16:9) - YouTube
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <span className="flex items-center gap-1.5">
                      Clip Duration
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs text-xs">
                          Auto uses 8s clips for consistency, with shorter clips for remaining script. 8s is required for 1080p and 4K resolution.
                        </TooltipContent>
                      </Tooltip>
                    </span>
                  </label>
                  <Select
                    value={videoSettings.veoDuration}
                    onValueChange={(value) => handleSettingsChange("veoDuration", value)}
                    disabled={getStepStatus(2) === "disabled"}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">
                        Auto (optimize based on script length)
                      </SelectItem>
                      <SelectItem value="8">
                        8 seconds (best quality, recommended)
                      </SelectItem>
                      <SelectItem value="6">
                        6 seconds
                      </SelectItem>
                      <SelectItem value="4">
                        4 seconds (fastest)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Auto mode uses 8s clips for consistency, with shorter clips for remaining script.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <span className="flex items-center gap-1.5">
                      Resolution
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs text-xs">
                          720p is fastest for drafts. 1080p for production quality. 4K for highest quality — both 1080p and 4K require 8s clip duration.
                        </TooltipContent>
                      </Tooltip>
                    </span>
                  </label>
                  <Select
                    value={videoSettings.veoResolution}
                    onValueChange={(value) => handleSettingsChange("veoResolution", value)}
                    disabled={getStepStatus(2) === "disabled"}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="720p">
                        720p (faster generation)
                      </SelectItem>
                      <SelectItem value="1080p">
                        1080p (recommended)
                      </SelectItem>
                      <SelectItem value="4k">
                        4K (highest quality, 8s clips only)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    <span className="flex items-center gap-1.5">
                      Custom Instructions (Optional)
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs text-xs">
                          Describe the visual style, mood, camera angles, lighting, and setting. E.g., 'warm cozy living room, soft golden lighting, close-up shots.'
                        </TooltipContent>
                      </Tooltip>
                    </span>
                  </label>
                  <textarea
                    value={videoSettings.veoCustomInstructions || ''}
                    onChange={(e) => handleSettingsChange("veoCustomInstructions", e.target.value)}
                    placeholder="E.g., cinematic style with dramatic lighting, focus on close-ups, vibrant colors..."
                    className="w-full min-h-[80px] px-3 py-2 text-sm rounded-md border border-input bg-background"
                    disabled={getStepStatus(2) === "disabled"}
                  />
                </div>

                {/* Reference Images (up to 3) */}
                <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-foreground">
                      <span className="flex items-center gap-1.5">
                        Reference Images (Up to 3)
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs text-xs">
                            Guide images for style and character consistency. Unlike the first frame, these influence the look without appearing in the video. Only applied to the first clip.
                          </TooltipContent>
                        </Tooltip>
                      </span>
                    </h4>
                    <p className="text-xs text-muted-foreground">{videoSettings.veoReferenceImages.length}/3 uploaded</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {videoSettings.veoReferenceImages.map((img, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={img}
                          alt={`Reference ${idx + 1}`}
                          className="w-full h-24 object-cover rounded-md border border-input"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 h-6 w-6 p-0"
                          onClick={() => {
                            const updated = videoSettings.veoReferenceImages.filter((_, i) => i !== idx);
                            handleSettingsChange("veoReferenceImages", updated);
                          }}
                          disabled={getStepStatus(2) === "disabled"}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}

                    {videoSettings.veoReferenceImages.length < 3 && (
                      <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-input rounded-md cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors">
                        <Upload className="w-5 h-5 mb-1 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Add image</span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 10 * 1024 * 1024) {
                                alert('File size must be less than 10MB');
                                return;
                              }
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                const updated = [...videoSettings.veoReferenceImages, reader.result as string];
                                handleSettingsChange("veoReferenceImages", updated);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          disabled={getStepStatus(2) === "disabled"}
                        />
                      </label>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Upload up to 3 reference images to guide character, object, or scene appearance. Veo 3.1 uses these to maintain visual consistency.
                  </p>
                </div>

                {/* First Frame Image */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    <span className="flex items-center gap-1.5">
                      First Frame Image (Optional)
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs text-xs">
                          Upload a photo to use as the starting frame. Veo will animate from this image — great for brand consistency with a specific character or set.
                        </TooltipContent>
                      </Tooltip>
                    </span>
                  </label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Upload an image to use as the starting frame. The video will animate from this image.
                  </p>
                  {videoSettings.veoFirstFrameImage ? (
                    <div className="relative inline-block">
                      <img src={videoSettings.veoFirstFrameImage} alt="First frame" className="h-24 rounded-md border border-input" />
                      <Button variant="destructive" size="sm" className="absolute top-1 right-1 h-6 w-6 p-0"
                        onClick={() => handleSettingsChange("veoFirstFrameImage", undefined)}
                        disabled={getStepStatus(2) === "disabled"}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-24 w-32 border-2 border-dashed border-input rounded-md cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors">
                      <Upload className="w-5 h-5 mb-1 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Upload image</span>
                      <input type="file" className="hidden" accept="image/png,image/jpeg,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 10 * 1024 * 1024) { alert('File size must be less than 10MB'); return; }
                            const reader = new FileReader();
                            reader.onloadend = () => handleSettingsChange("veoFirstFrameImage", reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                        disabled={getStepStatus(2) === "disabled"} />
                    </label>
                  )}
                </div>

                {/* Last Frame Image - only when first frame is set */}
                {videoSettings.veoFirstFrameImage && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">
                      <span className="flex items-center gap-1.5">
                        Last Frame Image (Optional)
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs text-xs">
                            Upload an end frame to create a smooth interpolation between first and last frame. Useful for specific visual storytelling journeys.
                          </TooltipContent>
                        </Tooltip>
                      </span>
                    </label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Upload an end frame to interpolate between first and last frame.
                    </p>
                    {videoSettings.veoLastFrameImage ? (
                      <div className="relative inline-block">
                        <img src={videoSettings.veoLastFrameImage} alt="Last frame" className="h-24 rounded-md border border-input" />
                        <Button variant="destructive" size="sm" className="absolute top-1 right-1 h-6 w-6 p-0"
                          onClick={() => handleSettingsChange("veoLastFrameImage", undefined)}
                          disabled={getStepStatus(2) === "disabled"}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-24 w-32 border-2 border-dashed border-input rounded-md cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors">
                        <Upload className="w-5 h-5 mb-1 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Upload image</span>
                        <input type="file" className="hidden" accept="image/png,image/jpeg,image/webp"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 10 * 1024 * 1024) { alert('File size must be less than 10MB'); return; }
                              const reader = new FileReader();
                              reader.onloadend = () => handleSettingsChange("veoLastFrameImage", reader.result as string);
                              reader.readAsDataURL(file);
                            }
                          }}
                          disabled={getStepStatus(2) === "disabled"} />
                      </label>
                    )}
                  </div>
                )}

                {/* Character Consistency Settings for Veo */}
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-foreground">
                      <span className="flex items-center gap-1.5">
                        Character Consistency (Optional)
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs text-xs">
                            Describe your character's appearance in detail to maintain consistent look across all clips in multi-clip videos.
                          </TooltipContent>
                        </Tooltip>
                      </span>
                    </h4>
                    <p className="text-xs text-muted-foreground">Helps maintain consistent appearance</p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">
                      <span className="flex items-center gap-1.5">
                        Character Description
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs text-xs">
                            Physical appearance details — age, hair, eyes, build, expression. The more specific, the more consistent across clips.
                          </TooltipContent>
                        </Tooltip>
                      </span>
                    </label>
                    <textarea
                      value={videoSettings.characterProfile?.description || ''}
                      onChange={(e) => handleSettingsChange("characterProfile", {
                        ...videoSettings.characterProfile,
                        description: e.target.value,
                        wardrobe: videoSettings.characterProfile?.wardrobe || ''
                      })}
                      placeholder="E.g., A woman in her early 30s with shoulder-length auburn hair, green eyes..."
                      className="w-full min-h-[60px] px-3 py-2 text-sm rounded-md border border-input bg-background"
                      disabled={getStepStatus(2) === "disabled"}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">
                      <span className="flex items-center gap-1.5">
                        Wardrobe
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs text-xs">
                            Describe clothing, accessories, and overall style to keep the character's outfit consistent across clips.
                          </TooltipContent>
                        </Tooltip>
                      </span>
                    </label>
                    <input
                      type="text"
                      value={videoSettings.characterProfile?.wardrobe || ''}
                      onChange={(e) => handleSettingsChange("characterProfile", {
                        ...videoSettings.characterProfile,
                        description: videoSettings.characterProfile?.description || '',
                        wardrobe: e.target.value
                      })}
                      placeholder="E.g., Flowing burgundy wrap top, gold pendant necklace..."
                      className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background"
                      disabled={getStepStatus(2) === "disabled"}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">
                      <span className="flex items-center gap-1.5">
                        Color Palette (3-5 colors)
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs text-xs">
                            Enter brand or mood colors to dominate the visual style. Veo will try to incorporate these across all clips.
                          </TooltipContent>
                        </Tooltip>
                      </span>
                    </label>
                    <input
                      type="text"
                      value={videoSettings.colorPalette.join(', ')}
                      onChange={(e) => {
                        const colors = e.target.value.split(',').map(c => c.trim()).filter(c => c);
                        handleSettingsChange("colorPalette", colors);
                      }}
                      placeholder="E.g., crimson red, slate blue, cream white..."
                      className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background"
                      disabled={getStepStatus(2) === "disabled"}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">
                      <span className="flex items-center gap-1.5">
                        Camera Style
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs text-xs">
                            Camera angles and framing — e.g., medium close-up, slow push-in, eye level. Keeps the cinematographic style consistent across clips.
                          </TooltipContent>
                        </Tooltip>
                      </span>
                    </label>
                    <input
                      type="text"
                      value={videoSettings.cinematography?.cameraStyle || ''}
                      onChange={(e) => handleSettingsChange("cinematography", {
                        ...videoSettings.cinematography,
                        cameraStyle: e.target.value
                      })}
                      placeholder="E.g., Medium close-up, slight slow push-in, eye level..."
                      className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background"
                      disabled={getStepStatus(2) === "disabled"}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">
                      <span className="flex items-center gap-1.5">
                        Lighting Style
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs text-xs">
                            Lighting approach — e.g., warm golden hour, soft key light, natural window light. Sets the mood and keeps it consistent.
                          </TooltipContent>
                        </Tooltip>
                      </span>
                    </label>
                    <input
                      type="text"
                      value={videoSettings.cinematography?.lightingStyle || ''}
                      onChange={(e) => handleSettingsChange("cinematography", {
                        ...videoSettings.cinematography,
                        lightingStyle: e.target.value
                      })}
                      placeholder="E.g., Warm golden hour, soft key light from the left..."
                      className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background"
                      disabled={getStepStatus(2) === "disabled"}
                    />
                  </div>
                </div>

                {/* Person Generation */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <span className="flex items-center gap-1.5">
                      Person Generation
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs text-xs">
                          Controls whether Veo generates human figures. 'Allow Adults' is default for most content. 'Don't Allow' for abstract or nature-only visuals.
                        </TooltipContent>
                      </Tooltip>
                    </span>
                  </label>
                  <Select
                    value={videoSettings.veoPersonGeneration}
                    onValueChange={(value) => handleSettingsChange("veoPersonGeneration", value)}
                    disabled={getStepStatus(2) === "disabled"}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="allow_adult">Allow Adults (default)</SelectItem>
                      <SelectItem value="allow_all">Allow All People</SelectItem>
                      <SelectItem value="dont_allow">Don't Allow People</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Number of Videos */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <span className="flex items-center gap-1.5">
                      Variations per Generation
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs text-xs">
                          Generate multiple versions of the same video to pick the best one. Only applies to single-clip videos. Each variation costs a separate generation.
                        </TooltipContent>
                      </Tooltip>
                    </span>
                  </label>
                  <Select
                    value={String(videoSettings.veoNumberOfVideos)}
                    onValueChange={(value) => handleSettingsChange("veoNumberOfVideos", parseInt(value))}
                    disabled={getStepStatus(2) === "disabled"}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 video (default)</SelectItem>
                      <SelectItem value="2">2 variations</SelectItem>
                      <SelectItem value="3">3 variations</SelectItem>
                      <SelectItem value="4">4 variations</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Generate multiple variations to pick the best one. Only applies to single-clip videos.
                  </p>
                </div>

                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                  <p className="text-sm text-green-900 dark:text-green-100">
                    <strong>Veo 3.1 Features:</strong> Native audio generation with dialogue, sound effects, and ambient sounds. Scene extension automatically continues from the last second of each clip for seamless multi-clip videos.
                  </p>
                </div>
              </>
            )}

            {videoSettings.videoEngine === "kling" && (
              <>
                {/* Kling v3 Settings */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Model Tier
                    <span className="ml-1 text-xs text-muted-foreground" title="Pro: highest quality ($0.168/s with audio). Standard: 25% cheaper ($0.126/s with audio), minor quality difference for talking heads.">ⓘ</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSettingsChange("klingTier", "pro")}
                      className={`p-2 rounded-lg border-2 text-sm ${videoSettings.klingTier === "pro" ? "border-primary bg-primary/10" : "border-border"}`}
                    >
                      <div className="font-medium">Pro</div>
                      <div className="text-xs text-muted-foreground">$0.168/s</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSettingsChange("klingTier", "standard")}
                      className={`p-2 rounded-lg border-2 text-sm ${videoSettings.klingTier === "standard" ? "border-primary bg-primary/10" : "border-border"}`}
                    >
                      <div className="font-medium">Standard</div>
                      <div className="text-xs text-muted-foreground">$0.126/s</div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Aspect Ratio
                    <span className="ml-1 text-xs text-muted-foreground" title="16:9 for YouTube/landscape, 9:16 for TikTok/Reels/Shorts, 1:1 for Instagram feed">ⓘ</span>
                  </label>
                  <select
                    value={videoSettings.klingAspectRatio}
                    onChange={(e) => handleSettingsChange("klingAspectRatio", e.target.value)}
                    className="w-full p-2 rounded-md border bg-background text-foreground"
                    disabled={getStepStatus(2) === "disabled"}
                  >
                    <option value="9:16">9:16 (Vertical — TikTok/Reels)</option>
                    <option value="16:9">16:9 (Landscape — YouTube)</option>
                    <option value="1:1">1:1 (Square — Instagram)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Shot Duration
                    <span className="ml-1 text-xs text-muted-foreground" title="Max duration per shot. Kling supports 3-15s. Longer shots = fewer cuts but higher cost per shot. The script is automatically split into shots of this length.">ⓘ</span>
                  </label>
                  <select
                    value={videoSettings.klingDuration}
                    onChange={(e) => handleSettingsChange("klingDuration", e.target.value)}
                    className="w-full p-2 rounded-md border bg-background text-foreground"
                    disabled={getStepStatus(2) === "disabled"}
                  >
                    {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => (
                      <option key={d} value={String(d)}>{d} seconds{d === 10 ? ' (recommended)' : ''}</option>
                    ))}
                  </select>
                </div>

                {/* Cost estimate */}
                {currentProject?.script && (
                  <div className="p-2 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                    {(() => {
                      const words = currentProject.script.content.trim().split(/\s+/).length;
                      const estDuration = words / 3.0;
                      const maxShot = parseInt(videoSettings.klingDuration);
                      const shots = Math.max(1, Math.ceil(estDuration / maxShot));
                      // Each shot uses actual needed duration (word-based), not max
                      const avgShotDur = Math.min(maxShot, Math.ceil(estDuration / shots) + 2);
                      const totalSec = shots === 1 ? Math.min(maxShot, Math.ceil(estDuration + 2)) : shots * avgShotDur;
                      const rate = videoSettings.klingTier === 'standard' ? 0.126 : 0.168;
                      const cost = (totalSec * rate).toFixed(2);
                      return `Est. ${shots} shot${shots > 1 ? 's' : ''}, ~${totalSec}s billed ~ $${cost}`;
                    })()}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Reference Image (Face Lock)
                    <span className="ml-1 text-xs text-muted-foreground" title="Upload a clear frontal face photo. Kling's Element Binding will lock this face across all clips for character consistency. This is the key feature — without it, each clip may generate a different-looking person.">ⓘ</span>
                  </label>
                  <div className="space-y-2">
                    {videoSettings.klingReferenceImage ? (
                      <div className="relative">
                        <img
                          src={videoSettings.klingReferenceImage}
                          alt="Reference"
                          className="w-32 h-32 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => handleSettingsChange("klingReferenceImage", undefined)}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center gap-2 cursor-pointer p-3 border-2 border-dashed rounded-lg hover:border-primary/50">
                        <span className="text-sm text-muted-foreground">Upload face photo for character consistency</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = () => handleSettingsChange("klingReferenceImage", reader.result as string);
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="klingElementBinding"
                    checked={videoSettings.klingElementBinding}
                    onChange={(e) => handleSettingsChange("klingElementBinding", e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="klingElementBinding" className="text-sm font-medium text-foreground">
                    Element Binding
                    <span className="ml-1 text-xs text-muted-foreground" title="Locks facial features (eyes, hair, bone structure) to the reference image. Keeps the same person across all clips. Requires a reference image.">ⓘ</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Custom Instructions
                    <span className="ml-1 text-xs text-muted-foreground" title="Additional visual style guidance. Describe the mood, setting, camera work, lighting, etc. These get woven into the AI visual prompt for each clip.">ⓘ</span>
                  </label>
                  <textarea
                    value={videoSettings.klingCustomInstructions}
                    onChange={(e) => handleSettingsChange("klingCustomInstructions", e.target.value)}
                    className="w-full p-2 rounded-md border bg-background text-foreground min-h-[80px]"
                    placeholder="e.g., Warm cinematic lighting, shallow depth of field, cozy living room setting..."
                    disabled={getStepStatus(2) === "disabled"}
                  />
                </div>

                {/* Character Profile - reuse same fields as Veo */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Character Description
                    <span className="ml-1 text-xs text-muted-foreground" title="Text description of the character's appearance. Works together with the reference image — the image locks the face, this describes everything else (age, expression, mannerisms).">ⓘ</span>
                  </label>
                  <textarea
                    value={videoSettings.characterProfile?.description || ""}
                    onChange={(e) => handleSettingsChange("characterProfile", {
                      ...videoSettings.characterProfile,
                      description: e.target.value,
                      wardrobe: videoSettings.characterProfile?.wardrobe || "",
                    })}
                    className="w-full p-2 rounded-md border bg-background text-foreground min-h-[60px]"
                    placeholder="e.g., Woman in her 50s with warm smile, silver-streaked dark hair, kind hazel eyes..."
                    disabled={getStepStatus(2) === "disabled"}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Wardrobe
                    <span className="ml-1 text-xs text-muted-foreground" title="Describe clothing and accessories. Kling will try to maintain this across clips.">ⓘ</span>
                  </label>
                  <input
                    type="text"
                    value={videoSettings.characterProfile?.wardrobe || ""}
                    onChange={(e) => handleSettingsChange("characterProfile", {
                      ...videoSettings.characterProfile,
                      description: videoSettings.characterProfile?.description || "",
                      wardrobe: e.target.value,
                    })}
                    className="w-full p-2 rounded-md border bg-background text-foreground"
                    placeholder="e.g., Burgundy wrap cardigan, gold pendant necklace"
                    disabled={getStepStatus(2) === "disabled"}
                  />
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>Kling v3 Pro:</strong> Best for character consistency across clips. Upload a clear frontal face photo and enable Element Binding — Kling locks facial features (eyes, hair, bone structure) to your reference image. Each clip generates independently but with the same face. Max 10s per clip at 1080p.
                  </p>
                </div>
              </>
            )}

            {videoSettings.videoEngine === "omnihuman" && (
              <>
                {/* OmniHuman 1.5 Settings */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Reference Image (Required)
                    <span className="ml-1 text-xs text-muted-foreground" title="Upload a clear photo of the person who should appear in the video. OmniHuman will animate this person's face, head, and upper body with lip-synced speech matching your audio. Use a high-quality frontal photo with good lighting.">ⓘ</span>
                  </label>
                  <div className="space-y-2">
                    {videoSettings.omniReferenceImage ? (
                      <div className="relative">
                        <img
                          src={videoSettings.omniReferenceImage}
                          alt="Reference"
                          className="w-32 h-32 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => handleSettingsChange("omniReferenceImage", undefined)}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center gap-2 cursor-pointer p-3 border-2 border-dashed rounded-lg hover:border-primary/50">
                        <span className="text-sm text-muted-foreground">Upload face photo (required)</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = () => handleSettingsChange("omniReferenceImage", reader.result as string);
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Audio Source
                    <span className="ml-1 text-xs text-muted-foreground" title="OmniHuman needs audio to sync lip movements. Either generate speech from your script using AI text-to-speech (ElevenLabs), or upload your own pre-recorded audio file.">ⓘ</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => handleSettingsChange("omniAudioUrl", "")}
                      className={`p-2 rounded-lg border-2 text-sm ${
                        !videoSettings.omniAudioUrl
                          ? "border-primary bg-primary/10"
                          : "border-border"
                      }`}
                    >
                      Generate with TTS
                    </button>
                    <label
                      className={`p-2 rounded-lg border-2 text-sm text-center cursor-pointer ${
                        videoSettings.omniAudioUrl
                          ? "border-primary bg-primary/10"
                          : "border-border"
                      }`}
                    >
                      Upload Audio
                      <input
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              // For uploaded audio, we'd need to upload to S3 first
                              // For now store as data URL indicator
                              handleSettingsChange("omniAudioUrl", `uploaded:${file.name}`);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>

                  {!videoSettings.omniAudioUrl && (
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        TTS Voice ID (ElevenLabs)
                        <span className="ml-1 text-xs text-muted-foreground" title="Enter an ElevenLabs voice ID. The system will generate speech audio from your script using this voice, then feed it to OmniHuman for lip-synced video.">ⓘ</span>
                      </label>
                      <input
                        type="text"
                        value={videoSettings.omniVoiceId}
                        onChange={(e) => handleSettingsChange("omniVoiceId", e.target.value)}
                        className="w-full p-2 rounded-md border bg-background text-foreground text-sm"
                        placeholder="e.g., EXAVITQu4vr4xnSDxMaL (Sarah)"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Resolution
                    <span className="ml-1 text-xs text-muted-foreground" title="720p supports up to 60 seconds of video. 1080p supports up to 30 seconds. Choose based on your script length.">ⓘ</span>
                  </label>
                  <select
                    value={videoSettings.omniResolution}
                    onChange={(e) => handleSettingsChange("omniResolution", e.target.value)}
                    className="w-full p-2 rounded-md border bg-background text-foreground"
                    disabled={getStepStatus(2) === "disabled"}
                  >
                    <option value="720p">720p (up to 60s)</option>
                    <option value="1080p">1080p (up to 30s)</option>
                  </select>
                </div>

                <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-900">
                  <p className="text-sm text-purple-900 dark:text-purple-100">
                    <strong>OmniHuman 1.5:</strong> Best for talking-head videos. Upload a face photo + provide audio → generates a full lip-synced video with natural head movement, facial expressions, and gestures. Up to 60s at 720p in a single generation — no clip stitching needed. Does not generate speech — uses your provided audio or AI-generated TTS.
                  </p>
                </div>
              </>
            )}

            {/* Credit Estimation - Only for Revid */}
            {videoSettings.videoEngine === "revid" && currentProject?.script && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Estimated Credits:</span>
                  <div className="flex items-center space-x-2">
                    {calculateCreditsMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Calculating...</span>
                      </>
                    ) : estimatedCredits !== null ? (
                      <span className="text-sm font-semibold text-primary" data-testid="text-estimated-credits">
                        {estimatedCredits} credits
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Select settings to estimate</span>
                    )}
                  </div>
                </div>
                {estimatedCredits !== null && (
                  <div className="mt-1">
                    <span className="text-xs text-muted-foreground">
                      Make sure you have enough credits in your Revid.ai account
                    </span>
                  </div>
                )}
              </div>
            )}

            <Button
              className="w-full"
              onClick={() => generateVideoMutation.mutate()}
              disabled={getStepStatus(2) === "disabled" || generateVideoMutation.isPending}
              data-testid="button-generate-video"
            >
              {generateVideoMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Video className="w-4 h-4 mr-2" />
              )}
              Create Video
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Caption Generation Card */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <h3 className="text-lg font-semibold">Generate Caption</h3>
            </div>
            <div 
              className={`w-3 h-3 rounded-full ${getStatusColor(getStepStatus(3))}`} 
              title={getStatusText(getStepStatus(3))}
            />
          </div>
          
          <div className={`space-y-4 ${getStepStatus(3) === "disabled" ? "opacity-50" : ""}`}>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Caption Tone</label>
              <Select 
                value={captionSettings.tone} 
                onValueChange={(value) => setCaptionSettings(prev => ({ ...prev, tone: value }))}
                disabled={getStepStatus(3) === "disabled"}
                data-testid="select-caption-tone"
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {captionStyles
                    .filter(style => style.isActive)
                    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                    .map(style => (
                      <SelectItem key={style.id} value={style.id}>
                        {style.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Hashtag Count</label>
              <Slider
                value={[captionSettings.hashtagCount]}
                onValueChange={([value]) => setCaptionSettings(prev => ({ ...prev, hashtagCount: value }))}
                min={5}
                max={20}
                step={1}
                disabled={getStepStatus(3) === "disabled"}
                className="mb-2"
                data-testid="slider-hashtag-count"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>5</span>
                <span>{captionSettings.hashtagCount} hashtags</span>
                <span>20</span>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={() => generateCaptionMutation.mutate()}
              disabled={getStepStatus(3) === "disabled" || generateCaptionMutation.isPending}
              data-testid="button-generate-caption"
            >
              {generateCaptionMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Hash className="w-4 h-4 mr-2" />
              )}
              Generate Caption
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
