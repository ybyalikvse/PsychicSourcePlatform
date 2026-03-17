import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Share2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface SocialAccount {
  id: number;
  platform: string;
  name: string;
  username: string;
}

interface PublishModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
}

export function PublishModal({ open, onClose, projectId }: PublishModalProps) {
  const { toast } = useToast();
  const [selectedAccounts, setSelectedAccounts] = useState<number[]>([]);
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [published, setPublished] = useState(false);

  // Reset state when modal closes
  const handleClose = () => {
    setSelectedAccounts([]);
    setScheduledAt("");
    setPublished(false);
    onClose();
  };

  const { data: accounts, isLoading: loadingAccounts, error: accountsError } = useQuery<SocialAccount[]>({
    queryKey: ["/api/vsp/postbridge/accounts"],
    enabled: open,
  });

  const publishMutation = useMutation({
    mutationFn: async (data: { socialAccountIds: number[]; scheduledAt?: string }) => {
      return await apiRequest("POST", `/api/vsp/projects/${projectId}/publish`, data);
    },
    onSuccess: (data: any) => {
      setPublished(true);
      toast({
        title: "Published successfully!",
        description: data.message || "Your video has been published to social media.",
      });
      setTimeout(() => {
        handleClose();
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: "Publishing failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePublish = () => {
    if (selectedAccounts.length === 0) {
      toast({
        title: "No accounts selected",
        description: "Please select at least one social media account.",
        variant: "destructive",
      });
      return;
    }

    publishMutation.mutate({
      socialAccountIds: selectedAccounts,
      scheduledAt: scheduledAt || undefined,
    });
  };

  const toggleAccount = (accountId: number) => {
    setSelectedAccounts(prev =>
      prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  const platformIcons: Record<string, string> = {
    tiktok: "🎵",
    instagram: "📸",
    youtube: "▶️",
    facebook: "👥",
    twitter: "🐦",
    linkedin: "💼",
    pinterest: "📌",
    threads: "🧵",
    bluesky: "🦋",
  };

  if (published) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Published Successfully!</h3>
            <p className="text-muted-foreground text-center">
              Your video is now live on the selected platforms
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Publish to Social Media</DialogTitle>
          <DialogDescription>
            Select which social media accounts to publish your video to
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {loadingAccounts ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading accounts...</span>
            </div>
          ) : accountsError ? (
            <div className="py-8 text-center">
              <p className="text-destructive mb-4">
                Error loading social accounts
              </p>
              <p className="text-sm text-muted-foreground">
                {accountsError instanceof Error ? accountsError.message : 'Failed to load accounts'}
              </p>
            </div>
          ) : accounts && accounts.length > 0 ? (
            <>
              <div>
                <h4 className="font-medium mb-3">Select Accounts</h4>
                <div className="space-y-3">
                  {accounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        id={`account-${account.id}`}
                        checked={selectedAccounts.includes(account.id)}
                        onCheckedChange={() => toggleAccount(account.id)}
                        data-testid={`checkbox-account-${account.id}`}
                      />
                      <Label
                        htmlFor={`account-${account.id}`}
                        className="flex-1 flex items-center space-x-3 cursor-pointer"
                      >
                        <span className="text-2xl">
                          {platformIcons[account.platform.toLowerCase()] || "📱"}
                        </span>
                        <div className="flex-1">
                          <div className="font-medium capitalize">{account.platform}</div>
                          <div className="text-sm text-muted-foreground">
                            @{account.username} {account.name && `• ${account.name}`}
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Schedule (Optional)</h4>
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full"
                  data-testid="input-schedule-time"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Leave empty to publish immediately
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  {selectedAccounts.length} account{selectedAccounts.length !== 1 ? 's' : ''} selected
                </p>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    disabled={publishMutation.isPending}
                    data-testid="button-cancel-publish"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handlePublish}
                    disabled={publishMutation.isPending || selectedAccounts.length === 0}
                    data-testid="button-confirm-publish"
                  >
                    {publishMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading video...
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4 mr-2" />
                        {scheduledAt ? "Schedule Post" : "Publish Now"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground mb-4">
                No social media accounts connected
              </p>
              <p className="text-sm text-muted-foreground">
                Please connect your social media accounts in Post-Bridge to publish videos
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
