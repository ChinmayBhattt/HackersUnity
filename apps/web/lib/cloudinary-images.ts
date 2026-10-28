import mapping from './cloudinary-mapping.json';

/**
 * Returns the Cloudinary CDN URL for a given local static path,
 * or falls back to the original path if not mapped.
 */
export function getCloudinaryAsset(localPath: string): string {
  if (!localPath) return '';
  return (mapping as Record<string, string>)[localPath] || localPath;
}

export const CLOUDINARY_IMAGES = mapping as Record<string, string>;
export default CLOUDINARY_IMAGES;

