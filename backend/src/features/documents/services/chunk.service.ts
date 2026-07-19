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
    let startIndex = 0;

    while (startIndex < text.length) {
      const endIndex = Math.min(startIndex + chunkSize, text.length);
      let chunkEnd = endIndex;

      if (endIndex < text.length) {
        const lastNewline = text.lastIndexOf('\n', endIndex);
        if (lastNewline > startIndex + chunkSize * 0.5) {
          chunkEnd = lastNewline + 1;
        }
      }

      const content = text.slice(startIndex, chunkEnd).trim();
      if (content.length > 0) {
        chunks.push({ content, startIndex, endIndex: chunkEnd });
      }

      startIndex = chunkEnd - chunkOverlap;
      if (startIndex >= text.length) break;
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

  async getChunksByDocument(documentId: string, userId: string) {
    return Chunk.find({ documentId, userId }).sort({ chunkIndex: 1 });
  }

  async deleteChunksByDocument(documentId: string): Promise<void> {
    await Chunk.deleteMany({ documentId });
  }
}

export const chunkService = new ChunkService();
