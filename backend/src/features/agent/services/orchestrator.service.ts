import { plannerService } from './planner.service';
import { executorService } from './executor.service';
import { memoryService } from './memory.service';
import { AgentResponse } from '../types';
import { ChatMessage } from '../../ai/types';

export class OrchestratorService {
  async run(goal: string, conversationId: string, userId: string, options: { provider?: string; documentIds?: string[] } = {}): Promise<AgentResponse> {
    const memory = memoryService.get(conversationId);
    const history = memory.messages.slice(-10) as ChatMessage[];

    memoryService.addMessage(conversationId, 'user', goal);

    const plan = await plannerService.plan(goal, history, options);
    const response = await executorService.execute(plan, userId, conversationId);

    return response;
  }
}

export const orchestratorService = new OrchestratorService();
