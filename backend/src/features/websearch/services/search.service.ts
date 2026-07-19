import { SearchProviderFactory } from '../providers/provider.factory';
import { SearchOptions, SearchResult } from '../types';

export class SearchService {
  async search(query: string, options: SearchOptions = {}, providerName?: string): Promise<SearchResult[]> {
    const provider = SearchProviderFactory.getProvider(providerName);
    return provider.search(query, options);
  }

  async searchMultiple(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const providers = SearchProviderFactory.getAvailableProviders();
    const allResults: SearchResult[] = [];

    for (const name of providers) {
      try {
        const provider = SearchProviderFactory.getProvider(name);
        const results = await provider.search(query, { ...options, count: 3 });
        allResults.push(...results);
      } catch {
        // Skip failed providers
      }
    }

    const seen = new Set<string>();
    return allResults.filter((r) => {
      if (seen.has(r.url)) return false;
      seen.add(r.url);
      return true;
    }).slice(0, options.count || 10);
  }
}

export const searchService = new SearchService();
