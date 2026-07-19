export interface SearchProvider {
  readonly name: string;
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
  validateConfig(): { valid: boolean; errors: string[] };
}

export interface SearchOptions {
  count?: number;
  language?: string;
  region?: string;
  safeSearch?: boolean;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  publishedDate?: string;
}

export interface SearchHistory {
  userId: string;
  query: string;
  results: SearchResult[];
  provider: string;
  createdAt: Date;
}
