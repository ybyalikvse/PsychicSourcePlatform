import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { portalApiRequest, portalFetch } from "@/lib/portal-api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  Clock,
  DollarSign,
  Send,
  MessageSquare,
  XCircle,
  CheckCircle,
  ArrowLeft,
  Video,
} from "lucide-react";
import PortalUpload from "./portal-upload";
import type { VideoRequest, VideoMessage, Psychic } from "@shared/schema";

interface PortalRequestDetailProps {
  requestId: string;
  psychic: Psychic;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  available: { label: "Available", variant: "outline" },
  claimed: { label: "Claimed", variant: "secondary" },
  submitted: { label: "Submitted", variant: "default" },
  revision_requested: { label: "Revision Needed", variant: "destructive" },
  approved: { label: "Approved", variant: "outline" },
  paid: { label: "Paid", variant: "outline" },
};

export default function PortalRequestDetail({ requestId, psychic }: PortalRequestDetailProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [messageText, setMessageText] = useState("");

  const { data: request, isLoading } = useQuery<VideoRequest>({
    queryKey: ["/api/portal/video-requests", requestId],
    queryFn: async () => {
      const res = await portalFetch(`/api/portal/video-requests/${requestId}`);
      return res.json();
    },
    refetchInterval: 15000,
  });

  const { data: messages } = useQuery<VideoMessage[]>({
    queryKey: ["/api/portal/video-requests", requestId, "messages"],
    queryFn: async () => {
      const res = await portalFetch(`/api/portal/video-requests/${requestId}/messages`);
      return res.json();
    },
    enabled: !!request && request.claimedBy === psychic.id,
    refetchInterval: 15000,
  });

  const claimMutation = useMutation({
    mutationFn: async () => {
      const res = await portalApiRequest("POST", `/api/portal/video-requests/${requestId}/claim`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Request claimed", description: "You have successfully claimed this video request." });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/video-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/my-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/video-requests", requestId] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to claim", description: error.message, variant: "destructive" });
    },
  });

  const releaseMutation = useMutation({
    mutationFn: async () => {
      const res = await portalApiRequest("POST", `/api/portal/video-requests/${requestId}/release`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Request released", description: "The request is now available for others." });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/my-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/video-requests"] });
      setLocation("/portal/requests");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to release", description: error.message, variant: "destructive" });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await portalApiRequest("POST", `/api/portal/video-requests/${requestId}/submit`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Video submitted", description: "Your video has been submitted for review." });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/video-requests", requestId] });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/my-requests"] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to submit", description: error.message, variant: "destructive" });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await portalApiRequest("POST", `/api/portal/video-requests/${requestId}/messages`, {
        senderName: psychic.name,
        message,
      });
      return res.json();
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["/api/portal/video-requests", requestId, "messages"] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to send", description: error.message, variant: "destructive" });
    },
  });

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    sendMessageMutation.mutate(messageText.trim());
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setLocation("/portal/requests")} data-testid="button-back">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Requests
        </Button>
        <p className="text-muted-foreground">Request not found.</p>
      </div>
    );
  }

  const statusInfo = statusConfig[request.status] || { label: request.status, variant: "secondary" as const };
  const isMine = request.claimedBy === psychic.id;
  const canClaim = request.status === "available";
  const canUpload = isMine && (request.status === "claimed" || request.status === "revision_requested");
  const canSubmit = isMine && (request.status === "claimed" || request.status === "revision_requested") && request.videoUrl;
  const canRelease = isMine && request.status === "claimed";
  const canMessage = isMine;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation(isMine ? "/portal/my-requests" : "/portal/requests")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-request-title">{request.title}</h1>
          <p className="text-muted-foreground mt-1" data-testid="text-request-topic">{request.topic}</p>
        </div>
        <Badge variant={statusInfo.variant} className="text-sm" data-testid="badge-request-status">
          {statusInfo.label}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Request Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {request.hook && (
                <div>
                  <span className="text-sm font-medium">Hook</span>
                  <p className="text-sm text-muted-foreground mt-1" data-testid="text-request-hook">{request.hook}</p>
                </div>
              )}
              {request.description && (
                <div>
                  <span className="text-sm font-medium">Description</span>
                  <p className="text-sm text-muted-foreground mt-1" data-testid="text-request-description">{request.description}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-3">
                {request.videoDuration && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span data-testid="text-request-duration">{request.videoDuration}</span>
                  </div>
                )}
                {request.payAmount && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span data-testid="text-request-pay">${request.payAmount}</span>
                  </div>
                )}
                {request.requiredDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span data-testid="text-request-date">Due {new Date(request.requiredDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {canClaim && (
            <Button
              className="w-full"
              size="lg"
              onClick={() => claimMutation.mutate()}
              disabled={claimMutation.isPending}
              data-testid="button-claim"
            >
              <Video className="h-4 w-4 mr-2" />
              {claimMutation.isPending ? "Claiming..." : "Claim This Request"}
            </Button>
          )}

          {canUpload && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Upload Video</CardTitle>
              </CardHeader>
              <CardContent>
                <PortalUpload
                  requestId={request.id}
                  existingUrl={request.videoUrl}
                  onUploadComplete={() => {
                    queryClient.invalidateQueries({ queryKey: ["/api/portal/video-requests", requestId] });
                    queryClient.invalidateQueries({ queryKey: ["/api/portal/my-requests"] });
                  }}
                />
              </CardContent>
            </Card>
          )}

          {canSubmit && (
            <Button
              className="w-full"
              size="lg"
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
              data-testid="button-submit-video"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {submitMutation.isPending ? "Submitting..." : "Submit for Review"}
            </Button>
          )}

          {canRelease && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => releaseMutation.mutate()}
              disabled={releaseMutation.isPending}
              data-testid="button-release"
            >
              <XCircle className="h-4 w-4 mr-2" />
              {releaseMutation.isPending ? "Releasing..." : "Release Request"}
            </Button>
          )}
        </div>

        <div className="space-y-6">
          {isMine && request.status === "approved" && (
            <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Approved</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Your video has been approved.</p>
              </CardContent>
            </Card>
          )}

          {isMine && request.status === "revision_requested" && (
            <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <XCircle className="h-5 w-5" />
                  <span className="font-medium">Revision Requested</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Please check the messages below and re-upload your video.</p>
              </CardContent>
            </Card>
          )}

          {canMessage && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Messages
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 max-h-64 overflow-auto">
                  {messages && messages.length > 0 ? (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`rounded-md p-3 text-sm ${
                          msg.senderType === "psychic"
                            ? "bg-primary/10 ml-4"
                            : "bg-muted mr-4"
                        }`}
                        data-testid={`message-${msg.id}`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-medium text-xs">{msg.senderName}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(msg.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p>{msg.message}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No messages yet.</p>
                  )}
                </div>
                <Separator />
                <div className="flex gap-2">
                  <Textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message..."
                    className="resize-none text-sm"
                    rows={2}
                    data-testid="input-message"
                  />
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || sendMessageMutation.isPending}
                    data-testid="button-send-message"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
