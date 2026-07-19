import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

export interface ParsedDocument {
  text: string;
  metadata: {
    pages?: number;
    wordCount: number;
    charCount: number;
    language?: string;
  };
}

export class ParserService {
  async parse(buffer: Buffer, mimeType: string): Promise<ParsedDocument> {
    switch (mimeType) {
      case 'application/pdf':
        return this.parsePDF(buffer);
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return this.parseDOCX(buffer);
      case 'text/plain':
        return this.parseTXT(buffer);
      case 'text/markdown':
        return this.parseMarkdown(buffer);
      default:
        throw new Error(`Unsupported file type: ${mimeType}`);
    }
  }

  private async parsePDF(buffer: Buffer): Promise<ParsedDocument> {
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const textResult = await parser.getText();
    await parser.destroy();
    return {
      text: textResult.text,
      metadata: {
        pages: textResult.total,
        wordCount: textResult.text.split(/\s+/).length,
        charCount: textResult.text.length,
      },
    };
  }

  private async parseDOCX(buffer: Buffer): Promise<ParsedDocument> {
    const result = await mammoth.extractRawText({ buffer });
    return {
      text: result.value,
      metadata: {
        wordCount: result.value.split(/\s+/).length,
        charCount: result.value.length,
      },
    };
  }

  private async parseTXT(buffer: Buffer): Promise<ParsedDocument> {
    const text = buffer.toString('utf-8');
    return {
      text,
      metadata: {
        wordCount: text.split(/\s+/).length,
        charCount: text.length,
      },
    };
  }

  private async parseMarkdown(buffer: Buffer): Promise<ParsedDocument> {
    const text = buffer.toString('utf-8');
    return {
      text,
      metadata: {
        wordCount: text.split(/\s+/).length,
        charCount: text.length,
      },
    };
  }
}

export const parserService = new ParserService();
