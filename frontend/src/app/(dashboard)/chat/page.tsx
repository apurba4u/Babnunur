'use client';

import { ChatWindow } from '@/features/ai-chat/components/chat-window';
import { ConversationSidebar } from '@/features/ai-chat/components/conversation-sidebar';

export default function ChatPage() {
  return (
    <div className="flex h-full">
      <div className="w-64 border-r hidden md:block">
        <ConversationSidebar />
      </div>
      <div className="flex-1">
        <ChatWindow conversationId={null} />
      </div>
    </div>
  );
}
