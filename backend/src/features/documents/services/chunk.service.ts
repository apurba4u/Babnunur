import { Chunk } from '../models/chunk.model';

export interface ChunkOptions {
  chunkSize?: number;
  chunkOverlap?: number;
}

const DEFAULT_OPTIONS: ChunkOptions = {
  chunkSize: 1000,
  chunkOverlap: 200,
};

export class ChunkService {
  chunkText(text: string, options: ChunkOptions = {}): Array<{ content: string; startIndex: number; endIndex: number }> {
    const { chunkSize = DEFAULT_OPTIONS.chunkSize!, chunkOverlap = DEFAULT_OPTIONS.chunkOverlap! } = options;
    const chunks: Array<{ content: string; startIndex: number; endIndex: number }> = [];

    if (text.length === 0) return chunks;

    // If text fits in one chunk, return it as-is
    if (text.length <= chunkSize) {
      chunks.push({ content: text.trim(), startIndex: 0, endIndex: text.length });
      return chunks;
    }

    let startIndex = 0;

    while (startIndex < text.length) {
      let endIndex = Math.min(startIndex + chunkSize, text.length);

      // Try to break at a newline if possible
      if (endIndex < text.length) {
        const lastNewline = text.lastIndexOf('\n', endIndex);
        if (lastNewline > startIndex + chunkSize * 0.5) {
          endIndex = lastNewline + 1;
        }
      }

      const content = text.slice(startIndex, endIndex).trim();
      if (content.length > 0) {
        chunks.push({ content, startIndex, endIndex });
      }

      // Advance: if we reached the end, stop; otherwise advance by chunkSize minus overlap
      if (endIndex >= text.length) break;
      startIndex = endIndex - Math.min(chunkOverlap, chunkSize / 2);
      // Safety: always advance by at least 1 character
      if (startIndex <= chunks[chunks.length - 1]?.startIndex) {
        startIndex = endIndex;
      }
    }

    return chunks;
  }

  async saveChunks(documentId: string, userId: string, chunks: Array<{ content: string; startIndex: number; endIndex: number }>): Promise<void> {
    const docs = chunks.map((chunk, index) => ({
      documentId,
      userId,
      chunkIndex: index,
      content: chunk.content,
      startIndex: chunk.startIndex,
      endIndex: chunk.endIndex,
      tokenCount: Math.ceil(chunk.content.length / 4),
      metadata: {},
    }));
    await Chunk.insertMany(docs);
  }

  async getChunksByDocument(documentId: string, userId: string): Promise<ReturnType<typeof Chunk.find>> {
    return Chunk.find({ documentId, userId }).sort({ chunkIndex: 1 });
  }

  async deleteChunksByDocument(documentId: string): Promise<void> {
    await Chunk.deleteMany({ documentId });
  }
}

export const chunkService = new ChunkService();
