import { PromptTemplate } from './types';
import {
  chatDefault, codeAssistant, contentGenerator,
  documentAnalyzer, reasoningAssistant, summarizer,
  translator, recommendationEngine,
} from './templates/chat';

class PromptRegistry {
  private templates = new Map<string, PromptTemplate[]>();

  constructor() {
    this.registerBulk([
      chatDefault, codeAssistant, contentGenerator,
      documentAnalyzer, reasoningAssistant, summarizer,
      translator, recommendationEngine,
    ]);
  }

  register(template: PromptTemplate): void {
    const existing = this.templates.get(template.id) || [];
    existing.push(template);
    existing.sort((a, b) => b.version - a.version);
    this.templates.set(template.id, existing);
  }

  registerBulk(templates: PromptTemplate[]): void {
    for (const template of templates) {
      this.register(template);
    }
  }

  unregister(id: string): boolean {
    return this.templates.delete(id);
  }

  get(id: string, version?: number): PromptTemplate | undefined {
    const versions = this.templates.get(id);
    if (!versions || versions.length === 0) return undefined;
    if (version) {
      return versions.find((v) => v.version === version);
    }
    return versions[0];
  }

  getLatestVersion(id: string): PromptTemplate | undefined {
    const versions = this.templates.get(id);
    if (!versions || versions.length === 0) return undefined;
    return versions[0];
  }

  list(feature?: string): PromptTemplate[] {
    const all = Array.from(this.templates.values())
      .map((versions) => versions[0])
      .filter((t) => t.enabled);
    if (feature) {
      return all.filter((t) => t.tags.includes(feature) || t.category === feature);
    }
    return all;
  }

  listByCategory(category: string): PromptTemplate[] {
    return Array.from(this.templates.values())
      .map((versions) => versions[0])
      .filter((t) => t.category === category && t.enabled);
  }

  getVersions(id: string): PromptTemplate[] {
    return this.templates.get(id) || [];
  }

  getAllCategories(): string[] {
    const categories = new Set<string>();
    for (const versions of this.templates.values()) {
      if (versions[0]) categories.add(versions[0].category);
    }
    return Array.from(categories);
  }
}

export const promptRegistry = new PromptRegistry();