export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  capabilities: string[];
  tools: string[];
  maxTokens: number;
  temperature: number;
}

export interface AgentResult {
  agentId: string;
  agentName: string;
  answer: string;
  steps: unknown[];
  citations: unknown[];
  toolsUsed: string[];
  tokenUsage: { input: number; output: number; total: number };
}
