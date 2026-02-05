import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || "";

export async function uploadImageToS3(
  imageData: string | Buffer,
  filename?: string,
  contentType: string = "image/png"
): Promise<string> {
  if (!BUCKET_NAME) {
    throw new Error("AWS_S3_BUCKET environment variable is not set");
  }

  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error("AWS credentials are not configured");
  }

  let buffer: Buffer;
  
  if (typeof imageData === "string") {
    if (imageData.startsWith("data:")) {
      const base64Data = imageData.split(",")[1];
      buffer = Buffer.from(base64Data, "base64");
    } else {
      buffer = Buffer.from(imageData, "base64");
    }
  } else {
    buffer = imageData;
  }

  const key = filename || `images/${uuidv4()}.png`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: "public-read",
  });

  await s3Client.send(command);

  const s3Url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`;
  
  return s3Url;
}

export async function uploadImageFromUrl(
  imageUrl: string,
  filename?: string
): Promise<string> {
  const response = await fetch(imageUrl);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  const contentType = response.headers.get("content-type") || "image/png";
  
  return uploadImageToS3(buffer, filename, contentType);
}

export { s3Client, BUCKET_NAME };
