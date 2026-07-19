import { BaseSearchProvider } from './base-search';
import { SearchOptions, SearchResult } from '../types';

interface DuckDuckGoResponse {
  Heading?: string;
  AbstractText?: string;
  AbstractURL?: string;
  RelatedTopics?: Array<{
    Text?: string;
    FirstURL?: string;
  }>;
}

export class DuckDuckGoSearchProvider extends BaseSearchProvider {
  readonly name = 'duckduckgo';

  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const count = options.count || 5;

    try {
      const response = await fetch(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
      );
      const data = (await response.json()) as DuckDuckGoResponse;

      const results: SearchResult[] = [];

      if (data.AbstractText) {
        results.push({
          title: data.Heading || query,
          url: data.AbstractURL || '',
          snippet: this.cleanSnippet(data.AbstractText),
          source: 'DuckDuckGo',
        });
      }

      if (data.RelatedTopics) {
        for (const topic of data.RelatedTopics.slice(0, count - results.length)) {
          if (topic.Text && topic.FirstURL) {
            results.push({
              title: topic.Text.split(' - ')[0] || topic.Text.slice(0, 100),
              url: topic.FirstURL,
              snippet: this.cleanSnippet(topic.Text),
              source: 'DuckDuckGo',
            });
          }
        }
      }

      return results.slice(0, count);
    } catch {
      return [];
    }
  }

  validateConfig(): { valid: boolean; errors: string[] } {
    return { valid: true, errors: [] };
  }
}
