import { NextRequest, NextResponse } from 'next/server';
import { fetchGoogleWebFonts, GoogleFontsSort } from '@/lib/google-fonts';

export const revalidate = 86400; // Cache route handler for 24 hours

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sort = (searchParams.get('sort') as GoogleFontsSort) || 'popularity';
    const search = searchParams.get('search')?.toLowerCase().trim() || '';
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const category = searchParams.get('category')?.toLowerCase().trim();

    const fonts = await fetchGoogleWebFonts({ sort });

    let filtered = fonts;

    if (category) {
      filtered = filtered.filter((f) => f.category.toLowerCase() === category);
    }

    if (search) {
      filtered = filtered.filter((f) => f.family.toLowerCase().includes(search));
    }

    if (limit > 0) {
      filtered = filtered.slice(0, limit);
    }

    return NextResponse.json({
      success: true,
      total: filtered.length,
      fonts: filtered,
    });
  } catch (error: any) {
    console.error('Error in /api/fonts route:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch Google Fonts',
      },
      { status: 500 }
    );
  }
}
