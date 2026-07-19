export interface AgentStep {
  id: string;
  type: 'think' | 'act' | 'observe' | 'respond';
  content: string;
  toolCall?: { name: string; arguments: Record<string, unknown>; result?: unknown };
  searchQuery?: string;
  searchResults?: unknown[];
  documentIds?: string[];
  timestamp: Date;
}

export interface AgentPlan {
  goal: string;
  steps: AgentStep[];
  currentStep: number;
  status: 'planning' | 'executing' | 'completed' | 'failed';
}

export interface AgentMemory {
  conversationId: string;
  messages: Array<{ role: string; content: string }>;
  facts: string[];
  toolsUsed: string[];
  documentsReferenced: string[];
}

export interface AgentResponse {
  answer: string;
  steps: AgentStep[];
  citations: unknown[];
  toolsUsed: string[];
  tokenUsage: { input: number; output: number; total: number };
}
