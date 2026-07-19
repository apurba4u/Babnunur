import { EmbeddingFactory } from '../providers/factory';
import { Chunk } from '../../documents/models/chunk.model';

export class EmbeddingService {
  async embedChunks(documentId: string, userId: string, providerName?: string): Promise<void> {
    const provider = EmbeddingFactory.getProvider(providerName);
    const chunks = await Chunk.find({ documentId, userId }).sort({ chunkIndex: 1 });

    const batchSize = 100;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const texts = batch.map((c) => c.content);
      const embeddings = await provider.embed(texts);

      for (let j = 0; j < batch.length; j++) {
        await Chunk.findByIdAndUpdate(batch[j]._id, { embedding: embeddings[j] });
      }
    }
  }

  async embedQuery(text: string, providerName?: string): Promise<number[]> {
    const provider = EmbeddingFactory.getProvider(providerName);
    return provider.embedSingle(text);
  }
}

export const embeddingService = new EmbeddingService();
