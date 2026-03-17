import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ScriptStyle, CaptionStyle } from '@shared/schema';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, Target, Users, Zap, CheckCircle2, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface CampaignTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  duration: number;
  contentFrequency: number;
  subtopics: string[];
  goals: {
    targetViews: number;
    targetEngagement: number;
    platforms: string[];
    objectives: string[];
  };
}

interface CampaignTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (campaign: any) => void;
}

export function CampaignTemplateDialog({ open, onOpenChange, onSuccess }: CampaignTemplateDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<CampaignTemplate | null>(null);
  const [step, setStep] = useState<'select' | 'configure' | 'generating'>('select');
  const [configuration, setConfiguration] = useState({
    campaignName: '',
    startDate: new Date().toISOString().split('T')[0],
    generateScripts: true,
    generateCaptions: true,
    scriptStyle: '',
    scriptLength: '30s',
    color: '#3b82f6'
  });

  // Fetch campaign templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['/api/vsp/campaign-templates'],
    enabled: open
  });

  // Fetch script styles from API
  const { data: scriptStyles = [] } = useQuery<ScriptStyle[]>({
    queryKey: ["/api/vsp/admin/script-styles"],
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  // Set default style when data loads
  React.useEffect(() => {
    if (scriptStyles.length > 0 && !configuration.scriptStyle) {
      const activeStyles = scriptStyles.filter(s => s.isActive).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      setConfiguration(prev => ({
        ...prev,
        scriptStyle: activeStyles[0]?.id || scriptStyles[0]?.id || ''
      }));
    }
  }, [scriptStyles, configuration.scriptStyle]);

  // Create campaign from template mutation
  const createCampaignMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', `/api/vsp/campaigns/from-template`, {
        templateId: selectedTemplate?.id,
        campaignName: data.campaignName || selectedTemplate?.name,
        startDate: data.startDate,
        customizations: {
          color: data.color
        }
      });
    },
    onSuccess: (result: any) => {
      toast({
        title: "Campaign Created!",
        description: result.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/vsp/campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vsp/projects'] });

      if (onSuccess) {
        onSuccess(result.campaign);
      }

      // If user wants to generate content immediately
      if (configuration.generateScripts || configuration.generateCaptions) {
        setStep('generating');
        generateContentMutation.mutate({
          campaignId: result.campaign.id,
          options: {
            generateScripts: configuration.generateScripts,
            generateCaptions: configuration.generateCaptions,
            scriptStyle: configuration.scriptStyle,
            scriptLength: configuration.scriptLength
          }
        });
      } else {
        resetAndClose();
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create campaign",
        variant: "destructive",
      });
    }
  });

  // Generate content mutation
  const generateContentMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest(`/api/vsp/campaigns/${data.campaignId}/generate-from-template`, 'POST', {
        templateId: selectedTemplate?.id,
        startDate: configuration.startDate,
        options: data.options
      });
    },
    onSuccess: (result: any) => {
      toast({
        title: "Content Generated!",
        description: result.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/vsp/projects'] });
      resetAndClose();
    },
    onError: (error) => {
      toast({
        title: "Generation Error",
        description: error instanceof Error ? error.message : "Failed to generate content",
        variant: "destructive",
      });
      setStep('configure');
    }
  });

  const resetAndClose = () => {
    setStep('select');
    setSelectedTemplate(null);
    setConfiguration({
      campaignName: '',
      startDate: new Date().toISOString().split('T')[0],
      generateScripts: true,
      generateCaptions: true,
      scriptStyle: '',
      scriptLength: '30s',
      color: '#3b82f6'
    });
    onOpenChange(false);
  };

  const handleTemplateSelect = (template: CampaignTemplate) => {
    setSelectedTemplate(template);
    setConfiguration(prev => ({
      ...prev,
      campaignName: template.name
    }));
    setStep('configure');
  };

  const handleCreateCampaign = () => {
    if (!selectedTemplate) return;
    createCampaignMutation.mutate(configuration);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-campaign-template">
        {step === 'select' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Choose Campaign Template
              </DialogTitle>
              <DialogDescription>
                Select a pre-built campaign template to automatically generate content for multiple days
              </DialogDescription>
            </DialogHeader>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                {(templates as CampaignTemplate[]).map((template: CampaignTemplate) => (
                  <Card
                    key={template.id}
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => handleTemplateSelect(template)}
                    data-testid={`card-template-${template.id}`}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {template.duration} days
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {template.contentFrequency}/week
                          </div>
                        </div>

                        <Badge variant="secondary">{template.category}</Badge>

                        <div className="space-y-2">
                          <div className="flex items-center gap-1 text-sm">
                            <Target className="h-4 w-4" />
                            {template.goals?.targetViews?.toLocaleString() || 'N/A'} target views
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <Users className="h-4 w-4" />
                            {template.goals?.platforms?.join(', ') || 'All platforms'}
                          </div>
                        </div>

                        <div className="text-sm">
                          <p className="font-medium mb-1">Content Topics ({template.subtopics?.length || 0}):</p>
                          <p className="text-muted-foreground">
                            {template.subtopics?.slice(0, 3).join(', ') || 'No topics defined'}
                            {(template.subtopics?.length || 0) > 3 && ` +${template.subtopics.length - 3} more`}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {step === 'configure' && selectedTemplate && (
          <>
            <DialogHeader>
              <DialogTitle>Configure Campaign: {selectedTemplate.name}</DialogTitle>
              <DialogDescription>
                Customize your campaign settings and content generation options
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              {/* Campaign Settings */}
              <div className="space-y-4">
                <h3 className="font-semibold">Campaign Settings</h3>

                <div className="space-y-2">
                  <Label htmlFor="campaignName">Campaign Name</Label>
                  <Input
                    id="campaignName"
                    value={configuration.campaignName}
                    onChange={(e) => setConfiguration(prev => ({ ...prev, campaignName: e.target.value }))}
                    placeholder="Enter campaign name"
                    data-testid="input-campaign-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={configuration.startDate}
                    onChange={(e) => setConfiguration(prev => ({ ...prev, startDate: e.target.value }))}
                    data-testid="input-start-date"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Campaign Color</Label>
                  <Input
                    id="color"
                    type="color"
                    value={configuration.color}
                    onChange={(e) => setConfiguration(prev => ({ ...prev, color: e.target.value }))}
                    className="w-20 h-10"
                    data-testid="input-campaign-color"
                  />
                </div>
              </div>

              {/* Content Generation Settings */}
              <div className="space-y-4">
                <h3 className="font-semibold">Content Generation</h3>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="generateScripts"
                      checked={configuration.generateScripts}
                      onCheckedChange={(checked) =>
                        setConfiguration(prev => ({ ...prev, generateScripts: checked as boolean }))
                      }
                      data-testid="checkbox-generate-scripts"
                    />
                    <Label htmlFor="generateScripts">Auto-generate scripts</Label>
                  </div>

                  {configuration.generateScripts && (
                    <div className="ml-6 space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="scriptStyle">Script Style</Label>
                        <Select
                          value={configuration.scriptStyle}
                          onValueChange={(value) => setConfiguration(prev => ({ ...prev, scriptStyle: value }))}
                        >
                          <SelectTrigger data-testid="select-script-style">
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

                      <div className="space-y-2">
                        <Label htmlFor="scriptLength">Script Length</Label>
                        <Select
                          value={configuration.scriptLength}
                          onValueChange={(value) => setConfiguration(prev => ({ ...prev, scriptLength: value }))}
                        >
                          <SelectTrigger data-testid="select-script-length">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15s">15 seconds</SelectItem>
                            <SelectItem value="30s">30 seconds</SelectItem>
                            <SelectItem value="60s">60 seconds</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="generateCaptions"
                      checked={configuration.generateCaptions}
                      onCheckedChange={(checked) =>
                        setConfiguration(prev => ({ ...prev, generateCaptions: checked as boolean }))
                      }
                      data-testid="checkbox-generate-captions"
                    />
                    <Label htmlFor="generateCaptions">Auto-generate captions</Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Template Preview */}
            <div className="border rounded-lg p-4 bg-accent/50">
              <h4 className="font-semibold mb-2">Campaign Preview</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Duration:</span>
                  <p>{selectedTemplate.duration} days</p>
                </div>
                <div>
                  <span className="font-medium">Frequency:</span>
                  <p>{selectedTemplate.contentFrequency} posts/week</p>
                </div>
                <div>
                  <span className="font-medium">Total Content:</span>
                  <p>~{Math.ceil((selectedTemplate.duration / 7) * selectedTemplate.contentFrequency)} pieces</p>
                </div>
                <div>
                  <span className="font-medium">End Date:</span>
                  <p>{new Date(new Date(configuration.startDate).getTime() + selectedTemplate.duration * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setStep('select')}
                data-testid="button-back"
              >
                Back
              </Button>
              <Button
                onClick={handleCreateCampaign}
                disabled={createCampaignMutation.isPending || !configuration.campaignName}
                data-testid="button-create-campaign"
              >
                {createCampaignMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Campaign'
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'generating' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Generating Content...
              </DialogTitle>
              <DialogDescription>
                Creating content for your campaign. This may take a few minutes.
              </DialogDescription>
            </DialogHeader>

            <div className="py-8 text-center">
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">Generating campaign content...</p>
                  <p className="text-sm text-muted-foreground">
                    Creating {Math.ceil((selectedTemplate?.duration || 0 / 7) * (selectedTemplate?.contentFrequency || 0))} content pieces
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
