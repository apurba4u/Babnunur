import { Conversation } from '../../chat/models/conversation.model';
import { Message } from '../../chat/models/message.model';
import { Document } from '../../documents/models/document.model';
import { Item } from '../../items/models/item.model';
import { ProviderFactory } from '../../ai/providers/factory';
import { promptRegistry } from '../../ai/prompts/registry';
import { promptEngine } from '../../ai/prompts/engine';

interface RecommendationsResult {
  recommendations: string[];
  productivityTips: string[];
  insights: string[];
  actionCards: { title: string; description: string; link: string }[];
  recentActivity: { conversations: number; documents: number; items: number };
}

export class RecommendationService {
  async generate(userId: string): Promise<RecommendationsResult> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [conversations, documents, items] = await Promise.all([
      Conversation.countDocuments({ userId, createdAt: { $gte: sevenDaysAgo } }),
      Document.countDocuments({ userId, createdAt: { $gte: sevenDaysAgo } }),
      Item.countDocuments({ userId, createdAt: { $gte: sevenDaysAgo } }),
    ]);

    const recentActivity = { conversations, documents, items };

    const template = promptRegistry.get('recommendation-engine');
    const providerName = this.getBestProvider();

    let content: string;
    if (template && providerName) {
      const rendered = promptEngine.renderForProvider('recommendation-engine', {
        user: { id: userId, name: '', email: '' },
        conversation: { id: '', title: '' },
        history: [],
        featureContext: {
          conversations: String(conversations),
          documents: String(documents),
          items: String(items),
        },
      }, providerName);

      const provider = ProviderFactory.getProvider(providerName);
      try {
        const response = await provider.chat([
          { role: 'system', content: rendered.systemPrompt },
          { role: 'user', content: this.buildPrompt(recentActivity) },
        ], { temperature: 0.7, maxTokens: 2048 });
        content = response.content;
      } catch (aiError) {
        const fallbackProvider = ProviderFactory.getAvailableProviders().find(p => p.name !== providerName);
        if (fallbackProvider) {
          try {
            const fbProvider = ProviderFactory.getProvider(fallbackProvider.name);
            const response = await fbProvider.chat([
              { role: 'system', content: rendered.systemPrompt },
              { role: 'user', content: this.buildPrompt(recentActivity) },
            ], { temperature: 0.7, maxTokens: 2048 });
            content = response.content;
          } catch {
            content = await this.fallbackGenerate(recentActivity);
          }
        } else {
          content = await this.fallbackGenerate(recentActivity);
        }
      }
    } else {
      content = await this.fallbackGenerate(recentActivity);
    }

    return this.parseResponse(content, recentActivity);
  }

  private buildPrompt(activity: { conversations: number; documents: number; items: number }): string {
    return `Based on the following user activity in the last 7 days, provide personalized recommendations:

- Conversations: ${activity.conversations}
- Documents uploaded: ${activity.documents}
- Items created: ${activity.items}

Provide:
1. 3-4 personalized recommendations
2. 2-3 productivity tips
3. 2-3 insights about their usage patterns
4. 2-3 action cards with title, description, and link

Format as JSON with keys: recommendations, productivityTips, insights, actionCards (array of { title, description, link })`;
  }

  private parseResponse(content: string, recentActivity: { conversations: number; documents: number; items: number }): RecommendationsResult {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
      return {
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        productivityTips: Array.isArray(parsed.productivityTips) ? parsed.productivityTips : [],
        insights: Array.isArray(parsed.insights) ? parsed.insights : [],
        actionCards: Array.isArray(parsed.actionCards) ? parsed.actionCards : [],
        recentActivity,
      };
    } catch {
      return {
        recommendations: ['Explore your recent conversations for insights'],
        productivityTips: ['Try organizing your documents into categories'],
        insights: ['You have been actively using the platform'],
        actionCards: [
          { title: 'Review Conversations', description: 'Check your recent chat history', link: '/conversations' },
          { title: 'Upload Documents', description: 'Add more documents to your knowledge base', link: '/documents' },
        ],
        recentActivity,
      };
    }
  }

  private async fallbackGenerate(activity: { conversations: number; documents: number; items: number }): Promise<string> {
    const recommendations: string[] = [];
    const tips: string[] = [];
    const insights: string[] = [];

    if (activity.conversations > 0) {
      recommendations.push('Continue your recent conversations to maintain momentum');
      insights.push(`You had ${activity.conversations} conversations this week`);
    } else {
      recommendations.push('Start a new conversation to explore AI assistance');
      tips.push('Try asking Babnunur to help you brainstorm ideas');
    }

    if (activity.documents > 0) {
      recommendations.push('Organize your documents into folders for better accessibility');
      insights.push(`You uploaded ${activity.documents} documents this week`);
      tips.push('Use document analysis to extract key insights from your uploads');
    }

    if (activity.items > 0) {
      recommendations.push('Review and categorize your recent items');
      insights.push(`You created ${activity.items} new items`);
    }

    if (activity.conversations === 0 && activity.documents === 0 && activity.items === 0) {
      recommendations.push('Start by creating a new conversation or uploading a document');
      tips.push('Babnunur can help you with writing, analysis, research, and more');
      insights.push('You have not been active this week - check out what\'s new');
    }

    const fallback: RecommendationsResult = {
      recommendations: recommendations.length > 0 ? recommendations : ['Explore Babnunur features to boost your productivity'],
      productivityTips: tips.length > 0 ? tips : ['Set aside time daily to review your AI interactions'],
      insights: insights.length > 0 ? insights : ['Start using Babnunur to track your productivity patterns'],
      actionCards: [
        { title: 'Start a Conversation', description: 'Chat with Babnunur AI', link: '/chat' },
        { title: 'Upload Documents', description: 'Add documents for AI analysis', link: '/documents' },
      ],
      recentActivity: activity,
    };

    return JSON.stringify(fallback);
  }

  private getBestProvider(): string {
    try {
      const providers = ProviderFactory.getAvailableProviders();
      if (providers.some(p => p.name === 'gemini')) return 'gemini';
      if (providers.some(p => p.name === 'deepseek')) return 'deepseek';
      return '';
    } catch {
      return '';
    }
  }
}

export const recommendationService = new RecommendationService();
