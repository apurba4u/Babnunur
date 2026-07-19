import { PromptTemplate, PromptContext, RenderedPrompt, ValidationResult } from './types';
import { promptRegistry } from './registry';

export class PromptEngine {
  private readonly INJECTION_PATTERNS = [
    /ignore (all )?(previous|above|prior) instructions/i,
    /you are now (a|an|the)/i,
    /system prompt:/i,
    /override (your|the) (instructions|rules|guidelines)/i,
    /disregard (your|the) (instructions|rules)/i,
  ];

  render(templateId: string, context: PromptContext, provider?: string): RenderedPrompt {
    const template = promptRegistry.get(templateId);
    if (!template) {
      throw new Error(`Prompt template '${templateId}' not found`);
    }

    let systemPrompt = template.systemPrompt;

    systemPrompt = systemPrompt.replace(/\{\{userName\}\}/g, context.user.name);
    systemPrompt = systemPrompt.replace(/\{\{userEmail\}\}/g, context.user.email);

    systemPrompt = systemPrompt.replace(/\{\{conversationTitle\}\}/g, context.conversation.title);

    for (const [key, value] of Object.entries(context.featureContext)) {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      systemPrompt = systemPrompt.replace(placeholder, String(value));
    }

    const remainingPlaceholders = systemPrompt.match(/\{\{[^}]+\}\}/g) || [];
    if (remainingPlaceholders.length > 0) {
      console.warn(`Unresolved placeholders: ${remainingPlaceholders.join(', ')}`);
    }

    if (provider) {
      systemPrompt = this.adaptForProvider(systemPrompt, provider);
    }

    const estimatedTokens = this.estimateTokens(systemPrompt);

    return {
      systemPrompt,
      temperature: template.temperature,
      maxTokens: Math.min(template.maxTokens, 4096),
      renderedLength: systemPrompt.length,
      estimatedTokens,
    };
  }

  validate(template: PromptTemplate, context: PromptContext): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!template.systemPrompt || template.systemPrompt.trim().length === 0) {
      errors.push('System prompt is empty');
    }

    for (const variable of template.variables) {
      if (!(variable in context.featureContext)) {
        errors.push(`Missing variable: ${variable}`);
      }
    }

    const placeholderPattern = /\{\{([^}]+)\}\}/g;
    let match;
    while ((match = placeholderPattern.exec(template.systemPrompt)) !== null) {
      const varName = match[1];
      if (!template.variables.includes(varName) && !['userName', 'userEmail', 'conversationTitle'].includes(varName)) {
        warnings.push(`Unresolved placeholder: {{${varName}}}`);
      }
    }

    const estimatedTokens = this.estimateTokens(template.systemPrompt);
    if (estimatedTokens > template.maxTokens) {
      warnings.push(`Prompt exceeds max tokens: ${estimatedTokens} > ${template.maxTokens}`);
    }

    if (template.supportedProviders.length === 0) {
      warnings.push('No supported providers specified');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  renderForProvider(templateId: string, context: PromptContext, provider: string): RenderedPrompt {
    const template = promptRegistry.get(templateId);
    if (!template) {
      throw new Error(`Prompt template '${templateId}' not found`);
    }

    if (!template.supportedProviders.includes(provider)) {
      throw new Error(`Template '${templateId}' does not support provider '${provider}'`);
    }

    return this.render(templateId, context, provider);
  }

  private adaptForProvider(prompt: string, provider: string): string {
    switch (provider) {
      case 'gemini':
        return prompt;
      case 'deepseek':
        return prompt;
      default:
        return prompt;
    }
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  sanitizeUserInput(input: string): string {
    let sanitized = input;

    for (const pattern of this.INJECTION_PATTERNS) {
      sanitized = sanitized.replace(pattern, '[FILTERED]');
    }

    sanitized = sanitized.replace(/\b(sk-[a-zA-Z0-9]+)\b/g, '[API_KEY]');
    sanitized = sanitized.replace(/\b(password|secret|token):\s*\S+/gi, '$1: [REDACTED]');

    return sanitized;
  }

  isPromptInjection(input: string): boolean {
    return this.INJECTION_PATTERNS.some((pattern) => pattern.test(input));
  }
}

export const promptEngine = new PromptEngine();