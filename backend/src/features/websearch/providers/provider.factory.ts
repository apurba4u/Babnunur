import { SearchProvider } from '../types';
import { DuckDuckGoSearchProvider } from './duckduckgo-search';

export class SearchProviderFactory {
  private static providers = new Map<string, SearchProvider>();

  static {
    SearchProviderFactory.register(new DuckDuckGoSearchProvider());
  }

  static register(provider: SearchProvider): void {
    SearchProviderFactory.providers.set(provider.name, provider);
  }

  static getProvider(name?: string): SearchProvider {
    const provider = name
      ? SearchProviderFactory.providers.get(name)
      : SearchProviderFactory.providers.get('duckduckgo');
    if (!provider) throw new Error(`Search provider '${name}' not found`);
    return provider;
  }

  static getAvailableProviders(): string[] {
    return Array.from(SearchProviderFactory.providers.keys());
  }
}
