'use client';

import { UploadZone } from '@/features/documents/components/upload-zone';
import { DocumentList } from '@/features/documents/components/document-list';

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Documents</h1>
      <UploadZone />
      <DocumentList />
    </div>
  );
}