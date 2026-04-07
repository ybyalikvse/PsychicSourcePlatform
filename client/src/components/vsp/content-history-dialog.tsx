import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Eye, Trash2, Video, Hash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { VspContentProject as ContentProject } from "@shared/schema";

interface ContentHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectSelect?: (project: ContentProject) => void;
}

export function ContentHistoryDialog({
  open,
  onOpenChange,
  onProjectSelect
}: ContentHistoryDialogProps) {
  const { toast } = useToast();

  const { data: projects, isLoading, refetch } = useQuery({
    queryKey: ["/api/vsp/projects"],
    enabled: open, // Only fetch when dialog is open
  });

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      case "video_generating": return "bg-blue-100 text-blue-800 border-blue-200";
      case "caption_generated": return "bg-purple-100 text-purple-800 border-purple-200";
      case "script_generated": return "bg-orange-100 text-orange-800 border-orange-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed": return "Completed";
      case "video_generating": return "Video Processing";
      case "caption_generated": return "Caption Ready";
      case "script_generated": return "Script Ready";
      default: return "Draft";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Content History</span>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto max-h-[calc(80vh-80px)] pr-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : projects && Array.isArray(projects) && projects.length > 0 ? (
            <div className="space-y-4">
              {projects.map((project: ContentProject) => (
                <Card key={project.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-lg">{project.subtopic || "Untitled"}</h3>
                          <span className="text-xs text-muted-foreground font-mono">#{project.id?.slice(0, 6) || '???'}</span>
                        </div>
                        <p className="text-sm text-muted-foreground capitalize">
                          {(project.category || "custom").replace("-", " ")}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {(() => {
                          const vs = typeof project.videoSettings === 'string' ? (() => { try { return JSON.parse(project.videoSettings); } catch { return null; } })() : project.videoSettings;
                          const engine = vs?.videoEngine;
                          if (!engine) return null;
                          return (
                            <Badge variant="secondary" className="text-xs">
                              {engine === 'veo' ? 'Veo 3.1' : engine === 'kling' ? 'Kling v3' : engine === 'omnihuman' ? 'OmniHuman' : engine === 'revid' ? 'Revid' : engine}
                            </Badge>
                          );
                        })()}
                        <Badge
                          variant="outline"
                          className={getStatusColor(project.status)}
                          data-testid={`badge-status-${project.id}`}
                        >
                          {getStatusText(project.status)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {project.updatedAt ? formatDate(project.updatedAt) : ''}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Progress indicators */}
                      <div className="flex items-center space-x-4 text-sm">
                        <div className={`flex items-center space-x-1 ${
                          project.script ? "text-green-600" : "text-muted-foreground"
                        }`}>
                          <Eye className="w-4 h-4" />
                          <span>Script</span>
                        </div>
                        <div className={`flex items-center space-x-1 ${
                          project.caption ? "text-green-600" : "text-muted-foreground"
                        }`}>
                          <Hash className="w-4 h-4" />
                          <span>Caption</span>
                        </div>
                        <div className={`flex items-center space-x-1 ${
                          project.videoUrl ? "text-green-600" : "text-muted-foreground"
                        }`}>
                          <Video className="w-4 h-4" />
                          <span>Video</span>
                        </div>
                      </div>

                      {/* Content preview */}
                      {project.script && (
                        <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                          <p className="line-clamp-2">{project.script.content}</p>
                          {project.script.stats && (
                            <div className="flex items-center space-x-4 mt-2 text-xs">
                              <span>{project.script.stats.wordCount} words</span>
                              <span>{project.script.stats.duration}s</span>
                              <span>{project.script.stats.viralScore}/10</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center space-x-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (onProjectSelect) {
                              onProjectSelect(project);
                              onOpenChange(false);
                            }
                          }}
                          data-testid={`button-load-project-${project.id}`}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Load Project
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          data-testid={`button-delete-project-${project.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No content generated yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Start creating scripts to build your content history
              </p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
