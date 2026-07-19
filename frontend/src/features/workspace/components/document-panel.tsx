'use client';

import { useState } from 'react';
import { useDocuments } from '../../documents/hooks/useDocuments';
import { Button } from '@/components/ui/button';
import { FileText, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentPanelProps {
  selectedDocuments: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function DocumentPanel({ selectedDocuments, onSelectionChange }: DocumentPanelProps) {
  const { data, isLoading } = useDocuments();
  const documents = data?.data?.data || [];

  const toggleDocument = (id: string) => {
    if (selectedDocuments.includes(id)) {
      onSelectionChange(selectedDocuments.filter((d) => d !== id));
    } else {
      onSelectionChange([...selectedDocuments, id]);
    }
  };

  const selectAll = () => {
    if (selectedDocuments.length === documents.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(documents.map((d) => d._id));
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 text-sm text-muted-foreground">Loading documents...</div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Documents</span>
          <Button variant="ghost" size="sm" onClick={selectAll}>
            {selectedDocuments.length === documents.length ? 'Deselect All' : 'Select All'}
          </Button>
        </div>
        {selectedDocuments.length > 0 && (
          <div className="text-xs text-muted-foreground mt-1">
            {selectedDocuments.length} selected
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {documents.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">No documents found</div>
        ) : (
          <div className="p-2 space-y-1">
            {documents.map((doc) => {
              const isSelected = selectedDocuments.includes(doc._id);
              return (
                <button
                  key={doc._id}
                  onClick={() => toggleDocument(doc._id)}
                  className={cn(
                    'w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors',
                    isSelected
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-accent text-foreground'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded border',
                      isSelected
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-muted-foreground'
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                  </div>
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{doc.title}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {doc.status === 'ready' ? 'Ready' : doc.status}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
