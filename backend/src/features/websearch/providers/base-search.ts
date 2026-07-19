import { SearchProvider, SearchOptions, SearchResult } from '../types';

export abstract class BaseSearchProvider implements SearchProvider {
  abstract readonly name: string;

  abstract search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
  abstract validateConfig(): { valid: boolean; errors: string[] };

  protected cleanSnippet(text: string): string {
    return text.replace(/<[^>]*>/g, '').trim().slice(0, 300);
  }
}
