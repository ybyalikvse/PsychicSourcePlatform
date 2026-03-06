import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, CheckCircle, AlertCircle, Film } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";

interface PortalUploadProps {
  requestId: string;
  existingUrl?: string | null;
  onUploadComplete: () => void;
}

export default function PortalUpload({ requestId, existingUrl, onUploadComplete }: PortalUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploaded, setUploaded] = useState(!!existingUrl);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUpload = async (file: File) => {
    setUploading(true);
    setProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append("video", file);

    try {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      const user = auth.currentUser;
      let idToken: string | null = null;
      if (user) {
        idToken = await user.getIdToken();
      }

      await new Promise<void>((resolve, reject) => {
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            try {
              const resp = JSON.parse(xhr.responseText);
              reject(new Error(resp.error || "Upload failed"));
            } catch {
              reject(new Error("Upload failed"));
            }
          }
        });
        xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
        xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));

        xhr.open("POST", `/api/portal/video-requests/${requestId}/upload`);
        if (idToken) {
          xhr.setRequestHeader("Authorization", `Bearer ${idToken}`);
        }
        xhr.send(formData);
      });

      setUploaded(true);
      setProgress(100);
      toast({ title: "Video uploaded", description: "Your video has been uploaded successfully." });
      onUploadComplete();
    } catch (err: any) {
      setError(err.message || "Upload failed");
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFileSelect}
        data-testid="input-video-file"
      />

      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-muted-foreground">Uploading video...</span>
            <span data-testid="text-upload-progress">{progress}%</span>
          </div>
          <Progress value={progress} data-testid="progress-upload" />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive" data-testid="text-upload-error">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {uploaded && !uploading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground" data-testid="text-upload-success">
          <CheckCircle className="h-4 w-4 text-green-600" />
          Video uploaded
        </div>
      )}

      {existingUrl && (
        <div className="rounded-md border bg-muted/50 p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Film className="h-4 w-4" />
            Current video
          </div>
          <video
            src={existingUrl}
            controls
            className="w-full max-h-48 rounded-md"
            data-testid="video-preview"
          />
        </div>
      )}

      <Button
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="w-full"
        data-testid="button-upload-video"
      >
        <Upload className="h-4 w-4" />
        {uploaded ? "Replace Video" : "Upload Video"}
      </Button>
    </div>
  );
}
