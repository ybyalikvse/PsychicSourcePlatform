import React, { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Wand2, Hash, Video, Loader2, Upload, X, PenLine } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
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
    videoEngine: "revid" as "revid" | "sora" | "veo",
    
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
    
    // Sora 2 settings
    soraModel: "sora-2" as "sora-2" | "sora-2-pro",
    soraSize: "720x1280" as "1280x720" | "720x1280" | "1080x1080", // Default to vertical (TikTok/Reels)
    soraCustomInstructions: "", // Custom instructions for video style/mood
    soraReferenceImage: undefined as string | undefined,
    
    // Veo 3.1 settings
    veoAspectRatio: "9:16" as "9:16" | "16:9",
    veoResolution: "1080p" as "720p" | "1080p",
    veoCustomInstructions: "",
    veoReferenceImages: [] as string[],
    veoNegativePrompt: "",
    
    // Character Consistency Settings
    characterProfile: undefined as { description: string; wardrobe: string; distinctiveFeatures?: string } | undefined,
    colorPalette: [] as string[],
    cinematography: undefined as { cameraStyle?: string; lightingStyle?: string } | undefined,
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
      if (videoSettings.videoEngine === 'sora') {
        payload = {
          ...basePayload,
          soraModel: videoSettings.soraModel,
          soraSize: videoSettings.soraSize,
          soraCustomInstructions: videoSettings.soraCustomInstructions,
          soraReferenceImage: videoSettings.soraReferenceImage,
          characterProfile: videoSettings.characterProfile,
          colorPalette: videoSettings.colorPalette.length > 0 ? videoSettings.colorPalette : undefined,
          cinematography: videoSettings.cinematography,
        };
      } else if (videoSettings.videoEngine === 'veo') {
        payload = {
          ...basePayload,
          veoAspectRatio: videoSettings.veoAspectRatio,
          veoResolution: videoSettings.veoResolution,
          veoCustomInstructions: videoSettings.veoCustomInstructions,
          veoReferenceImages: videoSettings.veoReferenceImages.length > 0 ? videoSettings.veoReferenceImages : undefined,
          veoNegativePrompt: videoSettings.veoNegativePrompt || undefined,
          characterProfile: videoSettings.characterProfile,
          colorPalette: videoSettings.colorPalette.length > 0 ? videoSettings.colorPalette : undefined,
          cinematography: videoSettings.cinematography,
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
    } else if (key === "soraSeconds") {
      processedValue = typeof value === 'number' ? value : parseInt(value as string);
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
              <div className="grid grid-cols-3 gap-3">
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
                  onClick={() => handleSettingsChange("videoEngine", "sora")}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    videoSettings.videoEngine === "sora"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                  disabled={getStepStatus(2) === "disabled"}
                  data-testid="button-engine-sora"
                >
                  <div className="text-sm font-semibold">Sora 2</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    AI video • Auto audio • Premium quality
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
            ) : videoSettings.videoEngine === "sora" ? (
              <>
                {/* Sora 2 Settings */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Model
                  </label>
                  <Select 
                    value={videoSettings.soraModel} 
                    onValueChange={(value) => handleSettingsChange("soraModel", value)}
                    disabled={getStepStatus(2) === "disabled"}
                    data-testid="select-sora-model"
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sora-2">
                        Sora 2 - Faster, $0.10/sec
                      </SelectItem>
                      <SelectItem value="sora-2-pro">
                        Sora 2 Pro - Premium Quality, $0.30/sec
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Aspect Ratio
                  </label>
                  <Select 
                    value={videoSettings.soraSize} 
                    onValueChange={(value) => handleSettingsChange("soraSize", value)}
                    disabled={getStepStatus(2) === "disabled"}
                    data-testid="select-sora-size"
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="720x1280">
                        Vertical (9:16) - 720x1280 - TikTok/Reels
                      </SelectItem>
                      <SelectItem value="1280x720">
                        Landscape (16:9) - 1280x720 - YouTube
                      </SelectItem>
                      <SelectItem value="1080x1080">
                        Square (1:1) - 1080x1080 - Instagram
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Custom Instructions (Optional)
                  </label>
                  <textarea
                    value={videoSettings.soraCustomInstructions || ''}
                    onChange={(e) => handleSettingsChange("soraCustomInstructions", e.target.value)}
                    placeholder="E.g., cinematic style with dramatic lighting, focus on close-ups, vibrant colors..."
                    className="w-full min-h-[80px] px-3 py-2 text-sm rounded-md border border-input bg-background"
                    disabled={getStepStatus(2) === "disabled"}
                    data-testid="input-sora-instructions"
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional: Add specific instructions to guide the visual style, camera angles, lighting, or mood. AI will combine this with your script to create the video.
                  </p>
                </div>

                {/* Character Consistency Settings */}
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-foreground">Character Consistency (Recommended)</h4>
                    <p className="text-xs text-muted-foreground">Maintain consistent appearance across clips</p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">
                      Character Description
                    </label>
                    <textarea
                      value={videoSettings.characterProfile?.description || ''}
                      onChange={(e) => handleSettingsChange("characterProfile", {
                        ...videoSettings.characterProfile,
                        description: e.target.value,
                        wardrobe: videoSettings.characterProfile?.wardrobe || ''
                      })}
                      placeholder="E.g., A woman in her early 30s with shoulder-length auburn hair, green eyes, round face, fair skin..."
                      className="w-full min-h-[60px] px-3 py-2 text-sm rounded-md border border-input bg-background"
                      disabled={getStepStatus(2) === "disabled"}
                      data-testid="input-character-description"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">
                      Wardrobe & Clothing
                    </label>
                    <input
                      type="text"
                      value={videoSettings.characterProfile?.wardrobe || ''}
                      onChange={(e) => handleSettingsChange("characterProfile", {
                        ...videoSettings.characterProfile,
                        description: videoSettings.characterProfile?.description || '',
                        wardrobe: e.target.value
                      })}
                      placeholder="E.g., Navy blue blazer, white shirt, silver hoop earrings..."
                      className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background"
                      disabled={getStepStatus(2) === "disabled"}
                      data-testid="input-character-wardrobe"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">
                      Color Palette (3-5 colors)
                    </label>
                    <input
                      type="text"
                      value={videoSettings.colorPalette.join(', ')}
                      onChange={(e) => {
                        const colors = e.target.value.split(',').map(c => c.trim()).filter(c => c);
                        handleSettingsChange("colorPalette", colors);
                      }}
                      placeholder="E.g., crimson red, slate blue, cream white, charcoal gray..."
                      className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background"
                      disabled={getStepStatus(2) === "disabled"}
                      data-testid="input-color-palette"
                    />
                    <p className="text-xs text-muted-foreground">
                      Separate colors with commas. These colors will be used consistently across all video clips.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-foreground">
                        Camera Style
                      </label>
                      <input
                        type="text"
                        value={videoSettings.cinematography?.cameraStyle || ''}
                        onChange={(e) => handleSettingsChange("cinematography", {
                          ...videoSettings.cinematography,
                          cameraStyle: e.target.value
                        })}
                        placeholder="E.g., Medium shot, eye level"
                        className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background"
                        disabled={getStepStatus(2) === "disabled"}
                        data-testid="input-camera-style"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-foreground">
                        Lighting Style
                      </label>
                      <input
                        type="text"
                        value={videoSettings.cinematography?.lightingStyle || ''}
                        onChange={(e) => handleSettingsChange("cinematography", {
                          ...videoSettings.cinematography,
                          lightingStyle: e.target.value
                        })}
                        placeholder="E.g., Soft window light, warm fill"
                        className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background"
                        disabled={getStepStatus(2) === "disabled"}
                        data-testid="input-lighting-style"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-blue-900 dark:text-blue-100">
                      <strong>Why this helps:</strong> Since Sora doesn't support reference images reliably, providing detailed character descriptions, specific colors, and consistent cinematography helps maintain visual continuity across multiple video clips.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Reference Image (Optional)
                  </label>
                  <div className="space-y-3">
                    {videoSettings.soraReferenceImage ? (
                      <div className="space-y-2">
                        <div className="relative">
                          <img 
                            src={videoSettings.soraReferenceImage} 
                            alt="Reference" 
                            className="w-full h-48 object-cover rounded-md border border-input"
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => handleSettingsChange("soraReferenceImage", undefined)}
                            disabled={getStepStatus(2) === "disabled"}
                            data-testid="button-remove-image"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => handleSettingsChange("soraReferenceImage", undefined)}
                          disabled={getStepStatus(2) === "disabled"}
                          data-testid="button-clear-reference-image"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Clear Reference Image
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-32 px-4 border-2 border-dashed border-input rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                          <p className="mb-2 text-sm text-muted-foreground">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground">PNG, JPG or WEBP (MAX. 10MB)</p>
                        </div>
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
                                handleSettingsChange("soraReferenceImage", reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          disabled={getStepStatus(2) === "disabled"}
                          data-testid="input-reference-image"
                        />
                      </label>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Upload a reference image for consistent character/scene appearance across all video clips. This helps maintain visual continuity in multi-clip videos.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>Sora 2 Auto-generates:</strong> Video with synced spatial audio from your script. No separate voice/music selection needed.
                  </p>
                </div>
              </>
            ) : null}

            {videoSettings.videoEngine === "veo" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Aspect Ratio
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
                  <label className="block text-sm font-medium text-foreground">
                    Custom Instructions (Optional)
                  </label>
                  <textarea
                    value={videoSettings.veoCustomInstructions || ''}
                    onChange={(e) => handleSettingsChange("veoCustomInstructions", e.target.value)}
                    placeholder="E.g., cinematic style with dramatic lighting, focus on close-ups, vibrant colors..."
                    className="w-full min-h-[80px] px-3 py-2 text-sm rounded-md border border-input bg-background"
                    disabled={getStepStatus(2) === "disabled"}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Negative Prompt (Optional)
                  </label>
                  <textarea
                    value={videoSettings.veoNegativePrompt || ''}
                    onChange={(e) => handleSettingsChange("veoNegativePrompt", e.target.value)}
                    placeholder="E.g., blurry, low quality, distorted faces, text overlays..."
                    className="w-full min-h-[60px] px-3 py-2 text-sm rounded-md border border-input bg-background"
                    disabled={getStepStatus(2) === "disabled"}
                  />
                  <p className="text-xs text-muted-foreground">
                    Describe what you want to avoid in the video.
                  </p>
                </div>

                {/* Reference Images (up to 3) */}
                <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-foreground">Reference Images (Up to 3)</h4>
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

                {/* Character Consistency Settings for Veo */}
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-foreground">Character Consistency (Optional)</h4>
                    <p className="text-xs text-muted-foreground">Helps maintain consistent appearance</p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">
                      Character Description
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
                      Color Palette (3-5 colors)
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
                </div>

                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                  <p className="text-sm text-green-900 dark:text-green-100">
                    <strong>Veo 3.1 Features:</strong> Native audio generation with dialogue, sound effects, and ambient sounds. Scene extension automatically continues from the last second of each clip for seamless multi-clip videos.
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
