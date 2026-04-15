import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Edit, Download, RefreshCw, CheckCircle, Clock, Loader2, Save, X, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { apiRequest, authFetch } from "@/lib/queryClient";
import type { VspContentProject as ContentProject } from "@shared/schema";
import { PublishModal } from "./publish-modal";

function getVideoSrc(rawUrl: string | null | undefined): string {
  if (!rawUrl) return '';
  let url = rawUrl;
  // Handle case where videoUrl is a JSON object stored as string: {"key":"...","url":"..."}
  if (url.startsWith('{')) {
    try {
      const parsed = JSON.parse(url);
      if (parsed.key) {
        return `/api/vsp/video-proxy-key?key=${encodeURIComponent(parsed.key)}`;
      }
      url = parsed.url || url;
    } catch {
      // not JSON, use as-is
    }
  }
  if (url.includes('.s3.') && url.includes('.amazonaws.com')) {
    // Extract the full S3 key (path after the bucket hostname), strip query params
    const cleanUrl = url.split('?')[0];
    const match = cleanUrl.match(/\.amazonaws\.com\/(.+)$/);
    const key = match ? match[1] : cleanUrl.split('/').pop() || '';
    return `/api/vsp/video-proxy-key?key=${encodeURIComponent(key)}`;
  }
  // Gemini video URLs need API key appended
  if (url.includes('generativelanguage.googleapis.com')) {
    return `/api/vsp/veo-clip-proxy?uri=${encodeURIComponent(url)}`;
  }
  return url;
}

interface ContentDisplayProps {
  project: ContentProject | null;
  onProjectUpdate?: (project: ContentProject) => void;
}

