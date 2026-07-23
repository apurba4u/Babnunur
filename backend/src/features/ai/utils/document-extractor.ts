import path from 'path';
import fs from 'fs/promises';
import mammoth from 'mammoth';
import os from 'os';
import { execSync } from 'child_process';

export type ExtractedContent = {
  text: string;
  isImage: boolean;
  base64?: string;
  mimeType?: string;
};

async function extractPdfText(data: Buffer): Promise<string> {
  try {
    const pdfModule = require('pdf-parse');
    if (typeof pdfModule === 'function') {
      const result = await pdfModule(data);
      return result.text || '';
    }
    if (pdfModule.PDFParse) {
      const instance = new pdfModule.PDFParse(data);
      const result = await instance.parse();
      return result.text || '';
    }
  } catch {
    // Fallback: try pdftotext command
    try {
      const tmpFile = path.join(os.tmpdir(), `pdf_${Date.now()}.pdf`);
      await fs.writeFile(tmpFile, data);
      const result = execSync(`pdftotext "${tmpFile}" - 2>/dev/null || echo ""`, { encoding: 'utf-8' });
      await fs.unlink(tmpFile).catch(() => {});
      return result?.trim() || '';
    } catch {
      // ignore
    }
  }
  return '';
}

async function extractPptxText(filePath: string): Promise<string> {
  try {
    const { XMLParser } = require('fast-xml-parser');
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
    const AdmZip = require('adm-zip');
    const zip = new AdmZip(filePath);
    const entries = zip.getEntries();
    const slides: string[] = [];
    for (const entry of entries) {
      if (entry.entryName.match(/^ppt\/slides\/slide\d+\.xml$/)) {
        const xml = entry.getData().toString('utf-8');
        const parsed = parser.parse(xml);
        const texts = extractTextFromNode(parsed);
        if (texts.length > 0) slides.push(texts.join(' '));
      }
    }
    return slides.join('\n');
  } catch {
    return '';
  }
}

function extractTextFromNode(node: any, texts: string[] = []): string[] {
  if (!node || typeof node !== 'object') return texts;
  if (typeof node === 'string') { texts.push(node); return texts; }
  if (Array.isArray(node)) {
    for (const item of node) extractTextFromNode(item, texts);
    return texts;
  }
  for (const key of Object.keys(node)) {
    const val = node[key];
    if (key === 'a:t' || key === 'w:t') {
      if (typeof val === 'string') texts.push(val);
    } else if (key === '#text') {
      texts.push(String(val));
    } else {
      extractTextFromNode(val, texts);
    }
  }
  return texts;
}

export async function extractFileContent(filePath: string, mimeType: string): Promise<ExtractedContent> {
  const ext = path.extname(filePath).toLowerCase();
  const fullPath = path.join(process.cwd(), filePath);
  const data = await fs.readFile(fullPath);

  if (mimeType.startsWith('image/')) {
    return {
      text: '',
      isImage: true,
      base64: data.toString('base64'),
      mimeType,
    };
  }

  if (ext === '.pdf' || mimeType === 'application/pdf') {
    const text = await extractPdfText(data);
    return { text, isImage: false };
  }

  if (ext === '.docx' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || mimeType === 'application/octet-stream') {
    try {
      const result = await mammoth.extractRawText({ buffer: data });
      return { text: result.value || '', isImage: false };
    } catch {
      return { text: '', isImage: false };
    }
  }

  if (ext === '.pptx' || mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || mimeType === 'application/octet-stream') {
    const text = await extractPptxText(fullPath);
    return { text, isImage: false };
  }

  if (ext === '.txt' || ext === '.csv' || mimeType === 'text/plain' || mimeType === 'text/csv') {
    return { text: data.toString('utf-8'), isImage: false };
  }

  return { text: '', isImage: false };
}

export function buildAttachmentText(extracted: ExtractedContent[], fileName: string): string {
  const textParts = extracted.filter(e => !e.isImage).map(e => e.text).filter(Boolean);
  if (textParts.length === 0) return '';
  return `\n\n[Content of ${fileName}]:\n${textParts.join('\n\n---\n\n')}`;
}
