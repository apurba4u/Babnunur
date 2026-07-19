import { AgentDefinition } from './types';

const agents: AgentDefinition[] = [
  {
    id: 'general',
    name: 'General Assistant',
    description: 'Helpful assistant for general questions and tasks',
    systemPrompt: 'You are a helpful, knowledgeable assistant. Answer questions clearly and concisely.',
    capabilities: ['chat', 'reasoning', 'math'],
    tools: ['calculator', 'datetime', 'uuid', 'json_formatter'],
    maxTokens: 4096,
    temperature: 0.7,
  },
  {
    id: 'researcher',
    name: 'Research Agent',
    description: 'Specialized in web research and information gathering',
    systemPrompt: 'You are a research specialist. Search the web, analyze sources, and provide well-cited answers with references.',
    capabilities: ['web_search', 'analysis', 'summarization'],
    tools: ['search', 'calculator', 'datetime'],
    maxTokens: 4096,
    temperature: 0.3,
  },
  {
    id: 'programmer',
    name: 'Programming Agent',
    description: 'Expert in code generation, debugging, and review',
    systemPrompt: 'You are an expert programmer. Write clean, efficient code. Explain your approach. Handle edge cases.',
    capabilities: ['code_generation', 'debugging', 'review'],
    tools: ['calculator', 'json_formatter'],
    maxTokens: 8192,
    temperature: 0.3,
  },
  {
    id: 'writer',
    name: 'Writing Agent',
    description: 'Specialized in content creation and editing',
    systemPrompt: 'You are a professional writer. Create clear, engaging content. Adapt tone to the audience.',
    capabilities: ['writing', 'editing', 'summarization'],
    tools: ['datetime', 'uuid'],
    maxTokens: 4096,
    temperature: 0.7,
  },
  {
    id: 'analyst',
    name: 'Document Agent',
    description: 'Analyzes documents and extracts insights',
    systemPrompt: 'You are a document analysis expert. Extract key information, summarize, and answer questions about documents.',
    capabilities: ['document_analysis', 'extraction', 'summarization'],
    tools: ['json_formatter'],
    maxTokens: 4096,
    temperature: 0.3,
  },
  {
    id: 'reasoner',
    name: 'Reasoning Agent',
    description: 'Excels at complex reasoning and problem-solving',
    systemPrompt: 'You are a reasoning expert. Think step by step. Show your reasoning process clearly.',
    capabilities: ['reasoning', 'logic', 'math', 'planning'],
    tools: ['calculator', 'datetime'],
    maxTokens: 4096,
    temperature: 0.5,
  },
];

export function getAgent(id: string): AgentDefinition | undefined {
  return agents.find(a => a.id === id);
}

export function getAgents(): AgentDefinition[] {
  return agents;
}

export function getAgentByCapability(capability: string): AgentDefinition[] {
  return agents.filter(a => a.capabilities.includes(capability));
}

export function selectBestAgent(query: string): AgentDefinition {
  const lower = query.toLowerCase();
  if (lower.match(/code|program|debug|function|class|api/)) return getAgent('programmer')!;
  if (lower.match(/search|find|research|web|news/)) return getAgent('researcher')!;
  if (lower.match(/write|draft|essay|article|content/)) return getAgent('writer')!;
  if (lower.match(/analyze|document|summary|extract/)) return getAgent('analyst')!;
  if (lower.match(/reason|logic|prove|solve|think/)) return getAgent('reasoner')!;
  return getAgent('general')!;
}
