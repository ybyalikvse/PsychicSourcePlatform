import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

const WATERMARK_S3_KEY = "assets/watermark.png";
const LAMBDA_FUNCTION_NAME = process.env.AWS_LAMBDA_WATERMARK_FUNCTION || "video-watermark";

function getLambdaClient() {
  return new LambdaClient({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
  });
}

/**
 * Apply a watermark to a video stored in S3 by invoking an AWS Lambda function.
 * The Lambda downloads the video, overlays the watermark with FFmpeg,
 * and uploads the result back to S3.
 *
 * Returns the S3 key of the watermarked video.
 */
export async function watermarkVideo(
  originalS3Key: string,
  requestId: string
): Promise<string> {
  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket) throw new Error("AWS_S3_BUCKET not configured");

  const outputKey = `video-submissions/${requestId}_watermarked_${Date.now()}.mp4`;

  console.log(`[Watermark] Invoking Lambda ${LAMBDA_FUNCTION_NAME} for request ${requestId}`);
  console.log(`[Watermark] Input: ${originalS3Key} → Output: ${outputKey}`);

  const lambda = getLambdaClient();
  const payload = {
    bucket,
    videoKey: originalS3Key,
    watermarkKey: WATERMARK_S3_KEY,
    outputKey,
  };

  const response = await lambda.send(new InvokeCommand({
    FunctionName: LAMBDA_FUNCTION_NAME,
    InvocationType: "RequestResponse",
    Payload: Buffer.from(JSON.stringify(payload)),
  }));

  // Parse Lambda response
  if (response.FunctionError) {
    const errorPayload = response.Payload
      ? JSON.parse(Buffer.from(response.Payload).toString())
      : { errorMessage: "Unknown Lambda error" };
    console.error(`[Watermark] Lambda error:`, errorPayload);
    throw new Error(`Watermark Lambda failed: ${errorPayload.errorMessage || response.FunctionError}`);
  }

  const result = response.Payload
    ? JSON.parse(Buffer.from(response.Payload).toString())
    : null;

  if (!result?.outputKey) {
    throw new Error("Watermark Lambda returned no outputKey");
  }

  console.log(`[Watermark] Complete for request ${requestId}: ${result.outputKey}`);
  return result.outputKey;
}
