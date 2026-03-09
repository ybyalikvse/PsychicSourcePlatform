import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { VideoRequest, VideoMessage, VideoCaption, Psychic } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, Video, Send, Loader2, Trash2, Eye, CheckCircle, RotateCw,
  DollarSign, Clock, Copy, Sparkles, ArrowLeft, MessageSquare,
} from "lucide-react";
import { DataState } from "@/components/data-state";

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "available", label: "Available" },
  { value: "claimed", label: "Claimed" },
  { value: "submitted", label: "Submitted" },
  { value: "revision_requested", label: "Revision Requested" },
  { value: "approved", label: "Approved" },
  { value: "paid", label: "Paid" },
];

const PLATFORM_OPTIONS = [
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
  { value: "facebook", label: "Facebook" },
];

function getStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "available": return "outline";
    case "claimed": return "secondary";
    case "submitted": return "default";
    case "revision_requested": return "destructive";
    case "approved": return "default";
    case "paid": return "secondary";
    default: return "outline";
  }
}

function getStatusLabel(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

const createVideoRequestSchema = z.object({
  title: z.string().min(1, "Title is required"),
  topic: z.string().min(1, "Topic is required"),
  hook: z.string().optional().default(""),
  videoDuration: z.string().optional().default(""),
  requiredDate: z.string().optional().default(""),
  payAmount: z.string().optional().default(""),
  description: z.string().optional().default(""),
  status: z.string().optional().default("available"),
});

type CreateVideoRequestForm = z.infer<typeof createVideoRequestSchema>;

export default function VideoRequests() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<VideoRequest | null>(null);
  const [editingRequest, setEditingRequest] = useState<VideoRequest | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [captionPlatform, setCaptionPlatform] = useState("tiktok");

  const { data: requests = [], isLoading } = useQuery<VideoRequest[]>({
    queryKey: ["/api/video-requests"],
  });

  const { data: psychics = [] } = useQuery<Psychic[]>({
    queryKey: ["/api/psychics"],
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<VideoMessage[]>({
    queryKey: ["/api/video-requests", selectedRequest?.id, "messages"],
    queryFn: async () => {
      if (!selectedRequest) return [];
      const res = await fetch(`/api/video-requests/${selectedRequest.id}/messages`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedRequest,
  });

  const { data: captions = [], isLoading: captionsLoading } = useQuery<VideoCaption[]>({
    queryKey: ["/api/video-requests", selectedRequest?.id, "captions"],
    queryFn: async () => {
      if (!selectedRequest) return [];
      const res = await fetch(`/api/video-requests/${selectedRequest.id}/captions`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedRequest,
  });

  const filteredRequests = useMemo(() => {
    if (statusFilter === "all") return requests;
    return requests.filter(r => r.status === statusFilter);
  }, [requests, statusFilter]);

  const form = useForm<CreateVideoRequestForm>({
    resolver: zodResolver(createVideoRequestSchema),
    defaultValues: {
      title: "", topic: "", hook: "", videoDuration: "", requiredDate: "",
      payAmount: "", description: "", status: "available",
    },
  });

  const editForm = useForm<CreateVideoRequestForm>({
    resolver: zodResolver(createVideoRequestSchema),
    defaultValues: {
      title: "", topic: "", hook: "", videoDuration: "", requiredDate: "",
      payAmount: "", description: "", status: "available",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateVideoRequestForm) => {
      const res = await apiRequest("POST", "/api/video-requests", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/video-requests"] });
      setShowCreateDialog(false);
      form.reset();
      toast({ title: "Video request created" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to create request", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateVideoRequestForm> }) => {
      const res = await apiRequest("PATCH", `/api/video-requests/${id}`, data);
      return res.json();
    },
    onSuccess: (updatedRequest) => {
      queryClient.invalidateQueries({ queryKey: ["/api/video-requests"] });
      setEditingRequest(null);
      if (selectedRequest?.id === updatedRequest.id) {
        setSelectedRequest(updatedRequest);
      }
      toast({ title: "Video request updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to update request", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/video-requests/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/video-requests"] });
      setSelectedRequest(null);
      toast({ title: "Video request deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to delete request", description: err.message, variant: "destructive" });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/video-requests/${id}/status`, { status });
      return res.json();
    },
    onSuccess: (updatedRequest) => {
      queryClient.invalidateQueries({ queryKey: ["/api/video-requests"] });
      setSelectedRequest(updatedRequest);
      toast({ title: `Status changed to ${getStatusLabel(updatedRequest.status)}` });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to change status", description: err.message, variant: "destructive" });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ id, message }: { id: string; message: string }) => {
      const res = await apiRequest("POST", `/api/video-requests/${id}/messages`, {
        senderType: "admin",
        senderName: "Admin",
        message,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/video-requests", selectedRequest?.id, "messages"] });
      setNewMessage("");
    },
    onError: (err: Error) => {
      toast({ title: "Failed to send message", description: err.message, variant: "destructive" });
    },
  });

  const generateCaptionsMutation = useMutation({
    mutationFn: async ({ id, platform }: { id: string; platform: string }) => {
      const res = await apiRequest("POST", `/api/video-requests/${id}/generate-captions`, { platform });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/video-requests", selectedRequest?.id, "captions"] });
      toast({ title: "Caption generated" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to generate caption", description: err.message, variant: "destructive" });
    },
  });

  const deleteCaptionMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/video-captions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/video-requests", selectedRequest?.id, "captions"] });
      toast({ title: "Caption deleted" });
    },
  });

  function openEditDialog(req: VideoRequest) {
    setEditingRequest(req);
    editForm.reset({
      title: req.title,
      topic: req.topic,
      hook: req.hook || "",
      videoDuration: req.videoDuration || "",
      requiredDate: req.requiredDate || "",
      payAmount: req.payAmount || "",
      description: req.description || "",
      status: req.status,
    });
  }

  function getPsychicName(psychicId: string | null): string {
    if (!psychicId) return "—";
    const p = psychics.find(p => p.id === psychicId);
    return p ? p.name : psychicId;
  }

  if (selectedRequest) {
    return (
      <div className="space-y-6" data-testid="page-video-request-detail">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedRequest(null)} data-testid="button-back">
            <ArrowLeft />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-request-title">{selectedRequest.title}</h1>
            <p className="text-muted-foreground">{selectedRequest.topic}</p>
          </div>
          <Badge variant={getStatusBadgeVariant(selectedRequest.status)} data-testid="badge-status">
            {getStatusLabel(selectedRequest.status)}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Hook</p>
                    <p className="text-sm" data-testid="text-hook">{selectedRequest.hook || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="text-sm" data-testid="text-duration">{selectedRequest.videoDuration || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Required Date</p>
                    <p className="text-sm" data-testid="text-required-date">{selectedRequest.requiredDate || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pay Amount</p>
                    <p className="text-sm" data-testid="text-pay-amount">{selectedRequest.payAmount ? `$${selectedRequest.payAmount}` : "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Claimed By</p>
                    <p className="text-sm" data-testid="text-claimed-by">{getPsychicName(selectedRequest.claimedBy)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="text-sm" data-testid="text-created">{new Date(selectedRequest.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                {selectedRequest.description && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Description</p>
                      <p className="text-sm" data-testid="text-description">{selectedRequest.description}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {selectedRequest.videoUrl && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Submitted Video</CardTitle>
                </CardHeader>
                <CardContent>
                  <video
                    controls
                    playsInline
                    crossOrigin="anonymous"
                    className="max-w-full max-h-[500px] rounded-md mx-auto"
                    src={selectedRequest.videoUrl}
                    data-testid="video-preview"
                  />
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg">AI Captions</CardTitle>
                  <div className="flex items-center gap-2">
                    <Select value={captionPlatform} onValueChange={setCaptionPlatform}>
                      <SelectTrigger className="w-[140px]" data-testid="select-caption-platform">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PLATFORM_OPTIONS.map(p => (
                          <SelectItem key={p.value} value={p.value} data-testid={`option-platform-${p.value}`}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      onClick={() => generateCaptionsMutation.mutate({ id: selectedRequest.id, platform: captionPlatform })}
                      disabled={generateCaptionsMutation.isPending}
                      data-testid="button-generate-captions"
                    >
                      {generateCaptionsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      Generate
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {captionsLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : captions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6" data-testid="text-no-captions">
                    No captions generated yet. Select a platform and click Generate.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {captions.map(caption => (
                      <Card key={caption.id} data-testid={`card-caption-${caption.id}`}>
                        <CardContent className="pt-4 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <Badge variant="outline">{caption.platform}</Badge>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  navigator.clipboard.writeText(`${caption.caption}\n\n${caption.hashtags}`);
                                  toast({ title: "Caption copied" });
                                }}
                                data-testid={`button-copy-caption-${caption.id}`}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteCaptionMutation.mutate(caption.id)}
                                data-testid={`button-delete-caption-${caption.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm" data-testid={`text-caption-${caption.id}`}>{caption.caption}</p>
                          <p className="text-xs text-muted-foreground" data-testid={`text-hashtags-${caption.id}`}>{caption.hashtags}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {selectedRequest.status === "submitted" && (
                  <>
                    <Button
                      className="w-full"
                      onClick={() => statusMutation.mutate({ id: selectedRequest.id, status: "approved" })}
                      disabled={statusMutation.isPending}
                      data-testid="button-approve"
                    >
                      <CheckCircle className="h-4 w-4" /> Approve
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => statusMutation.mutate({ id: selectedRequest.id, status: "revision_requested" })}
                      disabled={statusMutation.isPending}
                      data-testid="button-request-revision"
                    >
                      <RotateCw className="h-4 w-4" /> Request Revision
                    </Button>
                  </>
                )}
                {selectedRequest.status === "approved" && (
                  <Button
                    className="w-full"
                    onClick={() => statusMutation.mutate({ id: selectedRequest.id, status: "paid" })}
                    disabled={statusMutation.isPending}
                    data-testid="button-mark-paid"
                  >
                    <DollarSign className="h-4 w-4" /> Mark as Paid
                  </Button>
                )}
                {(selectedRequest.status === "claimed" || selectedRequest.status === "revision_requested") && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => statusMutation.mutate({ id: selectedRequest.id, status: "available" })}
                    disabled={statusMutation.isPending}
                    data-testid="button-release"
                  >
                    Release to Available
                  </Button>
                )}
                <Separator />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => openEditDialog(selectedRequest)}
                  data-testid="button-edit-request"
                >
                  Edit Request
                </Button>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this video request?")) {
                      deleteMutation.mutate(selectedRequest.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  data-testid="button-delete-request"
                >
                  <Trash2 className="h-4 w-4" /> Delete Request
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" /> Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] mb-3">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : messages.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6" data-testid="text-no-messages">
                      No messages yet.
                    </p>
                  ) : (
                    <div className="space-y-3 pr-3">
                      {messages.map(msg => (
                        <div
                          key={msg.id}
                          className={`p-3 rounded-md text-sm ${msg.senderType === "admin" ? "bg-primary/10 ml-4" : "bg-muted mr-4"}`}
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
                      ))}
                    </div>
                  )}
                </ScrollArea>
                <div className="flex gap-2">
                  <Textarea
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="resize-none text-sm"
                    rows={2}
                    data-testid="input-message"
                  />
                  <Button
                    size="icon"
                    onClick={() => {
                      if (newMessage.trim() && selectedRequest) {
                        sendMessageMutation.mutate({ id: selectedRequest.id, message: newMessage.trim() });
                      }
                    }}
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                    data-testid="button-send-message"
                  >
                    {sendMessageMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="page-video-requests">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-video-requests-title">Video Requests</h1>
          <p className="text-muted-foreground">Create and manage video requests for psychics</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value} data-testid={`option-status-${opt.value}`}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-request">
            <Plus className="h-4 w-4" /> New Request
          </Button>
        </div>
      </div>

      {isLoading ? (
        <DataState status="loading" title="Loading" message="Fetching video requests..." />
      ) : filteredRequests.length === 0 ? (
        <DataState
          status="empty"
          title="No Video Requests"
          message={statusFilter === "all" ? "Create your first video request to get started." : `No requests with status "${getStatusLabel(statusFilter)}".`}
          actions={statusFilter === "all" ? [{ label: "Create Request", onClick: () => setShowCreateDialog(true) }] : [{ label: "Clear Filter", onClick: () => setStatusFilter("all") }]}
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Topic</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Pay</TableHead>
                <TableHead>Required Date</TableHead>
                <TableHead>Claimed By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map(req => (
                <TableRow key={req.id} data-testid={`row-request-${req.id}`}>
                  <TableCell className="font-medium" data-testid={`text-title-${req.id}`}>{req.title}</TableCell>
                  <TableCell data-testid={`text-topic-${req.id}`}>{req.topic}</TableCell>
                  <TableCell data-testid={`text-duration-${req.id}`}>{req.videoDuration || "—"}</TableCell>
                  <TableCell data-testid={`text-pay-${req.id}`}>{req.payAmount ? `$${req.payAmount}` : "—"}</TableCell>
                  <TableCell data-testid={`text-date-${req.id}`}>{req.requiredDate || "—"}</TableCell>
                  <TableCell data-testid={`text-psychic-${req.id}`}>{getPsychicName(req.claimedBy)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(req.status)} data-testid={`badge-status-${req.id}`}>
                      {getStatusLabel(req.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setSelectedRequest(req)} data-testid={`button-view-${req.id}`}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(req)} data-testid={`button-edit-${req.id}`}>
                        <Video className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("Delete this request?")) deleteMutation.mutate(req.id);
                        }}
                        data-testid={`button-delete-${req.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Video Request</DialogTitle>
            <DialogDescription>Create a new video request for psychics to fulfill.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(data => createMutation.mutate(data))} className="space-y-4">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl><Input {...field} placeholder="Video title" data-testid="input-title" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="topic" render={({ field }) => (
                <FormItem>
                  <FormLabel>Topic</FormLabel>
                  <FormControl><Input {...field} placeholder="Video topic" data-testid="input-topic" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="hook" render={({ field }) => (
                <FormItem>
                  <FormLabel>Hook</FormLabel>
                  <FormControl><Input {...field} placeholder="Video hook / opening line" data-testid="input-hook" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="videoDuration" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger data-testid="select-duration">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30s">30 seconds</SelectItem>
                          <SelectItem value="60s">60 seconds</SelectItem>
                          <SelectItem value="90s">90 seconds</SelectItem>
                          <SelectItem value="2min">2 minutes</SelectItem>
                          <SelectItem value="3min">3 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="payAmount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pay Amount ($)</FormLabel>
                    <FormControl><Input {...field} placeholder="50" type="text" data-testid="input-pay" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="requiredDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Required Date</FormLabel>
                  <FormControl><Input {...field} type="date" data-testid="input-required-date" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea {...field} placeholder="Detailed instructions for the video..." rows={3} data-testid="input-description" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)} data-testid="button-cancel-create">Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-create">
                  {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingRequest} onOpenChange={open => { if (!open) setEditingRequest(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Video Request</DialogTitle>
            <DialogDescription>Update the video request details.</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(data => { if (editingRequest) updateMutation.mutate({ id: editingRequest.id, data }); })} className="space-y-4">
              <FormField control={editForm.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl><Input {...field} data-testid="input-edit-title" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={editForm.control} name="topic" render={({ field }) => (
                <FormItem>
                  <FormLabel>Topic</FormLabel>
                  <FormControl><Input {...field} data-testid="input-edit-topic" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={editForm.control} name="hook" render={({ field }) => (
                <FormItem>
                  <FormLabel>Hook</FormLabel>
                  <FormControl><Input {...field} data-testid="input-edit-hook" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={editForm.control} name="videoDuration" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger data-testid="select-edit-duration">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30s">30 seconds</SelectItem>
                          <SelectItem value="60s">60 seconds</SelectItem>
                          <SelectItem value="90s">90 seconds</SelectItem>
                          <SelectItem value="2min">2 minutes</SelectItem>
                          <SelectItem value="3min">3 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={editForm.control} name="payAmount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pay Amount ($)</FormLabel>
                    <FormControl><Input {...field} type="text" data-testid="input-edit-pay" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={editForm.control} name="requiredDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Required Date</FormLabel>
                  <FormControl><Input {...field} type="date" data-testid="input-edit-required-date" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={editForm.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea {...field} rows={3} data-testid="input-edit-description" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingRequest(null)} data-testid="button-cancel-edit">Cancel</Button>
                <Button type="submit" disabled={updateMutation.isPending} data-testid="button-submit-edit">
                  {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
