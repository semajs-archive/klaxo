/**
 * Document extraction service for DOCX and RTF files.
 *
 * Provides robust server-side text extraction preserving structure
 * for source provenance and analysis.
 */
import * as mammoth from 'mammoth';
// rtf-parser doesn't have types; declare it
const parseRtf = require('rtf-parser').parseRtf;

export interface ExtractedDocument {
  text: string;
  paragraphs: Array<{
    text: string;
    style?: string;
    level?: number;
  }>;
  headings: Array<{
    text: string;
    level: number;
  }>;
  metadata: {
    paragraphCount: number;
    wordCount: number;
    headingCount: number;
  };
}

/**
 * Extract text and structure from a DOCX file.
 */
export async function extractDocx(buffer: Buffer): Promise<ExtractedDocument> {
  const result = await mammoth.extractRawText({ buffer });
  const htmlResult = await mammoth.convertToHtml({ buffer });
  
  const text = result.value;
  const html = htmlResult.value;
  
  // Parse HTML to extract paragraphs and headings
  const paragraphs: ExtractedDocument['paragraphs'] = [];
  const headings: ExtractedDocument['headings'] = [];
  
  // Simple HTML parsing for structure
  const headingRegex = /<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi;
  const paragraphRegex = /<p[^>]*>(.*?)<\/p>/gi;
  
  let match;
  while ((match = headingRegex.exec(html)) !== null) {
    const levelStr = match[1];
    const headingText = match[2];
    if (levelStr && headingText) {
      const level = parseInt(levelStr, 10);
      const cleanText = headingText.replace(/<[^>]*>/g, '').trim();
      if (cleanText) {
        headings.push({ text: cleanText, level });
        paragraphs.push({ text: cleanText, style: `heading-${level}`, level });
      }
    }
  }
  
  while ((match = paragraphRegex.exec(html)) !== null) {
    const paragraphText = match[1];
    if (paragraphText) {
      const cleanText = paragraphText.replace(/<[^>]*>/g, '').trim();
      if (cleanText) {
        paragraphs.push({ text: cleanText });
      }
    }
  }
  
  // Fallback: if no HTML structure found, split by double newlines
  if (paragraphs.length === 0) {
    const rawParagraphs = text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
    rawParagraphs.forEach((p) => {
      paragraphs.push({ text: p });
    });
  }
  
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  
  return {
    text,
    paragraphs,
    headings,
    metadata: {
      paragraphCount: paragraphs.length,
      wordCount,
      headingCount: headings.length,
    },
  };
}

/**
 * Extract text from an RTF file.
 */
export async function extractRtf(buffer: Buffer): Promise<ExtractedDocument> {
  const rtfText = buffer.toString('utf8');
  
  // Use rtf-parser to extract text
  const result = await parseRtf(rtfText);
  
  // Extract plain text from the parsed RTF
  function extractTextFromNode(node: unknown): string {
    if (typeof node === 'string') {
      return node;
    }
    if (node && typeof node === 'object' && 'children' in node) {
      const children = (node as { children: unknown[] }).children;
      return children.map(extractTextFromNode).join('');
    }
    if (Array.isArray(node)) {
      return node.map(extractTextFromNode).join('');
    }
    return '';
  }
  
  const text = extractTextFromNode(result);
  const cleanText = text
    .replace(/\s+/g, ' ')
    .replace(/\\[\s\S]/g, '') // Remove RTF control words
    .replace(/\{[^}]*\}/g, '') // Remove RTF groups
    .trim();
  
  // Split into paragraphs
  const paragraphs = cleanText
    .split(/\n{2,}|\r\n\r\n/)
    .map(p => p.trim())
    .filter(Boolean)
    .map((p) => ({ text: p }));
  
  const wordCount = cleanText.split(/\s+/).filter(Boolean).length;
  
  return {
    text: cleanText,
    paragraphs,
    headings: [],
    metadata: {
      paragraphCount: paragraphs.length,
      wordCount,
      headingCount: 0,
    },
  };
}

/**
 * Extract text from a legacy DOC file (binary format).
 * Note: This is a best-effort extraction. Legacy DOC is not fully supported.
 */
export async function extractDoc(buffer: Buffer): Promise<ExtractedDocument> {
  // Try to detect if it's actually RTF in disguise
  const header = buffer.toString('utf8', 0, Math.min(100, buffer.length));
  
  if (header.startsWith('{\\rtf')) {
    return extractRtf(buffer);
  }
  
  // Try mammoth (it might handle some .doc files)
  try {
    return await extractDocx(buffer);
  } catch {
    throw new Error(
      'Legacy .doc format is not supported. Please convert to .docx or .rtf format.'
    );
  }
}

/**
 * Main extraction function that routes by MIME type.
 */
export async function extractDocument(
  buffer: Buffer,
  mimeType: string
): Promise<ExtractedDocument> {
  switch (mimeType) {
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return extractDocx(buffer);
    case 'application/rtf':
      return extractRtf(buffer);
    case 'application/msword':
      return extractDoc(buffer);
    default:
      throw new Error(`Unsupported document MIME type: ${mimeType}`);
  }
}