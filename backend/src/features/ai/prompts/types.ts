export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  version: number;
  systemPrompt: string;
  variables: string[];
  tags: string[];
  supportedProviders: string[];
  supportedModels: string[];
  maxTokens: number;
  temperature: number;
  priority: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PromptContext {
  user: { id: string; name: string; email: string };
  conversation: { id: string; title: string };
  history: Array<{ role: string; content: string }>;
  featureContext: Record<string, unknown>;
}

export interface RenderedPrompt {
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  renderedLength: number;
  estimatedTokens: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface PromptAnalytics {
  templateId: string;
  version: number;
  provider: string;
  model: string;
  renderedLength: number;
  estimatedTokens: number;
}