export function ContentDisplay({ project, onProjectUpdate }: ContentDisplayProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingScript, setEditingScript] = useState(false);
  const [editingCaption, setEditingCaption] = useState(false);
  const [editedScriptContent, setEditedScriptContent] = useState("");
  const [editedCaptionText, setEditedCaptionText] = useState("");
  const [editedHashtags, setEditedHashtags] = useState("");
  const [publishModalOpen, setPublishModalOpen] = useState(false);

  // Poll for video status when video is being generated OR when project is completed (to load full video data)
  const activeEngine = project?.videoSettings?.videoEngine;
  const isKlingMultiShot = activeEngine === 'kling' && project?.videoSettings?.klingMultiShot;
  const activeClips = activeEngine === 'veo' ? project?.videoSettings?.veoClips
    : (activeEngine === 'kling' && !isKlingMultiShot) ? project?.videoSettings?.klingClips
    : undefined;
  const activeStitchingStatus = activeEngine === 'veo' ? project?.videoSettings?.veoStitchingStatus
    : (activeEngine === 'kling' && !isKlingMultiShot) ? project?.videoSettings?.klingStitchingStatus
    : activeEngine === 'kling' ? project?.videoSettings?.klingStatus
    : activeEngine === 'omnihuman' ? project?.videoSettings?.omniStatus
    : undefined;
  const isMultiClip = activeClips && activeClips.length > 0;
  const { data: statusCheck } = useQuery({
    queryKey: ['/api/vsp/projects', project?.id, 'video-status'],
    queryFn: async () => {
      if (!project?.id) return null;
      const response = await authFetch(`/api/vsp/projects/${project.id}/video-status`);
      if (!response.ok) throw new Error('Failed to check video status');
      return response.json();
    },
    enabled: !!project?.id && (
      project?.status === 'video_generating' ||
      project?.status === 'completed'
    ),
    refetchInterval: project?.status === 'video_generating' ? 5000 : false, // Poll only when generating
    retry: 3,
  });

  // Update project when status changes or video is ready
  useEffect(() => {
    if (!statusCheck) return;

    // Get current project from cache to compare
    const cachedProject = queryClient.getQueryData<ContentProject>(["/api/vsp/projects", statusCheck.id]);

    // Only update if status check data is actually different from cached data
    const hasChanges = !cachedProject ||
      cachedProject.status !== statusCheck.status ||
      cachedProject.videoUrl !== statusCheck.videoUrl ||
      JSON.stringify(cachedProject.videoSettings) !== JSON.stringify(statusCheck.videoSettings);

    if (!hasChanges) return;

    // Update the query cache directly for this specific project
    queryClient.setQueryData(["/api/vsp/projects", statusCheck.id], statusCheck);

    // Also update the projects list
    queryClient.setQueryData(["/api/vsp/projects"], (old: ContentProject[] | undefined) => {
      if (!old) return [statusCheck];
      const exists = old.some(p => p.id === statusCheck.id);
      if (exists) {
        return old.map(p => p.id === statusCheck.id ? statusCheck : p);
      } else {
        return [statusCheck, ...old];
      }
    });

    // Always update project state with latest status (for multi-clip progress)
    onProjectUpdate?.(statusCheck);

    // Only show completion toast when video becomes available
    if (statusCheck.videoUrl && !cachedProject?.videoUrl) {
      toast({
        title: "Video Ready!",
        description: "Your video has been successfully created and is ready to preview.",
      });
    }
  }, [statusCheck, onProjectUpdate, queryClient, toast]);

  // Mutation for updating script
  const updateScriptMutation = useMutation({
    mutationFn: async (newContent: string) => {
      if (!project?.id) throw new Error("No project ID");

      const response = await apiRequest("PATCH", `/api/vsp/projects/${project.id}`, {
        script: {
          ...project.script,
          content: newContent
        }
      });
      return response.json();
    },
    onSuccess: (updatedProject: ContentProject) => {
      queryClient.setQueryData(["/api/vsp/projects", updatedProject.id], updatedProject);
      queryClient.setQueryData(["/api/vsp/projects"], (old: ContentProject[] | undefined) => {
        if (!old) return [updatedProject];
        const exists = old.some(p => p.id === updatedProject.id);
        if (exists) {
          return old.map(p => p.id === updatedProject.id ? updatedProject : p);
        } else {
          return [updatedProject, ...old];
        }
      });
      onProjectUpdate?.(updatedProject);
      setEditingScript(false);
      toast({
        title: "Script Updated",
        description: "Your script has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update script. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation for updating caption
  const updateCaptionMutation = useMutation({
    mutationFn: async ({ text, hashtags }: { text: string; hashtags: string[] }) => {
      if (!project?.id) throw new Error("No project ID");

      const response = await apiRequest("PATCH", `/api/vsp/projects/${project.id}`, {
        caption: {
          ...project.caption,
          text,
          hashtags
        }
      });
      return response.json();
    },
    onSuccess: (updatedProject: ContentProject) => {
      queryClient.setQueryData(["/api/vsp/projects", updatedProject.id], updatedProject);
      queryClient.setQueryData(["/api/vsp/projects"], (old: ContentProject[] | undefined) => {
        if (!old) return [updatedProject];
        const exists = old.some(p => p.id === updatedProject.id);
        if (exists) {
          return old.map(p => p.id === updatedProject.id ? updatedProject : p);
        } else {
          return [updatedProject, ...old];
        }
      });
      onProjectUpdate?.(updatedProject);
      setEditingCaption(false);
      toast({
        title: "Caption Updated",
        description: "Your caption has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update caption. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation for regenerating a failed clip
  const regenerateClipMutation = useMutation({
    mutationFn: async (clipNumber: number) => {
      if (!project?.id) throw new Error("No project ID");

      const response = await apiRequest("POST", `/api/vsp/projects/${project.id}/sora-clips/${clipNumber}/regenerate`, {});
      return response.json();
    },
    onSuccess: (updatedProject: ContentProject) => {
      queryClient.setQueryData(["/api/vsp/projects", updatedProject.id], updatedProject);
      queryClient.setQueryData(["/api/vsp/projects"], (old: ContentProject[] | undefined) => {
        if (!old) return [updatedProject];
        const exists = old.some(p => p.id === updatedProject.id);
        if (exists) {
          return old.map(p => p.id === updatedProject.id ? updatedProject : p);
        } else {
          return [updatedProject, ...old];
        }
      });
      onProjectUpdate?.(updatedProject);
      toast({
        title: "Clip Regenerating",
        description: "The clip is being regenerated. This may take a few minutes.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Regeneration Failed",
        description: error.message || "Failed to regenerate clip. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation for manually marking a clip as failed
  const markClipFailedMutation = useMutation({
    mutationFn: async (clipNumber: number) => {
      if (!project?.id) throw new Error("No project ID");

      const response = await apiRequest("POST", `/api/vsp/projects/${project.id}/sora-clips/${clipNumber}/mark-failed`, {});
      return response.json();
    },
    onSuccess: (updatedProject: ContentProject) => {
      queryClient.setQueryData(["/api/vsp/projects", updatedProject.id], updatedProject);
      queryClient.setQueryData(["/api/vsp/projects"], (old: ContentProject[] | undefined) => {
        if (!old) return [updatedProject];
        const exists = old.some(p => p.id === updatedProject.id);
        if (exists) {
          return old.map(p => p.id === updatedProject.id ? updatedProject : p);
        } else {
          return [updatedProject, ...old];
        }
      });
      onProjectUpdate?.(updatedProject);
      toast({
        title: "Clip Marked as Failed",
        description: "You can now regenerate this clip.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Mark Clip",
        description: error.message || "Failed to mark clip as failed. Please try again.",
        variant: "destructive",
      });
    },
  });

  const cancelVideoMutation = useMutation({
    mutationFn: async () => {
      if (!project?.id) throw new Error("No project ID");
      const response = await apiRequest("POST", `/api/vsp/projects/${project.id}/cancel-video`, {});
      return response.json();
    },
    onSuccess: (updatedProject: ContentProject) => {
      queryClient.setQueryData(["/api/vsp/projects", updatedProject.id], updatedProject);
      queryClient.setQueryData(["/api/vsp/projects"], (old: ContentProject[] | undefined) => {
        if (!old) return [updatedProject];
        return old.map(p => p.id === updatedProject.id ? updatedProject : p);
      });
      onProjectUpdate?.(updatedProject);
      toast({ title: "Video Cancelled", description: "Video generation has been cancelled." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to Cancel", description: error.message, variant: "destructive" });
    },
  });

  const resetVideoMutation = useMutation({
    mutationFn: async () => {
      if (!project?.id) throw new Error("No project ID");
      const response = await apiRequest("POST", `/api/vsp/projects/${project.id}/reset-video`, {});
      return response.json();
    },
    onSuccess: (updatedProject: ContentProject) => {
      queryClient.setQueryData(["/api/vsp/projects", updatedProject.id], updatedProject);
      queryClient.setQueryData(["/api/vsp/projects"], (old: ContentProject[] | undefined) => {
        if (!old) return [updatedProject];
        return old.map(p => p.id === updatedProject.id ? updatedProject : p);
      });
      onProjectUpdate?.(updatedProject);
      toast({ title: "Video Reset", description: "You can now regenerate the video with new settings." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to Reset", description: error.message, variant: "destructive" });
    },
  });

  const startEditingScript = () => {
    if (project?.script) {
      setEditedScriptContent(project.script.content);
      setEditingScript(true);
    }
  };

  const startEditingCaption = () => {
    if (project?.caption) {
      setEditedCaptionText(project.caption.text);
      setEditedHashtags(project.caption.hashtags.join(", "));
      setEditingCaption(true);
    }
  };

  const saveScript = () => {
    updateScriptMutation.mutate(editedScriptContent);
  };

  const saveCaption = () => {
    const hashtagsArray = editedHashtags
      .split(",")
      .map(tag => tag.trim().replace(/^#/, ""))
      .filter(tag => tag.length > 0);
    updateCaptionMutation.mutate({ text: editedCaptionText, hashtags: hashtagsArray });
  };

  const cancelEditingScript = () => { setEditingScript(false); setEditedScriptContent(""); };
  const cancelEditingCaption = () => { setEditingCaption(false); setEditedCaptionText(""); setEditedHashtags(""); };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied!", description: `${type} copied to clipboard` });
    } catch (error) {
      toast({ title: "Copy failed", description: "Could not copy to clipboard", variant: "destructive" });
    }
  };

  const downloadVideo = () => {
    const videoUrl = statusCheck?.videoUrl || project?.videoUrl;
    if (videoUrl && project) {
      const link = document.createElement("a");
      link.href = getVideoSrc(videoUrl);
      link.download = `viral-video-${project.id}.mp4`;
      link.click();
    }
  };

  if (!project) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Generated Script
              <Badge variant="secondary">Select a topic</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Edit className="w-8 h-8" />
              </div>
              <p>Select a topic from the sidebar to start generating content</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Generated Caption & Hashtags
              <Badge variant="secondary">Waiting</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Copy className="w-8 h-8" />
              </div>
              <p>Generate a script first to create captions</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Script Display */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Generated Script
              <div className="flex items-center space-x-2">
                {project.script ? <Badge variant="default">Ready</Badge> : <Badge variant="secondary">Not generated</Badge>}
                {project.script && (
                  <>
                    {!editingScript && (
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(project.script!.content, "Script")} data-testid="button-copy-script"><Copy className="w-4 h-4" /></Button>
                    )}
                    {editingScript ? (
                      <>
                        <Button variant="ghost" size="sm" onClick={saveScript} disabled={updateScriptMutation.isPending} data-testid="button-save-script">
                          {updateScriptMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={cancelEditingScript} data-testid="button-cancel-script"><X className="w-4 h-4" /></Button>
                      </>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={startEditingScript} data-testid="button-edit-script"><Edit className="w-4 h-4" /></Button>
                    )}
                  </>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {project.script ? (
              editingScript ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Edit Script Content</label>
                    <Textarea value={editedScriptContent} onChange={(e) => setEditedScriptContent(e.target.value)} rows={10} className="w-full" placeholder="Enter your script content..." data-testid="textarea-edit-script" />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {project.script.sections.map((section, index) => (
                    <div key={index} className="script-line">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-bold">{index + 1}</div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground mb-1 capitalize">{section.type} ({section.timing})</p>
                          <p className="text-foreground font-medium">{section.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!editingScript && (
                    <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium text-sm mb-2">Script Stats</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div><span className="text-muted-foreground">Word Count:</span><span className="font-medium ml-1">{project.script.stats.wordCount}</span></div>
                        <div><span className="text-muted-foreground">Requested:</span><span className="font-medium ml-1">{project.script.stats.duration}s</span></div>
                        <div><span className="text-muted-foreground">Est. Video:</span><span className={`font-medium ml-1 ${Math.round(project.script.stats.wordCount / 2.5) > project.script.stats.duration * 1.3 ? 'text-amber-600' : 'text-green-600'}`}>~{Math.round(project.script.stats.wordCount / 2.5)}s</span></div>
                        <div><span className="text-muted-foreground">Viral Score:</span><span className="font-medium ml-1 text-green-600">{project.script.stats.viralScore}/10</span></div>
                      </div>
                      {Math.round(project.script.stats.wordCount / 2.5) > project.script.stats.duration * 1.3 && (
                        <div className="mt-3 p-2 bg-amber-100 dark:bg-amber-900/30 rounded text-amber-800 dark:text-amber-200 text-xs">
                          Script is longer than requested. Video will be ~{Math.round(project.script.stats.wordCount / 2.5)}s instead of {project.script.stats.duration}s. Consider editing to shorten it.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3"><Edit className="w-6 h-6" /></div>
                <p>Generate a script to see it here</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Caption Display */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Generated Caption & Hashtags
              <div className="flex items-center space-x-2">
                {project.caption ? <Badge>Generated</Badge> : <Badge variant="secondary">Not generated</Badge>}
                {project.caption && (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(`${project.caption!.text}\n\n${project.caption!.hashtags.map(h => `#${h}`).join(" ")}`, "Caption")} data-testid="button-copy-caption"><Copy className="w-4 h-4" /></Button>
                    {editingCaption ? (
                      <>
                        <Button variant="ghost" size="sm" onClick={saveCaption} disabled={updateCaptionMutation.isPending} data-testid="button-save-caption">
                          {updateCaptionMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={cancelEditingCaption} data-testid="button-cancel-caption"><X className="w-4 h-4" /></Button>
                      </>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={startEditingCaption} data-testid="button-edit-caption"><Edit className="w-4 h-4" /></Button>
                    )}
                  </>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {project.caption ? (
              editingCaption ? (
                <div className="space-y-4">
                  <div><label className="text-sm font-medium mb-2 block">Edit Caption Text</label><Textarea value={editedCaptionText} onChange={(e) => setEditedCaptionText(e.target.value)} rows={6} className="w-full" placeholder="Enter your caption text..." data-testid="textarea-edit-caption" /></div>
                  <div><label className="text-sm font-medium mb-2 block">Edit Hashtags (comma-separated)</label><Textarea value={editedHashtags} onChange={(e) => setEditedHashtags(e.target.value)} rows={3} className="w-full" placeholder="hashtag1, hashtag2, hashtag3..." data-testid="textarea-edit-hashtags" /></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div><h4 className="font-medium text-sm mb-2">Caption Text</h4><p className="text-foreground leading-relaxed whitespace-pre-line">{project.caption.text}</p></div>
                  <div><h4 className="font-medium text-sm mb-2">Hashtags</h4><div className="flex flex-wrap gap-2">{project.caption.hashtags.map((hashtag, index) => (<Badge key={index} variant="secondary" className="text-xs">#{hashtag}</Badge>))}</div></div>
                  {!editingCaption && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium text-sm mb-2">Engagement Optimization</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><span className="text-muted-foreground">Question Included:</span><span className="font-medium ml-1 text-green-600">Yes</span></div>
                        <div><span className="text-muted-foreground">CTA Present:</span><span className="font-medium ml-1 text-green-600">Yes</span></div>
                        <div><span className="text-muted-foreground">Hashtags:</span><span className="font-medium ml-1">{project.caption.hashtags.length}/20</span></div>
                        <div><span className="text-muted-foreground">Engagement Score:</span><span className="font-medium ml-1 text-green-600">{project.caption.engagementScore}/10</span></div>
                      </div>
                    </div>
                  )}
                </div>
              )
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3"><Copy className="w-6 h-6" /></div>
                <p>Generate a caption to see it here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Video Generation and Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Video Generation
            <div className="flex items-center space-x-2">
              {project.status === "video_generating" && (<div className="flex items-center space-x-2"><Loader2 className="w-4 h-4 animate-spin text-blue-500" /><span className="text-sm text-muted-foreground">Processing...</span></div>)}
              {(statusCheck?.videoUrl || project.videoUrl) && <Badge>Completed</Badge>}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-4">Video Preview</h4>
              <div className="aspect-[9/16] bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                {(statusCheck?.videoUrl || project.videoUrl) ? (
                  <video src={getVideoSrc(statusCheck?.videoUrl || project.videoUrl)} controls className="w-full h-full object-cover rounded-lg" data-testid="video-preview" />
                ) : project.status === "video_generating" ? (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
                    <p className="text-muted-foreground mb-2">Video is being generated</p>
                    <div className="w-32 h-2 bg-muted rounded-full mx-auto overflow-hidden"><div className="w-1/2 h-full bg-primary rounded-full animate-pulse" /></div>
                    <p className="text-xs text-muted-foreground mt-2">Estimated time: 2-3 minutes</p>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <div className="w-16 h-16 bg-muted-foreground/20 rounded-full flex items-center justify-center mx-auto mb-4"><Clock className="w-8 h-8" /></div>
                    <p>Video will appear here once generated</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              {isMultiClip && (project.status === "video_generating" || project.status === "completed" || project.status === "video_failed") && (
                <div>
                  <h4 className="font-medium mb-4">Multi-Clip Generation Progress</h4>
                  {activeStitchingStatus === 'cancelled' && (
                    <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600 font-medium">All clips failed to generate</p>
                      <p className="text-xs text-red-500 mt-1">Check the error messages below for details</p>
                    </div>
                  )}
                  <div className="space-y-3">
                    {activeClips?.map((clip) => (
                      <div key={clip.clipNumber} className={`flex flex-col p-3 rounded-lg ${clip.status === 'completed' ? 'bg-green-50 border border-green-200' : clip.status === 'generating' ? 'bg-blue-50 border border-blue-200' : clip.status === 'failed' ? 'bg-red-50 border border-red-200' : 'bg-muted border border-border opacity-50'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {clip.status === 'completed' ? <CheckCircle className="w-4 h-4 text-green-500" /> : clip.status === 'generating' ? <Loader2 className="w-4 h-4 text-blue-500 animate-spin" /> : clip.status === 'failed' ? <X className="w-4 h-4 text-red-500" /> : <Clock className="w-4 h-4 text-muted-foreground" />}
                            <div>
                              <div className="text-sm">Clip {clip.clipNumber}</div>
                              <div className="text-xs text-muted-foreground">{clip.duration}s - {clip.scriptSegment.substring(0, 30)}...</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs ${clip.status === 'completed' ? 'text-green-600' : clip.status === 'generating' ? 'text-blue-600' : clip.status === 'failed' ? 'text-red-600' : 'text-muted-foreground'}`}>
                              {clip.status === 'pending' ? 'Pending' : clip.status === 'generating' ? 'Generating' : clip.status === 'completed' ? 'Completed' : 'Failed'}
                            </span>
                            {clip.status === 'generating' && (
                              <Button size="sm" variant="outline" onClick={() => markClipFailedMutation.mutate(clip.clipNumber)} disabled={markClipFailedMutation.isPending} data-testid={`button-mark-failed-clip-${clip.clipNumber}`} className="h-6 px-2 text-xs"><X className="w-3 h-3 mr-1" />Mark as Failed</Button>
                            )}
                            {clip.status === 'failed' && (
                              <Button size="sm" variant="outline" onClick={() => regenerateClipMutation.mutate(clip.clipNumber)} disabled={regenerateClipMutation.isPending || (clip.attempts || 0) >= 3} data-testid={`button-regenerate-clip-${clip.clipNumber}`} className="h-6 px-2 text-xs"><RefreshCw className="w-3 h-3 mr-1" />Regenerate {(clip.attempts || 0) >= 3 ? '(Max)' : `(${clip.attempts || 0}/3)`}</Button>
                            )}
                          </div>
                        </div>
                        {clip.status === 'generating' && typeof clip.progress === 'number' && (<div className="mt-2 pl-7"><Progress value={clip.progress} className="h-1.5" /><div className="text-xs text-muted-foreground mt-1">{clip.progress}%</div></div>)}
                        {clip.error && clip.status === 'failed' && (<div className="mt-2 text-xs text-red-600 pl-7">{clip.error}</div>)}
                        {clip.status === 'completed' && activeEngine === 'veo' && !clip.videoUrl && !clip.videoFileId && (<div className="mt-2 pl-7 text-xs text-green-600">Included in final video via scene extension</div>)}
                        {(clip.videoUrl || clip.videoFileId) && clip.status === 'completed' && (<div className="mt-3 pl-7"><video src={getVideoSrc(clip.videoUrl || clip.videoFileId)} controls className="w-full max-w-xs rounded-lg border border-green-300" data-testid={`video-clip-${clip.clipNumber}`}>Your browser does not support the video tag.</video></div>)}
                      </div>
                    ))}

                    {(() => {
                      const stitchStatus = activeStitchingStatus;
                      if (!stitchStatus) return null;
                      return (
                        <div className={`flex flex-col p-3 rounded-lg ${stitchStatus === 'completed' ? 'bg-green-50 border border-green-200' : stitchStatus === 'stitching' ? 'bg-blue-50 border border-blue-200' : (stitchStatus === 'failed' || stitchStatus === 'cancelled') ? 'bg-red-50 border border-red-200' : 'bg-muted border border-border opacity-50'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {stitchStatus === 'completed' ? <CheckCircle className="w-4 h-4 text-green-500" /> : stitchStatus === 'stitching' ? <Loader2 className="w-4 h-4 text-blue-500 animate-spin" /> : (stitchStatus === 'failed' || stitchStatus === 'cancelled') ? <X className="w-4 h-4 text-red-500" /> : <Clock className="w-4 h-4 text-muted-foreground" />}
                              <span className="text-sm">{activeEngine === 'veo' ? 'Final Video' : 'Video Stitching'}</span>
                            </div>
                            <span className={`text-xs ${stitchStatus === 'completed' ? 'text-green-600' : stitchStatus === 'stitching' ? 'text-blue-600' : (stitchStatus === 'failed' || stitchStatus === 'cancelled') ? 'text-red-600' : 'text-muted-foreground'}`}>
                              {stitchStatus === 'pending' ? 'Pending' : stitchStatus === 'stitching' ? 'In Progress' : stitchStatus === 'completed' ? 'Completed' : stitchStatus === 'cancelled' ? 'Cancelled' : 'Failed'}
                            </span>
                          </div>
                          {stitchStatus === 'stitching' && (<div className="mt-2 pl-7"><Progress value={50} className="h-1.5" /><div className="text-xs text-muted-foreground mt-1">{activeEngine === 'veo' ? 'Downloading final video...' : 'Stitching clips together...'}</div></div>)}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {project.status === "video_generating" && !isMultiClip && project.videoSettings?.videoEngine === 'revid' && (
                <div>
                  <h4 className="font-medium mb-4">Generation Progress</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"><div className="flex items-center space-x-3"><CheckCircle className="w-4 h-4 text-green-500" /><span className="text-sm">Script Analysis</span></div><span className="text-xs text-green-600">Completed</span></div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"><div className="flex items-center space-x-3"><Loader2 className="w-4 h-4 text-blue-500 animate-spin" /><span className="text-sm">Voice Generation</span></div><span className="text-xs text-blue-600">In Progress</span></div>
                    <div className="flex items-center justify-between p-3 bg-muted border border-border rounded-lg opacity-50"><div className="flex items-center space-x-3"><Clock className="w-4 h-4 text-muted-foreground" /><span className="text-sm">Video Assembly</span></div><span className="text-xs text-muted-foreground">Pending</span></div>
                  </div>
                </div>
              )}

              {project.status === "video_generating" && !isMultiClip && project.videoSettings?.videoEngine === 'omnihuman' && (
                <div>
                  <h4 className="font-medium mb-4">OmniHuman Generation Progress</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"><div className="flex items-center space-x-3"><CheckCircle className="w-4 h-4 text-green-500" /><span className="text-sm">Reference Image Uploaded</span></div><span className="text-xs text-green-600">Completed</span></div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"><div className="flex items-center space-x-3"><Loader2 className="w-4 h-4 text-blue-500 animate-spin" /><span className="text-sm">Generating Talking Head Video</span></div><span className="text-xs text-blue-600">In Progress</span></div>
                  </div>
                </div>
              )}

              {project.status === "video_generating" && isKlingMultiShot && (
                <div>
                  <h4 className="font-medium mb-4">Kling Multi-Shot Generation</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                        <div>
                          <span className="text-sm">Generating {project.videoSettings?.klingShots?.length || '?'}-shot video</span>
                          <div className="text-xs text-muted-foreground mt-1">
                            {project.videoSettings?.klingTier === 'standard' ? 'Standard' : 'Pro'} tier
                            {project.videoSettings?.klingEstimatedCost && ` — Est. $${project.videoSettings.klingEstimatedCost}`}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-blue-600">In Progress</span>
                    </div>
                    {project.videoSettings?.klingShots?.map((shot: any) => (
                      <div key={shot.shotNumber} className="p-2 bg-muted/30 rounded text-xs">
                        <span className="font-medium">Shot {shot.shotNumber}</span> ({shot.duration}s): <span className="text-muted-foreground">"{shot.scriptSegment.substring(0, 60)}..."</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {project.status === "video_generating" && !isMultiClip && !isKlingMultiShot && (project.videoSettings?.videoEngine === 'veo') && (
                <div>
                  <h4 className="font-medium mb-4">Generation Progress</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"><div className="flex items-center space-x-3"><Loader2 className="w-4 h-4 text-blue-500 animate-spin" /><span className="text-sm">Generating AI Video (with audio)</span></div><span className="text-xs text-blue-600">In Progress</span></div>
                  </div>
                </div>
              )}

              {project.videoSettings && (
                <div>
                  <h4 className="font-medium mb-4">Video Settings</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Engine:</span><span className="capitalize">{project.videoSettings?.videoEngine || 'revid'}</span></div>
                    {project.videoSettings?.videoEngine === 'revid' && (
                      <>
                        {project.videoSettings.format && <div className="flex justify-between"><span className="text-muted-foreground">Format:</span><span>{project.videoSettings.format}</span></div>}
                        <div className="flex justify-between"><span className="text-muted-foreground">Resolution:</span><span>1080x1920</span></div>
                        {project.videoSettings.length && <div className="flex justify-between"><span className="text-muted-foreground">Duration:</span><span>{project.videoSettings.length} seconds</span></div>}
                        {project.videoSettings.voice && (<div className="flex justify-between"><span className="text-muted-foreground">Voice:</span><span>{project.videoSettings.voice.replace("-", " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}</span></div>)}
                        {project.videoSettings.style && (<div className="flex justify-between"><span className="text-muted-foreground">Style:</span><span>{project.videoSettings.style.replace("-", " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}</span></div>)}
                      </>
                    )}
                    {project.videoSettings?.videoEngine === 'veo' && (
                      <>
                        <div className="flex justify-between"><span className="text-muted-foreground">Resolution:</span><span>{project.videoSettings.veoResolution || '720p'}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Aspect Ratio:</span><span>{project.videoSettings.veoAspectRatio || '9:16'}</span></div>
                      </>
                    )}
                    {project.videoSettings?.videoEngine === 'kling' && (
                      <>
                        <div className="flex justify-between"><span className="text-muted-foreground">Aspect Ratio:</span><span>{project.videoSettings.klingAspectRatio || '9:16'}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Clip Duration:</span><span>{project.videoSettings.klingDuration || '10'}s</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Element Binding:</span><span>{project.videoSettings.klingElementBinding ? 'On' : 'Off'}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Clips:</span><span>{project.videoSettings.klingClips?.length || 0}</span></div>
                      </>
                    )}
                    {project.videoSettings?.videoEngine === 'omnihuman' && (
                      <>
                        <div className="flex justify-between"><span className="text-muted-foreground">Resolution:</span><span>{project.videoSettings.omniResolution || '1080p'}</span></div>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-col space-y-3">
                {project.status === "video_generating" && (
                  <Button variant="destructive" size="sm" onClick={() => cancelVideoMutation.mutate()} disabled={cancelVideoMutation.isPending} data-testid="button-cancel-video">
                    <X className="w-4 h-4 mr-2" />{cancelVideoMutation.isPending ? 'Cancelling...' : 'Cancel Generation'}
                  </Button>
                )}
                {project.status === "video_failed" && (
                  <Button variant="outline" size="sm" onClick={() => resetVideoMutation.mutate()} disabled={resetVideoMutation.isPending} data-testid="button-reset-video">
                    <RefreshCw className="w-4 h-4 mr-2" />{resetVideoMutation.isPending ? 'Resetting...' : 'Reset & Try Again'}
                  </Button>
                )}
                <div className="flex space-x-3">
                  <Button className="flex-1" onClick={downloadVideo} disabled={!(statusCheck?.videoUrl || project.videoUrl)} data-testid="button-download-video"><Download className="w-4 h-4 mr-2" />Download Video</Button>
                  <Button variant="outline" size="icon" disabled={!(statusCheck?.videoUrl || project.videoUrl)} data-testid="button-refresh-video"><RefreshCw className="w-4 h-4" /></Button>
                </div>
                <Button className="w-full" variant="default" onClick={() => setPublishModalOpen(true)} disabled={!(statusCheck?.videoUrl || project.videoUrl)} data-testid="button-publish-video"><Share2 className="w-4 h-4 mr-2" />Publish to Social Media</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {project && (
        <PublishModal open={publishModalOpen} onClose={() => setPublishModalOpen(false)} projectId={project.id} />
      )}
    </div>
  );
}
