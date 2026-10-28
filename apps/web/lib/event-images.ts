/**
 * Maps event IDs and slugs to their Cloudinary CDN banner images.
 * Stored on high-speed global CDN for fast SSR and client delivery.
 */

const codewarsImg = 'https://res.cloudinary.com/p6qljeni/image/upload/v1793189736/hackers-unity/gallery/CodeWars-2.png';
const clashOfCodersImg = 'https://res.cloudinary.com/p6qljeni/image/upload/v1793189734/hackers-unity/gallery/clash-of-coders.jpg';
const openaiHackathonImg = 'https://res.cloudinary.com/p6qljeni/image/upload/v1793189798/hackers-unity/gallery/openai-hackathon_jpeg.jpg';
const kestraImg = 'https://res.cloudinary.com/p6qljeni/image/upload/v1793189727/hackers-unity/gallery/Event_Orchestration.png';
const hackvisionImg = 'https://res.cloudinary.com/p6qljeni/image/upload/v1793189724/hackers-unity/gallery/Hackvision.jpg';
const hackstormImg = 'https://res.cloudinary.com/p6qljeni/image/upload/v1793189713/hackers-unity/gallery/Hackstorm.jpg';
const wchlImg = 'https://res.cloudinary.com/p6qljeni/image/upload/v1793189729/hackers-unity/gallery/WCHL.jpg';

export const EVENT_IMAGE_MAP: Record<string, string> = {
  codewars: codewarsImg,
  'codewars-hackathon': codewarsImg,
  'codewars-2': codewarsImg,

  'clash-of-coders': clashOfCodersImg,
  'clash-of-coders-2026': clashOfCodersImg,

  'chatgpt-codex': openaiHackathonImg,
  'openai-hackathon': openaiHackathonImg,
  'chatgpt-codex-hackathon': openaiHackathonImg,
  'openai-codex': openaiHackathonImg,

  'kestra-orchestration': kestraImg,
  'kestra-orchestration-challenge': kestraImg,
  'event-orchestration': kestraImg,

  hackvision: hackvisionImg,
  'hackvision-2026': hackvisionImg,

  hackstorm: hackstormImg,
  'hackstorm-2025': hackstormImg,
  'hackstorm-code-the-storm': hackstormImg,

  wchl: wchlImg,
  'wchl-2025': wchlImg,
  'world-coding-hackathon-league': wchlImg,
};

/**
 * Helper to safely extract image url/src for an event.
 * Falls back to mapped static images if event.image is missing or broken.
 */
export function getEventImageSrc(event?: {
  id?: string;
  slug?: string;
  title?: string;
  name?: string;
  image?: string | null;
  bannerUrl?: string | null;
  banner_url?: string | null;
} | null): string | null {
  if (!event) return null;

  const candidateUrl =
    (typeof event.bannerUrl === 'string' && event.bannerUrl.trim()) ||
    (typeof (event as any).banner_url === 'string' && (event as any).banner_url.trim()) ||
    (typeof event.image === 'string' && event.image.trim()) ||
    null;

  // 1. Direct valid http/https/data URLs
  if (candidateUrl && (candidateUrl.startsWith('http://') || candidateUrl.startsWith('https://') || candidateUrl.startsWith('data:'))) {
    return candidateUrl;
  }

  // 2. Lookup by id or slug
  const idKey = (event.id || '').toLowerCase().trim();
  if (idKey && EVENT_IMAGE_MAP[idKey]) {
    return EVENT_IMAGE_MAP[idKey];
  }

  const slugKey = (event.slug || '').toLowerCase().trim();
  if (slugKey && EVENT_IMAGE_MAP[slugKey]) {
    return EVENT_IMAGE_MAP[slugKey];
  }

  // 3. Fallback matching by title keywords
  const title = (event.title || event.name || '').toLowerCase();
  if (title.includes('codewar')) return codewarsImg;
  if (title.includes('clash') || (title.includes('coder') && !title.includes('codex'))) return clashOfCodersImg;
  if (title.includes('openai') || title.includes('chatgpt') || title.includes('codex')) return openaiHackathonImg;
  if (title.includes('kestra') || title.includes('orchestration')) return kestraImg;
  if (title.includes('hackvision') || title.includes('vision')) return hackvisionImg;
  if (title.includes('hackstorm') || title.includes('storm')) return hackstormImg;
  if (title.includes('wchl') || title.includes('league')) return wchlImg;

  // 4. Return candidate if non-empty string
  if (candidateUrl) return candidateUrl;

  return null;
}
