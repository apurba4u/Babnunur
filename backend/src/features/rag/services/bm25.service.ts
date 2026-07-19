import { Chunk } from '../../documents/models/chunk.model';

export class BM25Service {
  private avgDocLength = 100;
  private idf = new Map<string, number>();

  async search(query: string, userId: string, topK: number = 10): Promise<Array<{ chunkId: string; score: number; content: string; documentId: string }>> {
    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    if (terms.length === 0) return [];

    const chunks = await Chunk.find({ userId, content: { $exists: true, $ne: '' } }).lean();
    if (chunks.length === 0) return [];

    this.avgDocLength = chunks.reduce((sum, c) => sum + c.content.length, 0) / chunks.length;
    const N = chunks.length;

    const scored = chunks.map(chunk => {
      const doc = chunk.content.toLowerCase();
      let score = 0;
      for (const term of terms) {
        const tf = (doc.match(new RegExp(term, 'g')) || []).length / doc.length;
        const df = chunks.filter(c => c.content.toLowerCase().includes(term)).length;
        const idf = Math.log((N - df + 0.5) / (df + 0.5) + 1);
        score += tf * idf;
      }
      return { chunkId: chunk._id.toString(), score, content: chunk.content, documentId: chunk.documentId };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }
}

export const bm25Service = new BM25Service();