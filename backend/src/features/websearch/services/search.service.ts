import { SearchProviderFactory } from '../providers/provider.factory';
import { SearchOptions, SearchResult } from '../types';
import { getCache } from '../../../shared/cache';

export class SearchService {
  async search(query: string, options: SearchOptions = {}, providerName?: string): Promise<SearchResult[]> {
    const cache = getCache();
    const cacheKey = `search:${providerName || 'default'}:${query}:${JSON.stringify(options)}`;
    const cached = await cache.get<SearchResult[]>(cacheKey);
    if (cached) return cached;

    const provider = SearchProviderFactory.getProvider(providerName);
    const results = await provider.search(query, options);
    await cache.set(cacheKey, results, 300);
    return results;
  }

  async searchMultiple(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const cache = getCache();
    const cacheKey = `search:multi:${query}:${JSON.stringify(options)}`;
    const cached = await cache.get<SearchResult[]>(cacheKey);
    if (cached) return cached;

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
    const deduped = allResults.filter((r) => {
      if (seen.has(r.url)) return false;
      seen.add(r.url);
      return true;
    }).slice(0, options.count || 10);

    await cache.set(cacheKey, deduped, 300);
    return deduped;
  }
}

export const searchService = new SearchService();
