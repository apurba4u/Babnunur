'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { Citation } from '../types';
import { cn } from '@/lib/utils';

interface CitationViewerProps {
  citations: Citation[];
}

export function CitationViewer({ citations }: CitationViewerProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (citations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-muted-foreground">
        Citations ({citations.length})
      </div>
      {citations.map((citation) => {
        const isExpanded = expandedIds.has(citation._id);
        return (
          <div
            key={citation._id}
            className="rounded-lg border bg-card overflow-hidden"
          >
            <button
              onClick={() => toggleExpand(citation._id)}
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-accent/50 transition-colors"
              aria-expanded={isExpanded}
            >
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {citation.documentTitle}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  {citation.pageNumber && <span>Page {citation.pageNumber}</span>}
                  <span>•</span>
                  <span>{(citation.score * 100).toFixed(0)}% match</span>
                </div>
              </div>
              <div className="shrink-0">
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </button>
            <div
              className={cn(
                'overflow-hidden transition-all duration-200',
                isExpanded ? 'max-h-96' : 'max-h-0'
              )}
            >
              <div className="px-3 pb-3 pt-0">
                <div className="p-3 rounded-md bg-muted text-sm">
                  {citation.content}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
