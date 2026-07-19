import { AgentMemory } from '../types';

export class MemoryService {
  private memories = new Map<string, AgentMemory>();

  get(conversationId: string): AgentMemory {
    if (!this.memories.has(conversationId)) {
      this.memories.set(conversationId, {
        conversationId,
        messages: [],
        facts: [],
        toolsUsed: [],
        documentsReferenced: [],
      });
    }
    return this.memories.get(conversationId)!;
  }

  addMessage(conversationId: string, role: string, content: string): void {
    const memory = this.get(conversationId);
    memory.messages.push({ role, content });
    if (memory.messages.length > 20) memory.messages.shift();
  }

  addFact(conversationId: string, fact: string): void {
    const memory = this.get(conversationId);
    if (!memory.facts.includes(fact)) memory.facts.push(fact);
  }

  addToolUse(conversationId: string, toolName: string): void {
    const memory = this.get(conversationId);
    if (!memory.toolsUsed.includes(toolName)) memory.toolsUsed.push(toolName);
  }

  addDocumentReference(conversationId: string, documentId: string): void {
    const memory = this.get(conversationId);
    if (!memory.documentsReferenced.includes(documentId)) memory.documentsReferenced.push(documentId);
  }

  clear(conversationId: string): void {
    this.memories.delete(conversationId);
  }
}

export const memoryService = new MemoryService();
