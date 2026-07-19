import { AgentPlan, AgentStep, AgentResponse } from '../types';
import { toolExecutor } from '../../tools/executor';
import { searchService } from '../../websearch/services/search.service';
import { ragService } from '../../rag/services/rag.service';
import { memoryService } from './memory.service';

export class ExecutorService {
  async execute(plan: AgentPlan, userId: string, conversationId: string): Promise<AgentResponse> {
    memoryService.get(conversationId);
    const executedSteps: AgentStep[] = [];
    const allCitations: unknown[] = [];
    const toolsUsed: string[] = [];

    for (const step of plan.steps) {
      if (step.type === 'think') {
        executedSteps.push(step);
        memoryService.addFact(conversationId, step.content);
      } else if (step.type === 'act') {
        if (step.searchQuery) {
          const results = await searchService.search(step.searchQuery, { count: 5 });
          step.searchResults = results;
          executedSteps.push(step);
        } else if (step.toolCall) {
          const result = await toolExecutor.execute({
            id: Date.now().toString(),
            name: step.toolCall.name,
            arguments: step.toolCall.arguments,
          }, userId);
          step.toolCall.result = result.data;
          executedSteps.push(step);
          toolsUsed.push(step.toolCall.name);
          memoryService.addToolUse(conversationId, step.toolCall.name);
        } else if (step.documentIds?.length) {
          const results = await ragService.chatWithDocuments(
            { query: step.content, documentIds: step.documentIds },
            userId
          );
          allCitations.push(...results.citations);
          step.content = results.response;
          executedSteps.push(step);
        }
      } else if (step.type === 'respond') {
        executedSteps.push(step);
      }
    }

    const finalResponse = executedSteps.filter((s) => s.type === 'respond').map((s) => s.content).join('\n') || 'I have completed the requested task.';

    memoryService.addMessage(conversationId, 'assistant', finalResponse);

    return {
      answer: finalResponse,
      steps: executedSteps,
      citations: allCitations,
      toolsUsed,
      tokenUsage: { input: 0, output: 0, total: 0 },
    };
  }
}

export const executorService = new ExecutorService();
