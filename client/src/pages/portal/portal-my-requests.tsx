import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DataState } from "@/components/data-state";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, DollarSign, Send, MessageSquare, XCircle, CheckCircle } from "lucide-react";
import PortalUpload from "./portal-upload";
import type { VideoRequest, VideoMessage, Psychic } from "@shared/schema";

interface PortalMyRequestsProps {
  psychic: Psychic;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  claimed: { label: "Claimed", variant: "secondary" },
  submitted: { label: "Submitted", variant: "default" },
  revision_requested: { label: "Revision Needed", variant: "destructive" },
  approved: { label: "Approved", variant: "outline" },
  paid: { label: "Paid", variant: "outline" },
};

export default function PortalMyRequests({ psychic }: PortalMyRequestsProps) {
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<VideoRequest | null>(null);
  const [messageText, setMessageText] = useState("");

  const { data: requests, isLoading } = useQuery<VideoRequest[]>({
    queryKey: ["/api/portal/my-requests", `?psychicId=${psychic.id}`],
  });

  const { data: messages } = useQuery<VideoMessage[]>({
    queryKey: ["/api/portal/video-requests", selectedRequest?.id, "messages"],
    enabled: !!selectedRequest,
  });

  const releaseMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const res = await apiRequest("POST", `/api/portal/video-requests/${requestId}/release`, {
        psychicId: psychic.id,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Request released", description: "The request is now available for others." });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/my-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/video-requests"] });
      setSelectedRequest(null);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to release", description: error.message, variant: "destructive" });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const res = await apiRequest("POST", `/api/portal/video-requests/${requestId}/submit`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Video submitted", description: "Your video has been submitted for review." });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/my-requests"] });
      setSelectedRequest(null);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to submit", description: error.message, variant: "destructive" });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ requestId, message }: { requestId: string; message: string }) => {
      const res = await apiRequest("POST", `/api/portal/video-requests/${requestId}/messages`, {
        senderType: "psychic",
        senderName: psychic.name,
        message,
      });
      return res.json();
    },
    onSuccess: () => {
      setMessageText("");
      if (selectedRequest) {
        queryClient.invalidateQueries({ queryKey: ["/api/portal/video-requests", selectedRequest.id, "messages"] });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Failed to send", description: error.message, variant: "destructive" });
    },
  });

  const handleSendMessage = () => {
    if (!selectedRequest || !messageText.trim()) return;
    sendMessageMutation.mutate({ requestId: selectedRequest.id, message: messageText.trim() });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">My Requests</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold" data-testid="text-page-title">My Requests</h1>
      {!requests || requests.length === 0 ? (
        <DataState
          status="empty"
          title="No Claimed Requests"
          message="You haven't claimed any video requests yet. Browse available requests to get started."
          actions={[{ label: "Browse Requests", href: "/portal/requests" }]}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {requests.map((req) => {
            const statusInfo = statusConfig[req.status] || { label: req.status, variant: "secondary" as const };
            return (
              <Card key={req.id} data-testid={`card-my-request-${req.id}`}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base" data-testid={`text-my-request-title-${req.id}`}>
                      {req.title}
                    </CardTitle>
                    <Badge variant={statusInfo.variant} data-testid={`badge-status-${req.id}`}>
                      {statusInfo.label}
                    </Badge>
                  </div>
                  <CardDescription>{req.topic}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {req.description && (
                    <p className="text-sm text-muted-foreground">{req.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {req.videoDuration && (
                      <Badge variant="outline" className="no-default-active-elevate">
                        <Clock className="h-3 w-3 mr-1" />
                        {req.videoDuration}
                      </Badge>
                    )}
                    {req.payAmount && (
                      <Badge variant="outline" className="no-default-active-elevate">
                        <DollarSign className="h-3 w-3 mr-1" />
                        ${req.payAmount}
                      </Badge>
                    )}
                    {req.requiredDate && (
                      <Badge variant="outline" className="no-default-active-elevate">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(req.requiredDate).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedRequest(req)}
                    data-testid={`button-details-${req.id}`}
                  >
                    View Details
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        {selectedRequest && (
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle data-testid="text-detail-title">{selectedRequest.title}</DialogTitle>
              <DialogDescription>{selectedRequest.topic}</DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge variant={statusConfig[selectedRequest.status]?.variant || "secondary"} data-testid="badge-detail-status">
                      {statusConfig[selectedRequest.status]?.label || selectedRequest.status}
                    </Badge>
                  </div>
                  {selectedRequest.hook && (
                    <div>
                      <span className="text-sm font-medium">Hook:</span>
                      <p className="text-sm text-muted-foreground">{selectedRequest.hook}</p>
                    </div>
                  )}
                  {selectedRequest.description && (
                    <div>
                      <span className="text-sm font-medium">Description:</span>
                      <p className="text-sm text-muted-foreground">{selectedRequest.description}</p>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {selectedRequest.videoDuration && (
                      <Badge variant="outline" className="no-default-active-elevate">
                        <Clock className="h-3 w-3 mr-1" />
                        {selectedRequest.videoDuration}
                      </Badge>
                    )}
                    {selectedRequest.payAmount && (
                      <Badge variant="outline" className="no-default-active-elevate">
                        <DollarSign className="h-3 w-3 mr-1" />
                        ${selectedRequest.payAmount}
                      </Badge>
                    )}
                    {selectedRequest.requiredDate && (
                      <Badge variant="outline" className="no-default-active-elevate">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(selectedRequest.requiredDate).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>
                </div>

                {(selectedRequest.status === "claimed" || selectedRequest.status === "revision_requested") && (
                  <div className="space-y-3 border-t pt-4">
                    <h3 className="text-sm font-medium">Upload Video</h3>
                    <PortalUpload
                      requestId={selectedRequest.id}
                      existingUrl={selectedRequest.videoUrl}
                      onUploadComplete={() => {
                        queryClient.invalidateQueries({ queryKey: ["/api/portal/my-requests"] });
                      }}
                    />
                  </div>
                )}

                {(selectedRequest.status === "claimed" || selectedRequest.status === "revision_requested") && selectedRequest.videoUrl && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => submitMutation.mutate(selectedRequest.id)}
                      disabled={submitMutation.isPending}
                      data-testid="button-submit-video"
                    >
                      <CheckCircle className="h-4 w-4" />
                      {submitMutation.isPending ? "Submitting..." : "Submit for Review"}
                    </Button>
                  </div>
                )}

                {selectedRequest.status === "claimed" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => releaseMutation.mutate(selectedRequest.id)}
                    disabled={releaseMutation.isPending}
                    data-testid="button-release-request"
                  >
                    <XCircle className="h-4 w-4" />
                    {releaseMutation.isPending ? "Releasing..." : "Release Request"}
                  </Button>
                )}

                <div className="space-y-3 border-t pt-4">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Messages
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-auto">
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
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
