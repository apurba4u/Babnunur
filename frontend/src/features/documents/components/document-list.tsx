'use client';

import { FileText, Trash2, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDocuments, useDeleteDocument } from '../hooks/useDocuments';
import { Document } from '../types';

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function StatusIcon({ status }: { status: Document['status'] }) {
  switch (status) {
    case 'ready': return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'processing': return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
    default: return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
}

export function DocumentList() {
  const { data, isLoading } = useDocuments();
  const deleteDocument = useDeleteDocument();
  const documents = data?.data.data || [];

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading documents...</div>;
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
        <p>No documents uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <div key={doc._id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
          <div className="flex items-center gap-3">
            <StatusIcon status={doc.status} />
            <div>
              <p className="text-sm font-medium">{doc.title}</p>
              <p className="text-xs text-muted-foreground">
                {formatSize(doc.size)} · {doc.chunkCount} chunks · {new Date(doc.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => deleteDocument.mutate(doc._id)}
            disabled={deleteDocument.isPending}
            aria-label={`Delete ${doc.title}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}