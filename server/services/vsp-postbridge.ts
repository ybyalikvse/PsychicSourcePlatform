const POST_BRIDGE_API_URL = 'https://api.post-bridge.com';
const POST_BRIDGE_API_KEY = process.env.POST_BRIDGE_API_KEY;

interface UploadUrlResponse {
  media_id: string;
  upload_url: string;
  name: string;
}

interface SocialAccount {
  id: number;
  platform: string;
  name: string;
  username: string;
}

interface PostResponse {
  id: string;
  caption: string;
  status: 'posted' | 'scheduled' | 'processing';
  scheduled_at: string | null;
  social_accounts: number[];
  created_at: string;
  updated_at: string;
}

export interface PublishOptions {
  caption: string;
  videoUrl: string;
  socialAccountIds: number[];
  scheduledAt?: string;
  platformConfigurations?: {
    tiktok?: {
      title?: string;
      caption?: string;
    };
    instagram?: {
      caption?: string;
      placement?: 'feed' | 'reels';
    };
    youtube?: {
      title?: string;
      caption?: string;
    };
  };
}

/**
 * Get all connected social accounts from Post-Bridge
 */
export async function getSocialAccounts(): Promise<SocialAccount[]> {
  if (!POST_BRIDGE_API_KEY) {
    throw new Error('POST_BRIDGE_API_KEY is not configured');
  }

  const response = await fetch(`${POST_BRIDGE_API_URL}/v1/social-accounts`, {
    headers: {
      'Authorization': `Bearer ${POST_BRIDGE_API_KEY}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch social accounts: ${error}`);
  }

  const data = await response.json() as { data: SocialAccount[] };
  return data.data;
}

/**
 * Upload video to Post-Bridge and return media ID
 */
async function uploadVideoToPostBridge(videoUrl: string): Promise<string> {
  if (!POST_BRIDGE_API_KEY) {
    throw new Error('POST_BRIDGE_API_KEY is not configured');
  }

  // Download video from URL (could be base64 or external URL)
  let videoBuffer: Buffer;

  if (videoUrl.startsWith('data:video/')) {
    // Base64 video
    const base64Data = videoUrl.split(',')[1];
    videoBuffer = Buffer.from(base64Data, 'base64');
  } else {
    // External URL
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video from ${videoUrl}`);
    }
    videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
  }

  const videoSizeBytes = videoBuffer.length;
  const mimeType = 'video/mp4';
  const fileName = `video-${Date.now()}.mp4`;

  // Step 1: Request upload URL
  const uploadUrlResponse = await fetch(`${POST_BRIDGE_API_URL}/v1/media/create-upload-url`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${POST_BRIDGE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: fileName,
      mime_type: mimeType,
      size_bytes: videoSizeBytes,
    }),
  });

  if (!uploadUrlResponse.ok) {
    const error = await uploadUrlResponse.text();
    throw new Error(`Failed to create upload URL: ${error}`);
  }

  const uploadData = await uploadUrlResponse.json() as UploadUrlResponse;

  // Step 2: Upload video to signed URL
  const uploadResponse = await fetch(uploadData.upload_url, {
    method: 'PUT',
    headers: {
      'Content-Type': mimeType,
    },
    body: videoBuffer,
  });

  if (!uploadResponse.ok) {
    const error = await uploadResponse.text();
    throw new Error(`Failed to upload video: ${error}`);
  }

  return uploadData.media_id;
}

/**
 * Publish video to Post-Bridge
 */
export async function publishToPostBridge(options: PublishOptions): Promise<PostResponse> {
  if (!POST_BRIDGE_API_KEY) {
    throw new Error('POST_BRIDGE_API_KEY is not configured');
  }

  // Upload video and get media ID
  const mediaId = await uploadVideoToPostBridge(options.videoUrl);

  // Create post
  const postPayload: any = {
    caption: options.caption,
    media: [mediaId],
    social_accounts: options.socialAccountIds,
    processing_enabled: true,
  };

  // Add scheduled time if provided
  if (options.scheduledAt) {
    postPayload.scheduled_at = options.scheduledAt;
  }

  // Add platform-specific configurations
  if (options.platformConfigurations) {
    postPayload.platform_configurations = {};

    if (options.platformConfigurations.tiktok) {
      postPayload.platform_configurations.tiktok = {
        ...options.platformConfigurations.tiktok,
        media: [mediaId],
      };
    }

    if (options.platformConfigurations.instagram) {
      postPayload.platform_configurations.instagram = {
        ...options.platformConfigurations.instagram,
        media: [mediaId],
        placement: options.platformConfigurations.instagram.placement || 'reels',
      };
    }

    if (options.platformConfigurations.youtube) {
      postPayload.platform_configurations.youtube = {
        ...options.platformConfigurations.youtube,
        media: [mediaId],
      };
    }
  }

  const response = await fetch(`${POST_BRIDGE_API_URL}/v1/posts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${POST_BRIDGE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(postPayload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create post: ${error}`);
  }

  const postData = await response.json() as PostResponse;
  return postData;
}

/**
 * Upload image to Post-Bridge and return media ID
 */
async function uploadImageToPostBridge(imageUrl: string): Promise<string> {
  if (!POST_BRIDGE_API_KEY) {
    throw new Error('POST_BRIDGE_API_KEY is not configured');
  }

  let imageBuffer: Buffer;

  if (imageUrl.startsWith('data:image/')) {
    const base64Data = imageUrl.split(',')[1];
    imageBuffer = Buffer.from(base64Data, 'base64');
  } else {
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image from ${imageUrl}`);
    }
    imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
  }

  const imageSizeBytes = imageBuffer.length;
  const mimeType = 'image/png';
  const fileName = `image-${Date.now()}.png`;

  // Step 1: Request upload URL
  const uploadUrlResponse = await fetch(`${POST_BRIDGE_API_URL}/v1/media/create-upload-url`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${POST_BRIDGE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: fileName,
      mime_type: mimeType,
      size_bytes: imageSizeBytes,
    }),
  });

  if (!uploadUrlResponse.ok) {
    const error = await uploadUrlResponse.text();
    throw new Error(`Failed to create upload URL: ${error}`);
  }

  const uploadData = await uploadUrlResponse.json() as UploadUrlResponse;

  // Step 2: Upload image to signed URL
  const uploadResponse = await fetch(uploadData.upload_url, {
    method: 'PUT',
    headers: {
      'Content-Type': mimeType,
    },
    body: imageBuffer,
  });

  if (!uploadResponse.ok) {
    const error = await uploadResponse.text();
    throw new Error(`Failed to upload image: ${error}`);
  }

  return uploadData.media_id;
}

