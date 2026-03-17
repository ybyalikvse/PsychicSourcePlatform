import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Bot, Zap, CheckCircle2, Loader2, FileText, Hash, Video } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import type { Campaign, ScriptStyle, CaptionStyle } from '@shared/schema';

interface BulkGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: Campaign | null;
}

export function BulkGenerationDialog({ open, onOpenChange, campaign }: BulkGenerationDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [generationType, setGenerationType] = useState<'scripts' | 'captions' | 'both'>('both');
  // Fetch script and caption styles from API
  const { data: scriptStyles = [] } = useQuery<ScriptStyle[]>({
    queryKey: ["/api/vsp/admin/script-styles"],
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  const [scriptOptions, setScriptOptions] = useState({
    style: '',
    length: '30s'
  });

  // Set default style when data loads
  React.useEffect(() => {
    if (scriptStyles.length > 0 && !scriptOptions.style) {
      const activeStyles = scriptStyles.filter(s => s.isActive).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      setScriptOptions(prev => ({
        ...prev,
        style: activeStyles[0]?.id || scriptStyles[0]?.id || ''
      }));
    }
  }, [scriptStyles, scriptOptions.style]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Bulk generate scripts mutation
  const generateScriptsMutation = useMutation({
    mutationFn: async () => {
      if (!campaign) throw new Error('No campaign selected');
      return await apiRequest('POST', `/api/vsp/campaigns/${campaign.id}/bulk-generate-scripts`, scriptOptions);
    },
    onSuccess: (result: any) => {
      toast({
        title: "Scripts Generated!",
        description: result.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/vsp/projects'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate scripts",
        variant: "destructive",
      });
    }
  });

  // Bulk generate captions mutation
  const generateCaptionsMutation = useMutation({
    mutationFn: async () => {
      if (!campaign) throw new Error('No campaign selected');
      return await apiRequest('POST', `/api/vsp/campaigns/${campaign.id}/bulk-generate-captions`, {});
    },
    onSuccess: (result: any) => {
      toast({
        title: "Captions Generated!",
        description: result.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/vsp/projects'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate captions",
        variant: "destructive",
      });
    }
  });

  const handleGenerate = async () => {
    if (!campaign) return;

    setIsGenerating(true);

    try {
      if (generationType === 'scripts' || generationType === 'both') {
        await generateScriptsMutation.mutateAsync();
      }

      if (generationType === 'captions' || generationType === 'both') {
        await generateCaptionsMutation.mutateAsync();
      }

      toast({
        title: "Generation Complete!",
        description: "All content has been generated successfully.",
      });

      onOpenChange(false);
    } catch (error) {
      // Individual mutations already handle their own errors
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" data-testid="dialog-bulk-generation">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-500" />
            Bulk Generate Content
          </DialogTitle>
          <DialogDescription>
            Generate scripts and captions for all content in "{campaign?.name}" campaign
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Generation Type Selection */}
          <div className="space-y-4">
            <h3 className="font-semibold">What would you like to generate?</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Card
                className={`cursor-pointer transition-colors ${generationType === 'scripts' ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-accent'}`}
                onClick={() => setGenerationType('scripts')}
                data-testid="card-generate-scripts"
              >
                <CardContent className="flex items-center space-x-3 p-4">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div>
                    <h4 className="font-medium">Scripts Only</h4>
                    <p className="text-sm text-muted-foreground">Generate viral scripts</p>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-colors ${generationType === 'captions' ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-accent'}`}
                onClick={() => setGenerationType('captions')}
                data-testid="card-generate-captions"
              >
                <CardContent className="flex items-center space-x-3 p-4">
                  <Hash className="h-8 w-8 text-green-500" />
                  <div>
                    <h4 className="font-medium">Captions Only</h4>
                    <p className="text-sm text-muted-foreground">Generate captions with hashtags</p>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-colors ${generationType === 'both' ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-accent'}`}
                onClick={() => setGenerationType('both')}
                data-testid="card-generate-both"
              >
                <CardContent className="flex items-center space-x-3 p-4">
                  <Zap className="h-8 w-8 text-purple-500" />
                  <div>
                    <h4 className="font-medium">Both</h4>
                    <p className="text-sm text-muted-foreground">Complete content package</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Script Options */}
          {(generationType === 'scripts' || generationType === 'both') && (
            <div className="space-y-4 border rounded-lg p-4 bg-accent/50">
              <h4 className="font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Script Generation Options
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scriptStyle">Script Style</Label>
                  <Select
                    value={scriptOptions.style}
                    onValueChange={(value) => setScriptOptions(prev => ({ ...prev, style: value }))}
                  >
                    <SelectTrigger data-testid="select-bulk-script-style">
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
                    value={scriptOptions.length}
                    onValueChange={(value) => setScriptOptions(prev => ({ ...prev, length: value }))}
                  >
                    <SelectTrigger data-testid="select-bulk-script-length">
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
            </div>
          )}

          {/* Generation Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Bot className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-medium text-blue-900 dark:text-blue-100">AI Generation Process</h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>Analyzes your campaign content for optimal generation</li>
                  <li>Generates content for all scheduled items</li>
                  <li>Applies your style preferences consistently</li>
                  <li>Process may take 2-5 minutes depending on content volume</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isGenerating}
            data-testid="button-cancel-bulk"
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            data-testid="button-start-bulk-generation"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Start Generation
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
