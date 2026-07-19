import { memoryService } from '../../memory/services/memory.service';
import { AgentMemory } from '../types';

export class AgentMemoryService {
  async get(conversationId: string, userId: string): Promise<AgentMemory> {
    const entries = await memoryService.search({ userId, conversationId, limit: 50 });
    return {
      conversationId,
      messages: entries.filter(e => e.type === 'session').map(e => ({ role: 'user', content: e.content })),
      facts: entries.filter(e => e.type === 'fact').map(e => e.content),
      toolsUsed: [],
      documentsReferenced: [],
    };
  }

  async addMessage(conversationId: string, userId: string, role: string, content: string): Promise<void> {
    await memoryService.add({ userId, conversationId, type: 'session', content, importance: 0.5, metadata: { role } });
  }

  async addFact(conversationId: string, userId: string, fact: string): Promise<void> {
    await memoryService.add({ userId, conversationId, type: 'fact', content: fact, importance: 0.8, metadata: {} });
  }

  async addTopic(conversationId: string, userId: string, topic: string): Promise<void> {
    await memoryService.add({ userId, conversationId, type: 'topic', content: topic, importance: 0.6, metadata: {} });
  }
}

export const agentMemoryService = new AgentMemoryService();
