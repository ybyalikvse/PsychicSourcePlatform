import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Calendar as CalendarIcon, Plus, Edit, Target, Trash2, Wand2, MessageSquare, Video, Eye, Copy } from 'lucide-react';
import type { ScriptStyle, CaptionStyle, ContentCategory } from '@shared/schema';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { topics } from '@/lib/vsp-topics';

interface DayDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: string | null;
  calendarData: any;
  getEventsForDate: (date: Date) => any;
  onEventEdit: (event: any) => void;
  onEventDelete: (eventId: string) => void;
  onProjectEdit: (project: any) => void;
  onProjectDelete: (projectId: string) => void;
  onAddEvent: () => void;
}

export function DayDetailDialog({
  open,
  onOpenChange,
  selectedDate,
  calendarData,
  getEventsForDate,
  onEventEdit,
  onEventDelete,
  onProjectEdit,
  onProjectDelete,
  onAddEvent
}: DayDetailDialogProps) {
  // ALL hooks must be called before any conditional logic
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: allProjects } = useQuery({
    queryKey: ['/api/vsp/projects']
  });

  const { data: campaignData } = useQuery({
    queryKey: ['/api/vsp/campaigns']
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

  // State for content expansion
  const [expandedContent, setExpandedContent] = useState<string | null>(null);

  // Generation mutations - ALL hooks must be at the top
  const generateScriptMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const defaultStyle = scriptStyles.filter(s => s.isActive).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))[0]?.id || scriptStyles[0]?.id || '';
      return await apiRequest('POST', `/api/vsp/projects/${projectId}/regenerate-script`, {
        style: defaultStyle,
        length: '30s'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vsp/projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vsp/calendar'] });
      toast({ title: "Script Generated", description: "Your script has been generated successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate script", variant: "destructive" });
    }
  });

  const generateCaptionMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const defaultStyle = captionStyles.filter(s => s.isActive).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))[0]?.id || captionStyles[0]?.id || '';
      return await apiRequest('POST', `/api/vsp/generate/caption`, {
        projectId,
        tone: defaultStyle,
        hashtagCount: 10
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vsp/projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vsp/calendar'] });
      toast({ title: "Caption Generated", description: "Your caption has been generated successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate caption", variant: "destructive" });
    }
  });

  const generateVideoMutation = useMutation({
    mutationFn: async (projectId: string) => {
      return await apiRequest('POST', `/api/vsp/generate/video`, {
        projectId,
        style: 'stock-video',
        voice: 'rU18Fk3uSDhmg5Xh41o4'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vsp/projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vsp/calendar'] });
      toast({ title: "Video Generated", description: "Your video is being generated!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate video", variant: "destructive" });
    }
  });

  // Early return AFTER all hooks are called
  if (!selectedDate) return null;

  const date = new Date(selectedDate);
  const dayEvents = getEventsForDate(date);

  // Get campaign data if this day has campaign content
  const campaignId = dayEvents.projects.find((p: any) => p.campaignId)?.campaignId;

  // Get campaign info and all its content
  const campaign = Array.isArray(campaignData) ? campaignData.find((c: any) => c.id === campaignId) : undefined;
  const campaignProjects = Array.isArray(allProjects) ? allProjects.filter((p: any) => p.campaignId === campaignId) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" data-testid="dialog-day-detail">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {date.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={onAddEvent} size="sm" data-testid="button-add-event">
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </div>

          {dayEvents.events.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Events ({dayEvents.events.length})</h3>
              <div className="space-y-2">
                {dayEvents.events.map((event: any) => (
                  <Card key={event.id} className="p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{event.title}</h4>
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                        <Badge variant="secondary" className="mt-1">{event.category}</Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEventEdit(event)}
                          data-testid={`button-edit-event-${event.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEventDelete(event.id)}
                          data-testid={`button-delete-event-${event.id}`}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {dayEvents.projects.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Content Projects ({dayEvents.projects.length})</h3>
              <div className="space-y-2">
                {dayEvents.projects.map((project: any) => {
                  // Get friendly category name
                  const categoryData = topics.find(t => t.id === project.category);
                  const categoryName = categoryData?.name || project.category;

                  // Get user-friendly status
                  const getStatusText = (status: string) => {
                    switch(status) {
                      case 'draft': return 'Ready to generate';
                      case 'script_generated': return 'Script complete';
                      case 'caption_generated': return 'Caption complete';
                      case 'video_generating': return 'Video generating...';
                      case 'completed': return 'All complete';
                      default: return status;
                    }
                  };

                  // Get progress indicators
                  const hasScript = project.script?.content;
                  const hasCaption = project.caption?.text;
                  const hasVideo = project.videoUrl;

                  return (
                    <Card key={project.id} className="p-4 hover:shadow-md transition-shadow">
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-lg">{project.subtopic}</h4>
                          <p className="text-sm text-muted-foreground">{categoryName}</p>
                          {project.campaignId && (
                            <p className="text-xs text-blue-600 mt-1">Part of campaign content</p>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="text-xs">
                              {getStatusText(project.status)}
                            </Badge>

                            <div className="flex items-center gap-3 text-sm">
                              <span className={`flex items-center gap-1 ${hasScript ? 'text-green-600' : 'text-gray-400'}`}>
                                Script {hasScript ? '✓' : ''}
                              </span>
                              <span className={`flex items-center gap-1 ${hasCaption ? 'text-green-600' : 'text-gray-400'}`}>
                                Caption {hasCaption ? '✓' : ''}
                              </span>
                              <span className={`flex items-center gap-1 ${hasVideo ? 'text-green-600' : 'text-gray-400'}`}>
                                Video {hasVideo ? '✓' : ''}
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-1">
                            {/* View buttons for generated content */}
                            {hasScript && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExpandedContent(expandedContent === `script-${project.id}` ? null : `script-${project.id}`)}
                                data-testid={`button-view-script-${project.id}`}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                title="View Script"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            {hasCaption && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExpandedContent(expandedContent === `caption-${project.id}` ? null : `caption-${project.id}`)}
                                data-testid={`button-view-caption-${project.id}`}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                title="View Caption"
                              >
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            )}

                            {/* Generation buttons based on project status */}
                            {!hasScript && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => generateScriptMutation.mutate(project.id)}
                                disabled={generateScriptMutation.isPending}
                                data-testid={`button-generate-script-${project.id}`}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                title="Generate Script"
                              >
                                <Wand2 className="h-4 w-4" />
                              </Button>
                            )}
                            {hasScript && !hasCaption && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => generateCaptionMutation.mutate(project.id)}
                                disabled={generateCaptionMutation.isPending}
                                data-testid={`button-generate-caption-${project.id}`}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                title="Generate Caption"
                              >
                                <Wand2 className="h-4 w-4" />
                              </Button>
                            )}
                            {hasScript && hasCaption && !hasVideo && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => generateVideoMutation.mutate(project.id)}
                                disabled={generateVideoMutation.isPending}
                                data-testid={`button-generate-video-${project.id}`}
                                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                title="Generate Video"
                              >
                                <Wand2 className="h-4 w-4" />
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onProjectEdit(project)}
                              data-testid={`button-edit-project-${project.id}`}
                              title="Edit Project"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onProjectDelete(project.id)}
                              data-testid={`button-delete-project-${project.id}`}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Delete Project"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Expanded content section */}
                        {expandedContent === `script-${project.id}` && hasScript && (
                          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="font-medium text-blue-800">Generated Script</h5>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigator.clipboard.writeText(project.script.content)}
                                className="text-blue-600 hover:text-blue-700"
                                title="Copy Script"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="text-sm text-blue-700 whitespace-pre-wrap">
                              {project.script.content}
                            </div>
                            {project.script.stats && (
                              <div className="mt-3 text-xs text-blue-600 flex gap-4">
                                <span>Words: {project.script.stats.wordCount}</span>
                                <span>Duration: {project.script.stats.duration}s</span>
                                <span>Viral Score: {project.script.stats.viralScore}/10</span>
                              </div>
                            )}
                          </div>
                        )}

                        {expandedContent === `caption-${project.id}` && hasCaption && (
                          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="font-medium text-green-800">Generated Caption</h5>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigator.clipboard.writeText(project.caption.text + '\n\n' + project.caption.hashtags.map((tag: string) => `#${tag}`).join(' '))}
                                className="text-green-600 hover:text-green-700"
                                title="Copy Caption"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="text-sm text-green-700 whitespace-pre-wrap mb-3">
                              {project.caption.text}
                            </div>
                            <div className="text-xs text-green-600 mb-2">
                              <span className="font-medium">Hashtags:</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mb-3">
                              {project.caption.hashtags.map((tag: string, idx: number) => (
                                <span key={idx} className="inline-block bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                            <div className="text-xs text-green-600">
                              Engagement Score: {project.caption.engagementScore}/10
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Campaign Overview Section */}
          {campaignId && campaign && campaignProjects.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-5 w-5 text-blue-600" />
                <h3 className="font-medium text-lg">Campaign Overview: {campaign.name}</h3>
              </div>

              <div className="space-y-3">
                <div className="text-sm text-muted-foreground mb-3">
                  {campaignProjects.length} content pieces scheduled from {campaign.startDate} to {campaign.endDate}
                </div>

                <div className="grid gap-2 max-h-64 overflow-y-auto">
                  {campaignProjects
                    .sort((a: any, b: any) => (a.scheduledDate || '').localeCompare(b.scheduledDate || ''))
                    .map((project: any) => {
                      const categoryData = topics.find(t => t.id === project.category);
                      const categoryName = categoryData?.name || project.category;

                      const isCurrentDay = project.scheduledDate === selectedDate;
                      const hasScript = project.script?.content;
                      const hasCaption = project.caption?.content;
                      const hasVideo = project.videoUrl;

                      return (
                        <div
                          key={project.id}
                          className={`p-3 rounded border ${isCurrentDay ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{project.subtopic}</span>
                                {isCurrentDay && (
                                  <Badge variant="default" className="text-xs">Today's Content</Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {project.scheduledDate} - {categoryName}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-xs">
                              <span className={hasScript ? 'text-green-600' : 'text-gray-400'}>
                                Script {hasScript ? '✓' : ''}
                              </span>
                              <span className={hasCaption ? 'text-green-600' : 'text-gray-400'}>
                                Caption {hasCaption ? '✓' : ''}
                              </span>
                              <span className={hasVideo ? 'text-green-600' : 'text-gray-400'}>
                                Video {hasVideo ? '✓' : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {dayEvents.events.length === 0 && dayEvents.projects.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No events or content scheduled for this day</p>
              <Button onClick={onAddEvent} className="mt-2" data-testid="button-add-first-event">
                Add your first event
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
