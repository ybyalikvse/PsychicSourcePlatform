import type { Express, Request, Response } from "express";
import { openai } from "./client";

export function registerImageRoutes(app: Express): void {
  app.post("/api/generate-image", async (req: Request, res: Response) => {
    try {
      const { prompt, size = "1024x1024" } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const response = await openai.images.generate({
        model: "gpt-image-1",
        prompt,
        n: 1,
        size: size as "1024x1024" | "512x512" | "256x256",
      });

      const imageData = response.data[0];
      
      // Check if S3 is configured and upload if so
      const s3Configured = !!(process.env.AWS_S3_BUCKET && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
      
      if (s3Configured && imageData.b64_json) {
        try {
          const { uploadImageToS3 } = await import("../../s3");
          const s3Url = await uploadImageToS3(imageData.b64_json, undefined, "image/png");
          console.log("[Generate Image] Uploaded to S3:", s3Url);
          return res.json({
            url: s3Url,
            imageUrl: s3Url,
            storage: "s3",
          });
        } catch (s3Error) {
          console.error("[Generate Image] S3 upload failed:", s3Error);
        }
      }
      
      res.json({
        url: imageData.url,
        b64_json: imageData.b64_json,
        storage: "base64",
      });
    } catch (error) {
      console.error("Error generating image:", error);
      res.status(500).json({ error: "Failed to generate image" });
    }
  });
}

