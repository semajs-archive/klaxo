/**
 * PDF text extraction using pdfjs-dist.
 *
 * Extracts text with page boundaries so provenance can cite page information.
 */
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

export interface ExtractedPage {
  pageNumber: number;
  text: string;
}

export interface PdfExtractionResult {
  pages: ExtractedPage[];
  fullText: string;
  pageCount: number;
}

/**
 * Extract text from a PDF buffer, preserving page numbers.
 */
export async function extractPdfText(buffer: Buffer): Promise<PdfExtractionResult> {
  const uint8 = new Uint8Array(buffer);
  const doc = await getDocument({ data: uint8 }).promise;

  const pages: ExtractedPage[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const textContent = await page.getTextContent();
    const text = textContent.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    pages.push({ pageNumber: i, text });
  }

  const fullText = pages.map((p) => p.text).join('\n\n');
  return { pages, fullText, pageCount: doc.numPages };
}