import { ProviderFactory } from '../../ai/providers/factory';
import { ChatMessage } from '../../ai/types';
import { AgentPlan, AgentStep } from '../types';
import { toolRegistry } from '../../tools/registry';
import { SearchProviderFactory } from '../../websearch/providers/provider.factory';

export class PlannerService {
  async plan(goal: string, conversationHistory: ChatMessage[], options: { provider?: string; documentIds?: string[] } = {}): Promise<AgentPlan> {
    const tools = toolRegistry.getSchemas();
    const searchProviders = SearchProviderFactory.getAvailableProviders();

    const toolDescriptions = tools.map((t) => `- ${t.name}: ${t.description}`).join('\n');
    const searchInfo = searchProviders.length > 0 ? `Available web search: ${searchProviders.join(', ')}` : 'No web search available';
    const docInfo = options.documentIds?.length ? `Documents available: ${options.documentIds.length} documents` : 'No documents attached';

    const systemPrompt = `You are a planning agent. Given a user goal, create a step-by-step plan.

Available tools:
${toolDescriptions}

${searchInfo}
${docInfo}

For each step, specify:
- type: think (reasoning), act (tool/search/document), or respond (final answer)
- For 'act' type, specify which tool to use or what action to take

Respond with a JSON array of steps. Example:
[
  {"type": "think", "content": "I need to search for information"},
  {"type": "act", "content": "Search the web", "searchQuery": "query"},
  {"type": "respond", "content": "Based on the results..."}
]

Only output the JSON array, nothing else.`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-5),
      { role: 'user', content: `Goal: ${goal}` },
    ];

    const provider = ProviderFactory.getProvider(options.provider || 'gemini');
    const response = await provider.chat(messages, { temperature: 0.3, maxTokens: 2048 });

    try {
      const jsonMatch = response.content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const steps = JSON.parse(jsonMatch[0]) as AgentStep[];
        return {
          goal,
          steps: steps.map((s, i) => ({ ...s, id: `step-${i}`, timestamp: new Date() })),
          currentStep: 0,
          status: 'planning',
        };
      }
    } catch {
      // Fall through to default plan
    }

    return {
      goal,
      steps: [
        { id: 'step-0', type: 'think', content: `Processing: ${goal}`, timestamp: new Date() },
        { id: 'step-1', type: 'respond', content: response.content, timestamp: new Date() },
      ],
      currentStep: 0,
      status: 'planning',
    };
  }
}

export const plannerService = new PlannerService();
