import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, useRoute } from "wouter";
import type { Psychic, VideoRequest } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Plus, Pencil, Trash2, Video, ArrowLeft, Loader2, Eye } from "lucide-react";

const psychicFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  status: z.string().default("active"),
  firebaseUid: z.string().optional().nullable(),
});

type PsychicFormValues = z.infer<typeof psychicFormSchema>;

export default function Psychics() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/psychics/:id");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingPsychic, setEditingPsychic] = useState<Psychic | null>(null);
  const [deletingPsychic, setDeletingPsychic] = useState<Psychic | null>(null);
  const [viewingPsychic, setViewingPsychic] = useState<Psychic | null>(null);

  const { data: psychics = [], isLoading } = useQuery<Psychic[]>({
    queryKey: ["/api/psychics"],
  });

  const { data: allVideoRequests = [] } = useQuery<VideoRequest[]>({
    queryKey: ["/api/video-requests"],
  });

  const { data: psychicVideos = [], isLoading: videosLoading } = useQuery<VideoRequest[]>({
    queryKey: ["/api/psychics", viewingPsychic?.id, "videos"],
    enabled: !!viewingPsychic,
  });

  useEffect(() => {
    if (match && params?.id && psychics.length > 0) {
      const found = psychics.find(p => p.id === params.id);
      if (found) setViewingPsychic(found);
    } else if (!match) {
      setViewingPsychic(null);
    }
  }, [match, params?.id, psychics]);

  const addForm = useForm<PsychicFormValues>({
    resolver: zodResolver(psychicFormSchema),
    defaultValues: { name: "", email: "", status: "active", firebaseUid: "" },
  });

  const editForm = useForm<PsychicFormValues>({
    resolver: zodResolver(psychicFormSchema),
    defaultValues: { name: "", email: "", status: "active", firebaseUid: "" },
  });

  const createMutation = useMutation({
    mutationFn: async (data: PsychicFormValues) => {
      const res = await apiRequest("POST", "/api/psychics", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/psychics"] });
      setAddDialogOpen(false);
      addForm.reset();
      toast({ title: "Psychic added successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to add psychic", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PsychicFormValues }) => {
      const res = await apiRequest("PATCH", `/api/psychics/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/psychics"] });
      setEditingPsychic(null);
      toast({ title: "Psychic updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update psychic", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/psychics/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/psychics"] });
      setDeletingPsychic(null);
      toast({ title: "Psychic deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete psychic", description: error.message, variant: "destructive" });
    },
  });

  function getVideoCount(psychicId: string): number {
    return allVideoRequests.filter((vr) => vr.claimedBy === psychicId).length;
  }

  function openEditDialog(psychic: Psychic) {
    editForm.reset({
      name: psychic.name,
      email: psychic.email,
      status: psychic.status,
      firebaseUid: psychic.firebaseUid || "",
    });
    setEditingPsychic(psychic);
  }

  function getStatusBadge(status: string) {
    if (status === "active") {
      return <Badge variant="outline" className="text-green-600" data-testid={`badge-status-${status}`}>Active</Badge>;
    }
    if (status === "pending") {
      return <Badge variant="outline" className="text-yellow-600" data-testid={`badge-status-${status}`}>Pending</Badge>;
    }
    return <Badge variant="outline" className="text-muted-foreground" data-testid={`badge-status-${status}`}>Inactive</Badge>;
  }

  function getVideoStatusBadge(status: string) {
    const map: Record<string, { label: string; className: string }> = {
      available: { label: "Available", className: "text-blue-600" },
      claimed: { label: "Claimed", className: "text-yellow-600" },
      submitted: { label: "Submitted", className: "text-purple-600" },
      revision_requested: { label: "Revision Requested", className: "text-orange-600" },
      approved: { label: "Approved", className: "text-green-600" },
      paid: { label: "Paid", className: "text-green-700" },
    };
    const config = map[status] || { label: status, className: "" };
    return <Badge variant="outline" className={config.className} data-testid={`badge-video-status-${status}`}>{config.label}</Badge>;
  }

  if (match && !viewingPsychic && !isLoading) {
    return (
      <div className="space-y-6" data-testid="page-psychic-not-found">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/psychics")} data-testid="button-back">
            <ArrowLeft />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Psychic Not Found</h1>
        </div>
        <Card>
          <CardContent className="py-8">
            <p className="text-muted-foreground text-sm text-center">This psychic doesn't exist or has been deleted.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (viewingPsychic) {
    return (
      <div className="space-y-6" data-testid="page-psychic-videos">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/psychics")} data-testid="button-back">
            <ArrowLeft />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="text-psychic-name">{viewingPsychic.name}</h1>
            <p className="text-muted-foreground" data-testid="text-psychic-email">{viewingPsychic.email}</p>
          </div>
          {getStatusBadge(viewingPsychic.status)}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Video History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {videosLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : psychicVideos.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center" data-testid="text-no-videos">
                No videos found for this psychic.
              </p>
            ) : (
              <Table data-testid="table-psychic-videos">
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Topic</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Claimed</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {psychicVideos.map((video) => (
                    <TableRow
                      key={video.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/video-requests/${video.id}`)}
                      data-testid={`row-video-${video.id}`}
                    >
                      <TableCell className="font-medium" data-testid={`text-video-title-${video.id}`}>{video.title}</TableCell>
                      <TableCell data-testid={`text-video-topic-${video.id}`}>{video.topic}</TableCell>
                      <TableCell>{getVideoStatusBadge(video.status)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm" data-testid={`text-video-claimed-${video.id}`}>
                        {video.claimedAt ? new Date(video.claimedAt).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm" data-testid={`text-video-submitted-${video.id}`}>
                        {video.submittedAt ? new Date(video.submittedAt).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); navigate(`/video-requests/${video.id}`); }}
                          data-testid={`button-view-video-${video.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="page-psychics">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-psychics-title">Psychics</h1>
          <p className="text-muted-foreground">Manage psychics for the video portal</p>
        </div>
        <Button onClick={() => { addForm.reset(); setAddDialogOpen(true); }} data-testid="button-add-psychic">
          <Plus className="h-4 w-4 mr-2" />
          Add Psychic
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Psychics
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : psychics.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center" data-testid="text-no-psychics">
              No psychics added yet. Click "Add Psychic" to get started.
            </p>
          ) : (
            <Table data-testid="table-psychics">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Videos</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {psychics.map((psychic) => (
                  <TableRow
                    key={psychic.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/psychics/${psychic.id}`)}
                    data-testid={`row-psychic-${psychic.id}`}
                  >
                    <TableCell className="font-medium" data-testid={`text-psychic-name-${psychic.id}`}>{psychic.name}</TableCell>
                    <TableCell data-testid={`text-psychic-email-${psychic.id}`}>{psychic.email}</TableCell>
                    <TableCell>{getStatusBadge(psychic.status)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" data-testid={`badge-video-count-${psychic.id}`}>
                        {getVideoCount(psychic.id)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm" data-testid={`text-psychic-joined-${psychic.id}`}>
                      {new Date(psychic.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); openEditDialog(psychic); }}
                          data-testid={`button-edit-psychic-${psychic.id}`}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); setDeletingPsychic(psychic); }}
                          data-testid={`button-delete-psychic-${psychic.id}`}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent data-testid="dialog-add-psychic">
          <DialogHeader>
            <DialogTitle>Add Psychic</DialogTitle>
            <DialogDescription>Add a new psychic to the video portal.</DialogDescription>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
              <FormField
                control={addForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter name" {...field} data-testid="input-psychic-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email" {...field} data-testid="input-psychic-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-psychic-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active" data-testid="option-status-active">Active</SelectItem>
                        <SelectItem value="pending" data-testid="option-status-pending">Pending</SelectItem>
                        <SelectItem value="inactive" data-testid="option-status-inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="firebaseUid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Firebase UID (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Auto-linked on first login" {...field} value={field.value || ""} data-testid="input-psychic-firebase-uid" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)} data-testid="button-cancel-add">
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-add">
                  {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Add Psychic
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingPsychic} onOpenChange={(open) => { if (!open) setEditingPsychic(null); }}>
        <DialogContent data-testid="dialog-edit-psychic">
          <DialogHeader>
            <DialogTitle>Edit Psychic</DialogTitle>
            <DialogDescription>Update psychic information.</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit((data) => {
                if (editingPsychic) updateMutation.mutate({ id: editingPsychic.id, data });
              })}
              className="space-y-4"
            >
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter name" {...field} data-testid="input-edit-psychic-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email" {...field} data-testid="input-edit-psychic-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-psychic-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active" data-testid="option-edit-status-active">Active</SelectItem>
                        <SelectItem value="pending" data-testid="option-edit-status-pending">Pending</SelectItem>
                        <SelectItem value="inactive" data-testid="option-edit-status-inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="firebaseUid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Firebase UID</FormLabel>
                    <FormControl>
                      <Input placeholder="Auto-linked on first login" {...field} value={field.value || ""} data-testid="input-edit-psychic-firebase-uid" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingPsychic(null)} data-testid="button-cancel-edit">
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending} data-testid="button-submit-edit">
                  {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingPsychic} onOpenChange={(open) => { if (!open) setDeletingPsychic(null); }}>
        <AlertDialogContent data-testid="dialog-delete-psychic">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Psychic</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingPsychic?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deletingPsychic) deleteMutation.mutate(deletingPsychic.id); }}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
