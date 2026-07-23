import { z } from 'zod';

export const createConversationSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  provider: z.string().optional(),
  model: z.string().optional(),
  systemPrompt: z.string().max(10000).optional(),
  settings: z.object({
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().min(1).max(128000).optional(),
    topP: z.number().min(0).max(1).optional(),
    systemPromptOverride: z.string().max(10000).optional(),
  }).optional(),
});

export const updateConversationSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  provider: z.string().optional(),
  model: z.string().optional(),
  systemPrompt: z.string().max(10000).optional(),
  settings: z.object({
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().min(1).max(128000).optional(),
    topP: z.number().min(0).max(1).optional(),
    systemPromptOverride: z.string().max(10000).optional(),
  }).optional(),
  tags: z.array(z.string()).optional(),
});

export const queryConversationSchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  search: z.string().optional(),
  status: z.enum(['active', 'archived', 'deleted']).optional(),
  provider: z.string().optional(),
  favorite: z.enum(['true', 'false']).optional(),
  pinned: z.enum(['true', 'false']).optional(),
  sort: z.enum(['updatedAt', '-updatedAt', 'lastMessageAt', '-lastMessageAt', 'createdAt', '-createdAt']).optional().default('-lastMessageAt'),
});

const attachmentSchema = z.object({
  url: z.string(),
  name: z.string().min(1),
  type: z.string().min(1),
  size: z.number().positive(),
});

export const sendMessageSchema = z.object({
  conversationId: z.string().min(1),
  message: z.string().min(1).max(100000),
  provider: z.string().optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(128000).optional(),
  attachments: z.array(attachmentSchema).optional(),
});

export const streamMessageSchema = z.object({
  conversationId: z.string().min(1),
  message: z.string().max(100000),
  provider: z.string().optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(128000).optional(),
  requestId: z.string().optional(),
  attachments: z.array(attachmentSchema).optional(),
});

export const messageParamsSchema = z.object({
  conversationId: z.string().min(1),
  limit: z.string().optional().default('50'),
  before: z.string().optional(),
});

export const messageIdParamsSchema = z.object({
  id: z.string().min(1),
});
