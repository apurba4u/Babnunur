'use client';

import { FileText, Trash2, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
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
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
            <Skeleton className="h-8 w-8 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <EmptyState icon={<FileText className="h-8 w-8" />} title="No documents uploaded yet" description="Upload a PDF, DOCX, or text file to get started." />
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