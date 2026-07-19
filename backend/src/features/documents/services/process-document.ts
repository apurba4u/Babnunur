import fs from 'fs/promises';
import mammoth from 'mammoth';

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
      // PDF parsing requires additional setup - read as text fallback
      const text = buffer.toString('utf-8');
      if (text.includes('%PDF')) {
        throw new Error('PDF parsing requires additional configuration. Please upload as TXT or DOCX instead.');
      }
      return {
        text,
        metadata: { wordCount: text.split(/\s+/).length, charCount: text.length },
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
