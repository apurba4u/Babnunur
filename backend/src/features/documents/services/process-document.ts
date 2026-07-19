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
  let buffer: Buffer;
  try {
    buffer = await fs.readFile(storagePath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`File not found: ${storagePath}`);
    }
    throw new Error(`Failed to read file: ${(err as Error).message}`);
  }

  if (buffer.length === 0) {
    throw new Error('File is empty');
  }

  switch (mimeType) {
    case 'application/pdf': {
      const uint8 = new Uint8Array(buffer);
      let textResult: { text: string | string[]; totalPages?: number };
      try {
        textResult = await extractText(uint8);
      } catch {
        throw new Error('Failed to parse PDF. The file may be corrupted or encrypted.');
      }

      const [metaResult] = await Promise.all([
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
      try {
        const result = await mammoth.extractRawText({ buffer });
        const text = result.value;
        if (!text.trim()) {
          throw new Error('DOCX file contains no extractable text');
        }
        return {
          text,
          metadata: {
            wordCount: text.split(/\s+/).length,
            charCount: text.length,
          },
        };
      } catch (err) {
        if ((err as Error).message.includes('contains no extractable text')) throw err;
        throw new Error(`Failed to parse DOCX: ${(err as Error).message}`);
      }
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
