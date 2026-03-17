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

    try {
      const user = auth.currentUser;
      const idToken = user ? await user.getIdToken() : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (idToken) headers["Authorization"] = `Bearer ${idToken}`;

      // Step 1: Get presigned URL from our API
      const presignRes = await fetch(`/api/portal/video-requests/${requestId}/presign-upload`, {
        method: "POST",
        headers,
        body: JSON.stringify({ filename: file.name, contentType: file.type || "video/mp4" }),
      });

      if (!presignRes.ok) {
        const err = await presignRes.json();
        throw new Error(err.error || "Failed to get upload URL");
      }

      const { presignedUrl, s3Key } = await presignRes.json();
      setProgress(10);

      // Step 2: Upload directly to S3 using presigned URL
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            setProgress(10 + Math.round((e.loaded / e.total) * 80));
          }
        });
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error("Upload to storage failed"));
          }
        });
        xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
        xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));

        xhr.open("PUT", presignedUrl);
        xhr.setRequestHeader("Content-Type", file.type || "video/mp4");
        xhr.send(file);
      });

      setProgress(90);

      // Step 3: Confirm upload with our API
      const confirmRes = await fetch(`/api/portal/video-requests/${requestId}/confirm-upload`, {
        method: "POST",
        headers,
        body: JSON.stringify({ s3Key }),
      });

      if (!confirmRes.ok) {
        const err = await confirmRes.json();
        throw new Error(err.error || "Failed to confirm upload");
      }

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
            controls
            playsInline
            preload="metadata"
            className="max-w-full max-h-[400px] rounded-md mx-auto"
            data-testid="video-preview"
          >
            <source src={existingUrl} type="video/mp4" />
          </video>
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
