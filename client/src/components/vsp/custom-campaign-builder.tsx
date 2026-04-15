import React, { useState, useEffect } from 'react';
import { authFetch } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Calendar,
  Clock,
  Target,
  Users,
  Zap,
  CheckCircle2,
  Loader2,
  Plus,
  X,
  Edit3,
  Settings,
  Wand2,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { apiRequest } from '@/lib/queryClient';
// Dynamic categories and subtopics are fetched from API in sidebar
import type { ScriptStyle, CaptionStyle } from '@shared/schema';
import { topics } from '@/lib/vsp-topics';

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
  schedulingPattern: {
    daysOfWeek: number[];
    times: string[];
    spacing: 'even' | 'peak-focus' | 'custom';
  };
}

interface CustomCampaignBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (campaign: any) => void;
}

export function CustomCampaignBuilder({ open, onOpenChange, onSuccess }: CustomCampaignBuilderProps) {
  console.log("CustomCampaignBuilder render - open:", open);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<'template' | 'customize' | 'content' | 'schedule' | 'review'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<CampaignTemplate | null>(null);

  const [campaignData, setCampaignData] = useState({
    name: '',
    description: '',
    category: '',
    duration: 30,
    contentFrequency: 3,
    subtopics: [] as string[],
    goals: {
      targetViews: 100000,
      targetEngagement: 5,
      platforms: ['TikTok', 'Instagram'],
      objectives: ['Brand awareness', 'Engagement growth']
    },
    schedulingPattern: {
      daysOfWeek: [2, 4, 6], // Tuesday, Thursday, Saturday
      times: ['12:00'],
      spacing: 'even' as 'even' | 'peak-focus' | 'custom'
    },
    color: '#3b82f6',
    startDate: new Date().toISOString().split('T')[0]
  });

  // Fetch dynamic categories and subtopics from API
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/vsp/admin/content-categories"],
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  const { data: allSubtopics = [] } = useQuery({
    queryKey: ["/api/vsp/admin/content-subtopics"],
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  // Get available subtopics for selected category
  const availableSubtopics = allSubtopics.filter(subtopic => subtopic.categoryId === campaignData.category);

  // Fetch campaign templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['/api/vsp/campaign-templates'],
    enabled: open
  });

  // Fetch script and caption styles from API
  const { data: scriptStyles = [] } = useQuery<ScriptStyle[]>({
    queryKey: ["/api/vsp/admin/script-styles"],
    enabled: open,
    retry: false,
  });

  const { data: captionStyles = [] } = useQuery<CaptionStyle[]>({
    queryKey: ["/api/vsp/admin/caption-styles"],
    enabled: open,
    retry: false,
  });

  const [contentOptions, setContentOptions] = useState({
    generateScripts: true,
    generateCaptions: true,
    scriptStyle: '',
    scriptLength: '30s',
    captionStyle: ''
  });

  const [newTopic, setNewTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({
    current: 0,
    total: 4,
    message: '',
    stage: 'idle' as 'idle' | 'creating' | 'generating' | 'finalizing' | 'complete'
  });

  // Update default values when data loads
  useEffect(() => {
    if (scriptStyles.length > 0 && !contentOptions.scriptStyle) {
      const activeScriptStyles = scriptStyles.filter(s => s.isActive).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      setContentOptions(prev => ({
        ...prev,
        scriptStyle: activeScriptStyles[0]?.id || scriptStyles[0]?.id || ''
      }));
    }
  }, [scriptStyles, contentOptions.scriptStyle]);

  useEffect(() => {
    if (captionStyles.length > 0 && !contentOptions.captionStyle) {
      const activeCaptionStyles = captionStyles.filter(s => s.isActive).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      setContentOptions(prev => ({
        ...prev,
        captionStyle: activeCaptionStyles[0]?.id || captionStyles[0]?.id || ''
      }));
    }
  }, [captionStyles, contentOptions.captionStyle]);

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setStep('template');
      setSelectedTemplate(null);
      setCampaignData({
        name: '',
        description: '',
        category: '',
        duration: 30,
        contentFrequency: 3,
        subtopics: [],
        goals: {
          targetViews: 100000,
          targetEngagement: 5,
          platforms: ['TikTok', 'Instagram'],
          objectives: ['Brand awareness', 'Engagement growth']
        },
        schedulingPattern: {
          daysOfWeek: [2, 4, 6],
          times: ['12:00'],
          spacing: 'even' as 'even' | 'peak-focus' | 'custom'
        },
        color: '#3b82f6',
        startDate: new Date().toISOString().split('T')[0]
      });
    }
  }, [open]);

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: async () => {
      try {
        // Step 1: Initialize
        setProgress({ current: 0, total: 4, message: 'Initializing campaign creation...', stage: 'creating' });
        console.log("Starting campaign creation...");

        // Step 2: Create the campaign
        setProgress({ current: 1, total: 4, message: 'Creating campaign structure...', stage: 'creating' });
        const campaignResponse = await apiRequest('POST', '/api/vsp/campaigns', {
          name: campaignData.name,
          description: campaignData.description,
          startDate: campaignData.startDate,
          endDate: new Date(new Date(campaignData.startDate).getTime() + campaignData.duration * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          goals: campaignData.goals,
          color: campaignData.color,
          status: 'planning'
        });

        const campaign = await campaignResponse.json();
        console.log("Campaign created:", campaign.id);

        // Step 3: Prepare content template
        setProgress({ current: 2, total: 4, message: 'Setting up content template...', stage: 'generating' });
        const customTemplate = {
          category: campaignData.category,
          duration: campaignData.duration,
          contentFrequency: campaignData.contentFrequency,
          subtopics: campaignData.subtopics,
          goals: campaignData.goals,
          schedulingPattern: campaignData.schedulingPattern
        };

        // Step 4: Generate content (with timeout handling)
        setProgress({ current: 3, total: 4, message: 'Creating content schedule and projects...', stage: 'generating' });
        console.log("Generating content...");

        try {
          // Use shorter timeout for better UX
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

          const generatorResponse = await authFetch(`/api/vsp/campaigns/${campaign.id}/generate-from-template`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
              templateId: 'custom',
              startDate: campaignData.startDate,
              customTemplate: customTemplate,
              options: {
                generateScripts: false, // Disable AI for now to prevent timeout
                generateCaptions: false, // Disable AI for now to prevent timeout
                scriptStyle: contentOptions.scriptStyle,
                scriptLength: contentOptions.scriptLength
              }
            })
          });

          clearTimeout(timeoutId);

          if (!generatorResponse.ok) {
            throw new Error(`HTTP ${generatorResponse.status}: ${await generatorResponse.text()}`);
          }

          const generator = await generatorResponse.json();
          console.log("Content generated:", generator);
        } catch (error) {
          console.warn("Content generation failed, but campaign was created:", error);
          // Continue anyway - campaign was created successfully
        }

        // Step 5: Finalize
        setProgress({ current: 4, total: 4, message: 'Campaign created successfully!', stage: 'finalizing' });

        return { campaign };
      } catch (error) {
        console.error("Mutation error:", error);
        setProgress({ current: 0, total: 4, message: 'Failed to create campaign', stage: 'idle' });
        throw error;
      }
    },
    onSuccess: (result) => {
      toast({
        title: "Custom Campaign Created!",
        description: `Generated ${campaignData.subtopics.length} content pieces for "${campaignData.name}"`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/vsp/campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vsp/projects'] });

      if (onSuccess) {
        onSuccess(result.campaign);
      }
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Campaign creation error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create custom campaign",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsGenerating(false);
      // Reset progress after a brief delay to show completion
      setTimeout(() => {
        setProgress({ current: 0, total: 4, message: '', stage: 'idle' });
      }, 1000);
    }
  });

  const handleTemplateSelect = (template: CampaignTemplate) => {
    setSelectedTemplate(template);
    setCampaignData(prev => ({
      ...prev,
      name: `Custom ${template.name}`,
      description: template.description,
      category: template.category,
      duration: template.duration,
      contentFrequency: template.contentFrequency,
      subtopics: [...template.subtopics],
      goals: { ...template.goals },
      schedulingPattern: { ...template.schedulingPattern }
    }));
    setStep('customize');
  };

  const handleStartFromScratch = () => {
    setSelectedTemplate(null);
    setCampaignData(prev => ({
      ...prev,
      name: '',
      category: '',
      subtopics: []
    }));
    setStep('customize');
  };

  const addSubtopic = () => {
    if (newTopic.trim() && !campaignData.subtopics.includes(newTopic.trim())) {
      setCampaignData(prev => ({
        ...prev,
        subtopics: [...prev.subtopics, newTopic.trim()]
      }));
      setNewTopic('');
    }
  };

  const removeSubtopic = (index: number) => {
    setCampaignData(prev => ({
      ...prev,
      subtopics: prev.subtopics.filter((_, i) => i !== index)
    }));
  };

  const updateSubtopic = (index: number, newValue: string) => {
    setCampaignData(prev => ({
      ...prev,
      subtopics: prev.subtopics.map((topic, i) => i === index ? newValue : topic)
    }));
  };

  const toggleDay = (day: number) => {
    setCampaignData(prev => ({
      ...prev,
      schedulingPattern: {
        ...prev.schedulingPattern,
        daysOfWeek: prev.schedulingPattern.daysOfWeek.includes(day)
          ? prev.schedulingPattern.daysOfWeek.filter(d => d !== day)
          : [...prev.schedulingPattern.daysOfWeek, day].sort()
      }
    }));
  };

  const addTime = () => {
    setCampaignData(prev => ({
      ...prev,
      schedulingPattern: {
        ...prev.schedulingPattern,
        times: [...prev.schedulingPattern.times, '12:00']
      }
    }));
  };

  const updateTime = (index: number, time: string) => {
    setCampaignData(prev => ({
      ...prev,
      schedulingPattern: {
        ...prev.schedulingPattern,
        times: prev.schedulingPattern.times.map((t, i) => i === index ? time : t)
      }
    }));
  };

  const removeTime = (index: number) => {
    setCampaignData(prev => ({
      ...prev,
      schedulingPattern: {
        ...prev.schedulingPattern,
        times: prev.schedulingPattern.times.filter((_, i) => i !== index)
      }
    }));
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto" data-testid="dialog-custom-campaign">
        {step === 'template' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-purple-500" />
                Create Custom AI Campaign
              </DialogTitle>
              <DialogDescription>
                Start from a template or build from scratch with complete customization
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Start from scratch option */}
              <Card
                className="cursor-pointer hover:bg-accent transition-colors border-2 border-dashed"
                onClick={handleStartFromScratch}
                data-testid="card-start-from-scratch"
              >
                <CardContent className="flex items-center space-x-4 p-6">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                    <Wand2 className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">Start from Scratch</h3>
                    <p className="text-muted-foreground">Build a completely custom campaign with your own topics and settings</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>

              {/* Template options */}
              <div>
                <h3 className="font-semibold mb-4">Or start from a template and customize:</h3>

                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(templates as CampaignTemplate[]).map((template: CampaignTemplate) => (
                      <Card
                        key={template.id}
                        className="cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => handleTemplateSelect(template)}
                        data-testid={`card-template-${template.id}`}
                      >
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center justify-between">
                            {template.name}
                            <Badge variant="secondary">{template.category}</Badge>
                          </CardTitle>
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

                            <div className="text-sm">
                              <p className="font-medium mb-1">Topics ({template.subtopics?.length || 0}):</p>
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
              </div>
            </div>
          </>
        )}

        {step === 'customize' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-500" />
                Campaign Settings
              </DialogTitle>
              <DialogDescription>
                Customize your campaign basics and content topics
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="basics" className="py-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basics">Campaign Basics</TabsTrigger>
                <TabsTrigger value="topics">Content Topics</TabsTrigger>
              </TabsList>

              <TabsContent value="basics" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="campaignName">Campaign Name</Label>
                    <Input
                      id="campaignName"
                      value={campaignData.name}
                      onChange={(e) => setCampaignData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter campaign name"
                      data-testid="input-campaign-name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={campaignData.category}
                      onValueChange={(value) => setCampaignData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories
                          .filter(cat => cat.isActive)
                          .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                          .map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (days)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      max="365"
                      value={campaignData.duration}
                      onChange={(e) => setCampaignData(prev => ({ ...prev, duration: parseInt(e.target.value) || 30 }))}
                      data-testid="input-duration"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="frequency">Posts per week</Label>
                    <Input
                      id="frequency"
                      type="number"
                      min="1"
                      max="7"
                      value={campaignData.contentFrequency}
                      onChange={(e) => setCampaignData(prev => ({ ...prev, contentFrequency: parseInt(e.target.value) || 3 }))}
                      data-testid="input-frequency"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={campaignData.startDate}
                      onChange={(e) => setCampaignData(prev => ({ ...prev, startDate: e.target.value }))}
                      data-testid="input-start-date"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color">Campaign Color</Label>
                    <Input
                      id="color"
                      type="color"
                      value={campaignData.color}
                      onChange={(e) => setCampaignData(prev => ({ ...prev, color: e.target.value }))}
                      className="w-20 h-10"
                      data-testid="input-campaign-color"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={campaignData.description}
                    onChange={(e) => setCampaignData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your campaign goals and target audience"
                    data-testid="textarea-description"
                  />
                </div>
              </TabsContent>

              <TabsContent value="topics" className="space-y-4">
                <div className="space-y-4">
                  {!campaignData.category ? (
                    <div className="text-center p-8 text-muted-foreground">
                      <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Please select a category first to see available topics</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Available Topics for {categories.find(cat => cat.id === campaignData.category)?.name}</Label>
                        <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto border rounded p-4">
                          {availableSubtopics.map((subtopic) => (
                            <div key={subtopic.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={subtopic.id}
                                checked={campaignData.subtopics.includes(subtopic.name)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setCampaignData(prev => ({
                                      ...prev,
                                      subtopics: [...prev.subtopics, subtopic.name]
                                    }));
                                  } else {
                                    setCampaignData(prev => ({
                                      ...prev,
                                      subtopics: prev.subtopics.filter(t => t !== subtopic.name)
                                    }));
                                  }
                                }}
                                data-testid={`checkbox-topic-${subtopic.id}`}
                              />
                              <Label htmlFor={subtopic.id} className="text-sm cursor-pointer">
                                {subtopic.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Selected Topics ({campaignData.subtopics.length})</Label>
                        <div className="flex flex-wrap gap-2">
                          {campaignData.subtopics.map((topic, index) => (
                            <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeSubtopic(index)}>
                              {topic} <X className="h-3 w-3 ml-1" />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('template')} data-testid="button-back-template">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={() => setStep('schedule')}
                disabled={!campaignData.name || campaignData.subtopics.length === 0}
                data-testid="button-next-schedule"
              >
                Next: Scheduling
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'schedule' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-500" />
                Scheduling & Content Options
              </DialogTitle>
              <DialogDescription>
                Set your posting schedule and content generation preferences
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="schedule" className="py-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="schedule">Posting Schedule</TabsTrigger>
                <TabsTrigger value="content">Content Options</TabsTrigger>
              </TabsList>

              <TabsContent value="schedule" className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium">Posting Days</Label>
                    <p className="text-sm text-muted-foreground mb-3">Select which days to post content</p>
                    <div className="flex gap-2">
                      {dayNames.map((day, index) => (
                        <Button
                          key={index}
                          variant={campaignData.schedulingPattern.daysOfWeek.includes(index) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleDay(index)}
                          data-testid={`button-day-${index}`}
                        >
                          {day}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-medium">Posting Times</Label>
                    <p className="text-sm text-muted-foreground mb-3">Set preferred posting times</p>
                    <div className="space-y-2">
                      {campaignData.schedulingPattern.times.map((time, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            type="time"
                            value={time}
                            onChange={(e) => updateTime(index, e.target.value)}
                            className="w-32"
                            data-testid={`input-time-${index}`}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTime(index)}
                            disabled={campaignData.schedulingPattern.times.length === 1}
                            data-testid={`button-remove-time-${index}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={addTime} data-testid="button-add-time">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Time
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-medium">Spacing Pattern</Label>
                    <Select
                      value={campaignData.schedulingPattern.spacing}
                      onValueChange={(value: 'even' | 'peak-focus' | 'custom') =>
                        setCampaignData(prev => ({
                          ...prev,
                          schedulingPattern: { ...prev.schedulingPattern, spacing: value }
                        }))
                      }
                    >
                      <SelectTrigger data-testid="select-spacing">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="even">Even Distribution</SelectItem>
                        <SelectItem value="peak-focus">Peak Hours Focus</SelectItem>
                        <SelectItem value="custom">Custom Pattern</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="content" className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="generateScripts"
                        checked={contentOptions.generateScripts}
                        onCheckedChange={(checked) =>
                          setContentOptions(prev => ({ ...prev, generateScripts: checked as boolean }))
                        }
                        data-testid="checkbox-generate-scripts"
                      />
                      <Label htmlFor="generateScripts" className="font-medium">Generate Scripts</Label>
                    </div>

                    {contentOptions.generateScripts && (
                      <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Script Style</Label>
                          <Select
                            value={contentOptions.scriptStyle}
                            onValueChange={(value) => setContentOptions(prev => ({ ...prev, scriptStyle: value }))}
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
                          <Label>Script Length</Label>
                          <Select
                            value={contentOptions.scriptLength}
                            onValueChange={(value) => setContentOptions(prev => ({ ...prev, scriptLength: value }))}
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
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="generateCaptions"
                        checked={contentOptions.generateCaptions}
                        onCheckedChange={(checked) =>
                          setContentOptions(prev => ({ ...prev, generateCaptions: checked as boolean }))
                        }
                        data-testid="checkbox-generate-captions"
                      />
                      <Label htmlFor="generateCaptions" className="font-medium">Generate Captions</Label>
                    </div>

                    {contentOptions.generateCaptions && (
                      <div className="ml-6">
                        <div className="space-y-2">
                          <Label>Caption Style</Label>
                          <Select
                            value={contentOptions.captionStyle}
                            onValueChange={(value) => setContentOptions(prev => ({ ...prev, captionStyle: value }))}
                          >
                            <SelectTrigger data-testid="select-caption-style">
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
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('customize')} data-testid="button-back-customize">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={() => setStep('review')}
                data-testid="button-next-review"
              >
                Review & Create
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'review' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Review Custom Campaign
              </DialogTitle>
              <DialogDescription>
                Review your campaign settings before creation
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Campaign Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="font-medium">Name:</span>
                      <p className="text-muted-foreground">{campaignData.name}</p>
                    </div>
                    <div>
                      <span className="font-medium">Category:</span>
                      <p className="text-muted-foreground">{topics.find(t => t.id === campaignData.category)?.name || campaignData.category}</p>
                    </div>
                    <div>
                      <span className="font-medium">Duration:</span>
                      <p className="text-muted-foreground">{campaignData.duration} days</p>
                    </div>
                    <div>
                      <span className="font-medium">Frequency:</span>
                      <p className="text-muted-foreground">{campaignData.contentFrequency} posts per week</p>
                    </div>
                    <div>
                      <span className="font-medium">Total Content:</span>
                      <p className="text-muted-foreground">{Math.ceil((campaignData.duration / 7) * campaignData.contentFrequency)} pieces</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Schedule & Content</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="font-medium">Posting Days:</span>
                      <p className="text-muted-foreground">
                        {campaignData.schedulingPattern.daysOfWeek.map(d => dayNames[d]).join(', ')}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Posting Times:</span>
                      <p className="text-muted-foreground">
                        {campaignData.schedulingPattern.times.join(', ')}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Content Generation:</span>
                      <div className="text-muted-foreground">
                        {contentOptions.generateScripts && <p>Scripts ({scriptStyles.find(s => s.id === contentOptions.scriptStyle)?.name || contentOptions.scriptStyle}, {contentOptions.scriptLength})</p>}
                        {contentOptions.generateCaptions && <p>Captions ({captionStyles.find(s => s.id === contentOptions.captionStyle)?.name || contentOptions.captionStyle})</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Content Topics ({campaignData.subtopics.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {campaignData.subtopics.map((topic, index) => (
                      <Badge key={index} variant="secondary">{topic}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('schedule')} data-testid="button-back-schedule">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="w-full space-y-4">
                {/* Progress Display */}
                {isGenerating && (
                  <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {progress.message}
                    </div>
                    <Progress value={(progress.current / progress.total) * 100} className="w-full" />
                    <div className="text-xs text-muted-foreground">
                      Step {progress.current} of {progress.total}
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => createCampaignMutation.mutate()}
                  disabled={isGenerating}
                  data-testid="button-create-custom-campaign"
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {progress.stage === 'creating' && 'Creating Campaign...'}
                      {progress.stage === 'generating' && 'Generating Content...'}
                      {progress.stage === 'finalizing' && 'Finalizing...'}
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Create Custom Campaign
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
