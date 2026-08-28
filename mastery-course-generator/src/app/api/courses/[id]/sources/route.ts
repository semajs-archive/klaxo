/**
 * API: Source document upload and listing.
 *
 * POST /api/courses/:id/sources       - upload source material (multipart/form-data)
 * GET  /api/courses/:id/sources       - list uploaded sources
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { getCourse, listSourceDocuments } from '@/db/repo';
import { ingestUpload, ingestPrompt, classifyUpload, type UploadInput } from '@/services/ingestion';
import { notFound, toAppError, badRequest } from '@/lib/errors';
import { getEnv } from '@/lib/env';

const MAX_FILES = getEnv().MAX_UPLOAD_FILES;
const MAX_BYTES = getEnv().MAX_UPLOAD_BYTES;

/**
 * POST /api/courses/:id/sources
 * Accepts multipart/form-data with files and optional text content.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const userId = await requireUserId();
    const { id } = await params;

    const course = getCourse(id);
    if (!course) throw notFound('Course not found');
    if (course.userId !== userId) throw notFound('Course not found');

    const contentType = req.headers.get('content-type') ?? '';
    if (!contentType.includes('multipart/form-data')) {
      throw badRequest('Expected multipart/form-data');
    }

    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    const prompts = formData.getAll('prompts') as string[];

    if (files.length === 0 && prompts.length === 0) {
      throw badRequest('No files or prompts provided');
    }

    if (files.length > MAX_FILES) {
      throw badRequest(`Too many files (max ${MAX_FILES})`);
    }

    const results = [];

    // Process file uploads
    for (const file of files) {
      if (file.size > MAX_BYTES) {
        throw badRequest(`File ${file.name} exceeds maximum size (${MAX_BYTES} bytes)`);
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const classification = classifyUpload(file.name, file.type);

      const uploadInput: UploadInput = {
        courseId: id,
        kind: classification.kind,
        filename: file.name,
        mimeType: file.type,
        content: buffer,
      };

      const result = await ingestUpload(uploadInput);
      results.push(result);
    }

    // Process prompt uploads
    for (const text of prompts) {
      if (text.trim().length === 0) continue;
      if (Buffer.byteLength(text, 'utf8') > MAX_BYTES) {
        throw badRequest('Prompt text exceeds maximum size');
      }

      const result = await ingestPrompt(id, text);
      results.push(result);
    }

    return NextResponse.json({ sources: results }, { status: 201 });
  } catch (err) {
    const appErr = toAppError(err);
    return NextResponse.json(
      { error: appErr.message },
      { status: appErr.status },
    );
  }
}

/**
 * GET /api/courses/:id/sources
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const userId = await requireUserId();
    const { id } = await params;

    const course = getCourse(id);
    if (!course) throw notFound('Course not found');
    if (course.userId !== userId) throw notFound('Course not found');

    const sources = listSourceDocuments(id);
    return NextResponse.json({ sources });
  } catch (err) {
    const appErr = toAppError(err);
    return NextResponse.json(
      { error: appErr.message },
      { status: appErr.status },
    );
  }
}