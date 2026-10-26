export interface GoogleWebFont {
  family: string;
  variants: string[];
  subsets: string[];
  version: string;
  lastModified: string;
  files: Record<string, string>;
  category: 'sans-serif' | 'serif' | 'display' | 'handwriting' | 'monospace' | string;
  kind: string;
  menu?: string;
}

export interface GoogleWebFontsResponse {
  kind: string;
  items: GoogleWebFont[];
}

export type GoogleFontsSort = 'alpha' | 'date' | 'popularity' | 'style' | 'trending';

const GOOGLE_FONTS_API_URL = 'https://www.googleapis.com/webfonts/v1/webfonts';

/**
 * Fetch available Google Web Fonts using the Google Fonts Developer API.
 * Uses 24-hour cache revalidation to ensure low latency and stay well within quota limits.
 */
export async function fetchGoogleWebFonts(options?: {
  sort?: GoogleFontsSort;
  apiKey?: string;
}): Promise<GoogleWebFont[]> {
  const apiKey =
    options?.apiKey ||
    process.env.GOOGLE_FONTS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_FONTS_API_KEY;

  if (!apiKey) {
    console.warn('Google Fonts API key not configured in environment variables.');
    return [];
  }

  const url = new URL(GOOGLE_FONTS_API_URL);
  url.searchParams.set('key', apiKey);
  if (options?.sort) {
    url.searchParams.set('sort', options.sort);
  }

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 86400 }, // Cache for 24 hours
    });

    if (!res.ok) {
      console.error(`Google Fonts API responded with status ${res.status}: ${res.statusText}`);
      return [];
    }

    const data: GoogleWebFontsResponse = await res.json();
    return data.items || [];
  } catch (error) {
    console.error('Failed to fetch Google Fonts:', error);
    return [];
  }
}

/**
 * Builds standard Google Fonts CSS2 embed URL for one or more font families.
 * Example output: "https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap"
 */
export function buildGoogleFontEmbedUrl(
  family: string,
  weights: (string | number)[] = [400, 600, 700]
): string {
  const formattedFamily = family.trim().replace(/\s+/g, '+');
  const weightStr = weights.join(';');
  return `https://fonts.googleapis.com/css2?family=${formattedFamily}:wght@${weightStr}&display=swap`;
}
