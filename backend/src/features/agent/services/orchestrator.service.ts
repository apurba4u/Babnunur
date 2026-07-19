import { plannerService } from './planner.service';
import { executorService } from './executor.service';
import { agentMemoryService } from './memory.service';
import { AgentResponse } from '../types';
import { ChatMessage } from '../../ai/types';

export class OrchestratorService {
  async run(goal: string, conversationId: string, userId: string, options: { provider?: string; documentIds?: string[] } = {}): Promise<AgentResponse> {
    const memory = await agentMemoryService.get(conversationId, userId);
    const history = memory.messages.slice(-10) as ChatMessage[];

    await agentMemoryService.addMessage(conversationId, userId, 'user', goal);

    const plan = await plannerService.plan(goal, history, options);
    const response = await executorService.execute(plan, userId, conversationId);

    return response;
  }
}

export const orchestratorService = new OrchestratorService();
