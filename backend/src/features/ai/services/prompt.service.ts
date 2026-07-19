import { promptEngine } from '../prompts/engine';
import { promptRegistry } from '../prompts/registry';
import { PromptContext, PromptAnalytics, PromptTemplate, ValidationResult } from '../prompts/types';
import { RenderedPrompt } from '../prompts/types';

export class PromptService {
  renderPrompt(templateId: string, context: PromptContext, provider: string): { rendered: RenderedPrompt; analytics: PromptAnalytics } {
    const rendered = promptEngine.renderForProvider(templateId, context, provider);
    const template = promptRegistry.get(templateId);

    const analytics: PromptAnalytics = {
      templateId,
      version: template?.version || 0,
      provider,
      model: '',
      renderedLength: rendered.renderedLength,
      estimatedTokens: rendered.estimatedTokens,
    };

    return { rendered, analytics };
  }

  getTemplates(category?: string): PromptTemplate[] {
    if (category) {
      return promptRegistry.listByCategory(category);
    }
    return promptRegistry.list();
  }

  getTemplate(id: string): PromptTemplate | undefined {
    return promptRegistry.get(id);
  }

  getCategories(): string[] {
    return promptRegistry.getAllCategories();
  }

  validatePrompt(templateId: string, context: PromptContext): ValidationResult {
    const template = promptRegistry.get(templateId);
    if (!template) {
      return { valid: false, errors: [`Template '${templateId}' not found`], warnings: [] };
    }
    return promptEngine.validate(template, context);
  }

  sanitizeInput(input: string): string {
    return promptEngine.sanitizeUserInput(input);
  }

  detectInjection(input: string): boolean {
    return promptEngine.isPromptInjection(input);
  }
}

export const promptService = new PromptService();