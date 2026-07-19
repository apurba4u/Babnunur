'use client';

import { useState, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ExternalLink } from 'lucide-react';
import { useSearch } from '../hooks/useSearch';

export function SearchPanel() {
  const [query, setQuery] = useState('');
  const { search, results, isSearching, error } = useSearch();

  const handleSearch = () => {
    if (query.trim()) {
      search(query);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search documents..."
            disabled={isSearching}
          />
          <Button onClick={handleSearch} disabled={!query.trim() || isSearching} size="icon" aria-label="Search documents">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {error && (
          <div className="text-sm text-destructive mb-4">{error}</div>
        )}

        {isSearching && (
          <div className="text-sm text-muted-foreground">Searching...</div>
        )}

        {!isSearching && results.length === 0 && query.trim() && !error && (
          <div className="text-sm text-muted-foreground">No results found</div>
        )}

        <div className="space-y-3">
          {results.map((result) => (
            <div
              key={result._id}
              className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {result.documentTitle}
                  </div>
                  {result.pageNumber && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Page {result.pageNumber}
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                    {result.content}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {(result.score * 100).toFixed(0)}%
                  </span>
                  <a
                    href={`/documents/${result.documentId}`}
                    className="inline-flex items-center justify-center h-6 w-6 rounded-md hover:bg-accent transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
