import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary';
import { authenticateRequest } from '@/lib/api-auth';

export const runtime = 'nodejs';

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    // 1. JSON payload (e.g., base64 dataUrl from cropper or client)
    if (contentType.includes('application/json')) {
      const body = await req.json();
      const { image, folder = 'general', publicId, tags } = body;

      if (!image || typeof image !== 'string') {
        return NextResponse.json(
          { error: 'Missing or invalid "image" string (must be base64 data URL or remote URL)' },
          { status: 400 }
        );
      }

      // Check approximate size for base64
      if (image.length > MAX_FILE_SIZE * 1.37) {
        return NextResponse.json(
          { error: 'Payload exceeds maximum allowed size (10MB)' },
          { status: 413 }
        );
      }

      const result = await uploadToCloudinary(image, {
        folder,
        publicId,
        tags: Array.isArray(tags) ? tags : undefined,
      });

      return NextResponse.json({
        success: true,
        url: result.url,
        publicId: result.publicId,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      });
    }

    // 2. Multipart form data (direct file upload)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const folder = (formData.get('folder') as string) || 'general';
      const publicId = (formData.get('publicId') as string) || undefined;

      if (!file) {
        return NextResponse.json(
          { error: 'No file provided in form data field "file"' },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: 'File size exceeds maximum limit of 10MB' },
          { status: 413 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const result = await uploadToCloudinary(buffer, {
        folder,
        publicId,
      });

      return NextResponse.json({
        success: true,
        url: result.url,
        publicId: result.publicId,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      });
    }

    return NextResponse.json(
      { error: 'Unsupported Content-Type. Please use application/json or multipart/form-data' },
      { status: 400 }
    );
  } catch (err: any) {
    console.error('[Upload API Route Error]:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to upload asset to Cloudinary' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const publicId = searchParams.get('publicId');

    if (!publicId) {
      return NextResponse.json(
        { error: 'Missing "publicId" query parameter' },
        { status: 400 }
      );
    }

    const res = await deleteFromCloudinary(publicId);
    return NextResponse.json(res);
  } catch (err: any) {
    console.error('[Upload Delete API Error]:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to delete asset from Cloudinary' },
      { status: 500 }
    );
  }
}
