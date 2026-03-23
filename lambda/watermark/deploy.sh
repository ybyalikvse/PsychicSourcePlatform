#!/bin/bash
# ============================================================
# Deploy the video-watermark Lambda function
#
# Prerequisites:
#   1. AWS CLI installed and configured
#   2. An IAM role for the Lambda function (see below)
#   3. The FFmpeg Lambda Layer (see below)
#   4. Upload watermark.png to S3 (see below)
#
# Usage:
#   cd lambda/watermark
#   chmod +x deploy.sh
#   ./deploy.sh
# ============================================================

set -e

FUNCTION_NAME="video-watermark"
RUNTIME="nodejs20.x"
HANDLER="index.handler"
TIMEOUT=290
MEMORY=2048
EPHEMERAL_STORAGE=2048
REGION="${AWS_REGION:-us-east-1}"

# ============================================================
# STEP 0: Set these variables before running
# ============================================================

# Your Lambda execution role ARN (must have S3 read/write + CloudWatch Logs)
ROLE_ARN="${LAMBDA_ROLE_ARN:-}"

# FFmpeg Lambda Layer ARN (see instructions below to create one)
FFMPEG_LAYER_ARN="${FFMPEG_LAYER_ARN:-}"

if [ -z "$ROLE_ARN" ]; then
  echo "ERROR: Set LAMBDA_ROLE_ARN environment variable"
  echo ""
  echo "Create a role with these policies:"
  echo "  - AWSLambdaBasicExecutionRole (managed policy)"
  echo "  - Custom inline policy for S3:"
  echo '    {'
  echo '      "Version": "2012-10-17",'
  echo '      "Statement": [{'
  echo '        "Effect": "Allow",'
  echo '        "Action": ["s3:GetObject", "s3:PutObject"],'
  echo '        "Resource": "arn:aws:s3:::YOUR_BUCKET/*"'
  echo '      }]'
  echo '    }'
  echo ""
  echo "Then run: LAMBDA_ROLE_ARN=arn:aws:iam::ACCOUNT:role/ROLE_NAME ./deploy.sh"
  exit 1
fi

if [ -z "$FFMPEG_LAYER_ARN" ]; then
  echo "ERROR: Set FFMPEG_LAYER_ARN environment variable"
  echo ""
  echo "To create an FFmpeg layer:"
  echo "  1. Download static FFmpeg build:"
  echo "     curl -L https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz | tar -xJ"
  echo "  2. Package it:"
  echo "     mkdir -p layer/bin"
  echo "     cp ffmpeg-*-amd64-static/ffmpeg layer/bin/"
  echo "     cd layer && zip -r ../ffmpeg-layer.zip . && cd .."
  echo "  3. Publish the layer:"
  echo "     aws lambda publish-layer-version --layer-name ffmpeg \\"
  echo "       --zip-file fileb://ffmpeg-layer.zip \\"
  echo "       --compatible-runtimes nodejs20.x \\"
  echo "       --compatible-architectures x86_64 \\"
  echo "       --region $REGION"
  echo "  4. Use the returned LayerVersionArn"
  echo ""
  echo "Then run: FFMPEG_LAYER_ARN=arn:aws:lambda:REGION:ACCOUNT:layer:ffmpeg:VERSION ./deploy.sh"
  exit 1
fi

# ============================================================
# STEP 1: Package the function
# ============================================================
echo "Packaging Lambda function..."
cd "$(dirname "$0")"
zip -j function.zip index.mjs

# ============================================================
# STEP 2: Create or update the function
# ============================================================
echo "Deploying Lambda function: $FUNCTION_NAME"

# Check if function exists
if aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" > /dev/null 2>&1; then
  echo "Updating existing function..."
  aws lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --zip-file fileb://function.zip \
    --region "$REGION"

  # Wait for update to complete
  aws lambda wait function-updated --function-name "$FUNCTION_NAME" --region "$REGION"

  aws lambda update-function-configuration \
    --function-name "$FUNCTION_NAME" \
    --timeout "$TIMEOUT" \
    --memory-size "$MEMORY" \
    --ephemeral-storage "Size=$EPHEMERAL_STORAGE" \
    --layers "$FFMPEG_LAYER_ARN" \
    --region "$REGION"
else
  echo "Creating new function..."
  aws lambda create-function \
    --function-name "$FUNCTION_NAME" \
    --runtime "$RUNTIME" \
    --handler "$HANDLER" \
    --role "$ROLE_ARN" \
    --zip-file fileb://function.zip \
    --timeout "$TIMEOUT" \
    --memory-size "$MEMORY" \
    --ephemeral-storage "Size=$EPHEMERAL_STORAGE" \
    --layers "$FFMPEG_LAYER_ARN" \
    --region "$REGION"
fi

# Cleanup
rm -f function.zip

echo ""
echo "============================================================"
echo "Lambda function deployed: $FUNCTION_NAME"
echo "============================================================"
echo ""
echo "Next steps:"
echo "  1. Upload watermark.png to S3:"
echo "     aws s3 cp ../../server/assets/watermark.png s3://\$AWS_S3_BUCKET/assets/watermark.png"
echo ""
echo "  2. Add to Vercel environment variables:"
echo "     AWS_LAMBDA_WATERMARK_FUNCTION=$FUNCTION_NAME"
echo ""
echo "  3. Ensure the IAM user (AWS_ACCESS_KEY_ID) has lambda:InvokeFunction permission"
echo ""
