import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

function getS3Client() {
  return new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
  });
}

export function isS3Configured(): boolean {
  return !!(process.env.AWS_S3_BUCKET && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
}

export async function uploadImageToS3(
  imageData: string | Buffer,
  filename?: string,
  contentType: string = "image/png"
): Promise<string> {
  const bucketName = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION || "us-east-1";
  const usePublicUrl = process.env.AWS_S3_PUBLIC === "true";
  
  if (!bucketName) {
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

  const extension = contentType.includes("jpeg") || contentType.includes("jpg") ? "jpg" : "png";
  const key = filename || `images/${uuidv4()}.${extension}`;

  const s3Client = getS3Client();
  
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3Client.send(command);

  if (usePublicUrl) {
    return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
  } else {
    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    const signedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 604800 });
    return signedUrl;
  }
}

export async function uploadVideoToS3(
  videoBuffer: Buffer,
  filename: string,
  contentType: string = "video/mp4"
): Promise<{ key: string; url: string }> {
  const bucketName = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION || "us-east-1";

  if (!bucketName) {
    throw new Error("AWS_S3_BUCKET environment variable is not set");
  }
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error("AWS credentials are not configured");
  }

  const s3Client = getS3Client();

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: filename,
    Body: videoBuffer,
    ContentType: contentType,
  });

  await s3Client.send(command);

  const getCommand = new GetObjectCommand({
    Bucket: bucketName,
    Key: filename,
  });
  const signedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 604800 });
  return { key: filename, url: signedUrl };
}

export async function getSignedVideoUrl(key: string): Promise<string> {
  const bucketName = process.env.AWS_S3_BUCKET;
  if (!bucketName) throw new Error("AWS_S3_BUCKET not set");

  const s3Client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });
  return getSignedUrl(s3Client, command, { expiresIn: 604800 });
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

/**
 * Get a presigned URL from a full S3 URL.
 * Parses the key from the URL and generates a signed download link.
 */
export async function getPresignedUrl(s3Url: string, expiresIn: number = 3600): Promise<string> {
  const bucketName = process.env.AWS_S3_BUCKET;
  if (!bucketName) {
    return s3Url;
  }

  const urlPattern = new RegExp(`https://${bucketName}\\.s3\\..*\\.amazonaws\\.com/(.+)`);
  const match = s3Url.match(urlPattern);
  if (!match) {
    return s3Url;
  }

  const key = match[1];
  const s3Client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Download a video (or any file) from a URL and return it as a Buffer.
 */
export async function downloadVideoFromUrl(url: string, headers?: Record<string, string>): Promise<Buffer> {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Failed to download video: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export { getS3Client };
