import { describe, it, expect } from 'vitest';
import { chunkService } from '../features/documents/services/chunk.service';

describe('Chunk Service', () => {
  it('should chunk short text into single chunk', () => {
    const chunks = chunkService.chunkText('Hello world');
    expect(chunks.length).toBe(1);
    expect(chunks[0].content).toBe('Hello world');
  });

  it('should handle empty text', () => {
    const chunks = chunkService.chunkText('');
    expect(chunks.length).toBe(0);
  });

  it('should chunk long text', () => {
    const text = 'A'.repeat(2000);
    const chunks = chunkService.chunkText(text, { chunkSize: 500, chunkOverlap: 100 });
    expect(chunks.length).toBeGreaterThan(1);
  });
});