export interface PublishCarouselOptions {
  caption: string;
  imageUrls: string[];
  socialAccountIds: number[];
  scheduledAt?: string;
  platformConfigurations?: {
    instagram?: { caption?: string; };
    tiktok?: { caption?: string; };
  };
}

export interface PublishSingleImageOptions {
  caption: string;
  imageUrl: string;
  socialAccountIds: number[];
  scheduledAt?: string;
  platformConfigurations?: {
    instagram?: { caption?: string; placement?: 'feed' | 'reels'; };
    tiktok?: { caption?: string; };
  };
}

/**
 * Publish carousel (multiple images) to Post-Bridge
 */
export async function publishCarouselToPostBridge(options: PublishCarouselOptions): Promise<PostResponse> {
  if (!POST_BRIDGE_API_KEY) {
    throw new Error('POST_BRIDGE_API_KEY is not configured');
  }

  // Upload all images and get media IDs (2 concurrent)
  const mediaIds: string[] = [];
  for (let i = 0; i < options.imageUrls.length; i += 2) {
    const batch = options.imageUrls.slice(i, i + 2);
    const batchIds = await Promise.all(batch.map(url => uploadImageToPostBridge(url)));
    mediaIds.push(...batchIds);
  }

  const postPayload: any = {
    caption: options.caption,
    media: mediaIds,
    social_accounts: options.socialAccountIds,
  };

  if (options.scheduledAt) {
    postPayload.scheduled_at = options.scheduledAt;
  }

  if (options.platformConfigurations) {
    postPayload.platform_configurations = {};
    if (options.platformConfigurations.instagram) {
      postPayload.platform_configurations.instagram = {
        ...options.platformConfigurations.instagram,
        media: mediaIds,
      };
    }
    if (options.platformConfigurations.tiktok) {
      postPayload.platform_configurations.tiktok = {
        ...options.platformConfigurations.tiktok,
        media: mediaIds,
      };
    }
  }

  const response = await fetch(`${POST_BRIDGE_API_URL}/v1/posts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${POST_BRIDGE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(postPayload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create carousel post: ${error}`);
  }

  return await response.json() as PostResponse;
}

/**
 * Publish single image to Post-Bridge
 */
export async function publishSingleImageToPostBridge(options: PublishSingleImageOptions): Promise<PostResponse> {
  if (!POST_BRIDGE_API_KEY) {
    throw new Error('POST_BRIDGE_API_KEY is not configured');
  }

  const mediaId = await uploadImageToPostBridge(options.imageUrl);

  const postPayload: any = {
    caption: options.caption,
    media: [mediaId],
    social_accounts: options.socialAccountIds,
  };

  if (options.scheduledAt) {
    postPayload.scheduled_at = options.scheduledAt;
  }

  if (options.platformConfigurations) {
    postPayload.platform_configurations = {};
    if (options.platformConfigurations.instagram) {
      postPayload.platform_configurations.instagram = {
        ...options.platformConfigurations.instagram,
        media: [mediaId],
        placement: options.platformConfigurations.instagram.placement || 'feed',
      };
    }
    if (options.platformConfigurations.tiktok) {
      postPayload.platform_configurations.tiktok = {
        ...options.platformConfigurations.tiktok,
        media: [mediaId],
      };
    }
  }

  const response = await fetch(`${POST_BRIDGE_API_URL}/v1/posts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${POST_BRIDGE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(postPayload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create single image post: ${error}`);
  }

  return await response.json() as PostResponse;
}
