'use client';

import { useState } from 'react';
import { Layers, FileText, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useChat } from '@/features/ai-chat/hooks/useChat';
import { MessageBubble } from '@/features/ai-chat/components/message-bubble';
import { ChatInput } from '@/features/ai-chat/components/chat-input';
import { TypingIndicator } from '@/features/ai-chat/components/typing-indicator';
import { DocumentPanel } from '@/features/workspace/components/document-panel';
import { SearchPanel } from '@/features/workspace/components/search-panel';
import { CitationViewer } from '@/features/workspace/components/citation-viewer';
import { WorkspaceTab, Citation } from '@/features/workspace/types';

export default function WorkspacePage() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('documents');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [citations] = useState<Citation[]>([]);

  const { messages, isStreaming, partialMessage, sendMessage, stopStream } = useChat(null);

  const handleSend = (message: string) => {
    const contextMessage = selectedDocuments.length > 0
      ? `[Context: ${selectedDocuments.length} selected documents]\n${message}`
      : message;
    sendMessage(contextMessage);
  };

  return (
    <div className="flex h-full gap-4">
      <aside className="w-80 shrink-0 border rounded-lg bg-card flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="h-5 w-5" />
            <span className="font-semibold">Workspace</span>
          </div>
          <div className="flex gap-1">
            <Button
              variant={activeTab === 'documents' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('documents')}
              className="flex-1"
            >
              <FileText className="h-4 w-4 mr-2" />
              Documents
            </Button>
            <Button
              variant={activeTab === 'search' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('search')}
              className="flex-1"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          {activeTab === 'documents' ? (
            <DocumentPanel
              selectedDocuments={selectedDocuments}
              onSelectionChange={setSelectedDocuments}
            />
          ) : (
            <SearchPanel />
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col border rounded-lg bg-card overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !isStreaming && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Layers className="h-12 w-12 mb-4 opacity-50" />
              <h2 className="text-lg font-medium mb-2">AI Workspace</h2>
              <p className="text-sm text-center max-w-md">
                Select documents and ask questions. The AI will use your
                selected documents as context.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <MessageBubble
              key={message._id}
              message={message}
            />
          ))}

          {isStreaming && partialMessage && (
            <MessageBubble
              message={{
                _id: 'partial',
                conversationId: '',
                userId: '',
                role: 'assistant',
                content: partialMessage,
                messageType: 'text',
                sequenceNumber: messages.length + 1,
                status: 'streaming',
                provider: '',
                modelName: '',
                tokenCount: 0,
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0,
                latencyMs: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }}
              isPartial
            />
          )}

          {isStreaming && !partialMessage && <TypingIndicator />}

          {citations.length > 0 && (
            <div className="mt-4">
              <CitationViewer citations={citations} />
            </div>
          )}
        </div>

        <ChatInput
          onSend={handleSend}
          onStop={stopStream}
          isStreaming={isStreaming}
          disabled={false}
        />
      </main>
    </div>
  );
}
