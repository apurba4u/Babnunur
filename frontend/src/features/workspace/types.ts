export type WorkspaceTab = 'documents' | 'search';

export interface SearchResult {
  _id: string;
  documentId: string;
  documentTitle: string;
  content: string;
  pageNumber?: number;
  score: number;
  chunkIndex: number;
}

export interface Citation {
  _id: string;
  documentId: string;
  documentTitle: string;
  content: string;
  pageNumber?: number;
  score: number;
  startOffset: number;
  endOffset: number;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
  provider: string;
}

export interface WorkspaceState {
  activeTab: WorkspaceTab;
  selectedDocuments: string[];
  searchQuery: string;
  citations: Citation[];
}
