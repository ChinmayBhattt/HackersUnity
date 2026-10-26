import { v2 as cloudinary, UploadApiResponse, UploadApiOptions } from 'cloudinary';

// Configure Cloudinary once
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});


export { cloudinary };

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}

export interface CloudinaryUploadOptions {
  folder?: string;
  publicId?: string;
  resourceType?: 'image' | 'raw' | 'video' | 'auto';
  tags?: string[];
  transformation?: UploadApiOptions['transformation'];
}

/**
 * Uploads a file (base64 string, data URI, buffer, or remote URL) to Cloudinary.
 */
export async function uploadToCloudinary(
  file: string | Buffer,
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult> {
  const rootFolder = 'hackers-unity';
  const targetFolder = options.folder
    ? options.folder.startsWith(rootFolder)
      ? options.folder
      : `${rootFolder}/${options.folder}`
    : `${rootFolder}/general`;

  const uploadOptions: UploadApiOptions = {
    folder: targetFolder,
    resource_type: options.resourceType || 'auto',
    tags: ['hackers-unity', ...(options.tags || [])],
  };

  if (options.publicId) {
    uploadOptions.public_id = options.publicId;
    uploadOptions.overwrite = true;
  }

  if (options.transformation) {
    uploadOptions.transformation = options.transformation;
  }

  return new Promise((resolve, reject) => {
    if (typeof file === 'string') {
      // String can be data:image/..., https://..., or base64
      cloudinary.uploader.upload(file, uploadOptions, (error, result) => {
        if (error || !result) {
          return reject(error || new Error('Upload to Cloudinary failed'));
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        });
      });
    } else {
      // Buffer upload via stream
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            return reject(error || new Error('Buffer upload to Cloudinary failed'));
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
          });
        }
      );
      uploadStream.end(file);
    }
  });
}

/**
 * Deletes an asset from Cloudinary using its public_id.
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<{ success: boolean; result?: string; error?: string }> {
  try {
    const res = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return { success: res.result === 'ok', result: res.result };
  } catch (err: any) {
    console.error('[Cloudinary] Failed to delete asset:', err);
    return { success: false, error: err?.message || 'Delete failed' };
  }
}

/**
 * Generates an optimized Cloudinary delivery URL with auto format & quality.
 */
export function getOptimizedImageUrl(
  publicIdOrUrl: string,
  options?: {
    width?: number;
    height?: number;
    crop?: string;
    gravity?: string;
    quality?: string | number;
  }
): string {
  if (!publicIdOrUrl) return '';

  // If already a full non-cloudinary URL, return as-is
  if (publicIdOrUrl.startsWith('http') && !publicIdOrUrl.includes('res.cloudinary.com')) {
    return publicIdOrUrl;
  }

  try {
    // If it's a Cloudinary URL, extract publicId or build transformation
    let publicId = publicIdOrUrl;
    if (publicIdOrUrl.includes('res.cloudinary.com')) {
      const parts = publicIdOrUrl.split('/upload/');
      if (parts.length === 2) {
        // Strip existing transformations if any
        const afterUpload = parts[1];
        const segments = afterUpload.split('/');
        // Find where version string (v12345) or folders start
        const vIndex = segments.findIndex((s) => /^v\d+$/.test(s));
        if (vIndex !== -1) {
          publicId = segments.slice(vIndex + 1).join('.');
        } else {
          publicId = segments.join('/');
        }
        // Remove file extension for cloudinary url helper
        publicId = publicId.replace(/\.[^/.]+$/, '');
      }
    }

    return cloudinary.url(publicId, {
      secure: true,
      fetch_format: 'auto',
      quality: options?.quality || 'auto',
      width: options?.width,
      height: options?.height,
      crop: options?.crop || (options?.width && options?.height ? 'fill' : undefined),
      gravity: options?.gravity || (options?.width && options?.height ? 'auto' : undefined),
    });
  } catch (err) {
    console.warn('[Cloudinary URL generation warning]:', err);
    return publicIdOrUrl;
  }
}
