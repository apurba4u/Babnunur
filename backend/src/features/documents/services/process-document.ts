import fs from 'fs/promises';
import mammoth from 'mammoth';
import { extractText, getMeta } from 'unpdf';

interface ProcessResult {
  text: string;
  metadata: Record<string, unknown>;
}

export async function processDocumentFile(
  storagePath: string,
  mimeType: string
): Promise<ProcessResult> {
  const buffer = await fs.readFile(storagePath);

  switch (mimeType) {
    case 'application/pdf': {
      const uint8 = new Uint8Array(buffer);
      const [textResult, metaResult] = await Promise.all([
        extractText(uint8),
        getMeta(uint8).catch(() => null),
      ]);

      const text = Array.isArray(textResult.text)
        ? textResult.text.join('\n')
        : String(textResult.text || '');

      if (!text.trim()) {
        throw new Error('Could not extract text from PDF. The document may be image-based or encrypted.');
      }

      return {
        text,
        metadata: {
          pages: textResult.totalPages || metaResult?.info?.PDFFormatVersion ? 1 : undefined,
          wordCount: text.split(/\s+/).length,
          charCount: text.length,
        },
      };
    }
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
      const result = await mammoth.extractRawText({ buffer });
      return {
        text: result.value,
        metadata: {
          wordCount: result.value.split(/\s+/).length,
          charCount: result.value.length,
        },
      };
    }
    case 'text/plain':
    case 'text/markdown': {
      const text = buffer.toString('utf-8');
      return {
        text,
        metadata: {
          wordCount: text.split(/\s+/).length,
          charCount: text.length,
        },
      };
    }
    default:
      throw new Error(`Unsupported file type: ${mimeType}`);
  }
}

// CLI entry point for child_process.fork
if (require.main === module) {
  const args = process.argv.slice(2);
  const storagePath = args[0];
  const mimeType = args[1];

  processDocumentFile(storagePath, mimeType)
    .then((result) => {
      process.stdout.write(JSON.stringify({ success: true, data: result }));
      process.exit(0);
    })
    .catch((error) => {
      process.stdout.write(JSON.stringify({ success: false, error: (error as Error).message }));
      process.exit(1);
    });
}
