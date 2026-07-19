import { Tool, ToolResult } from '../types';
import crypto from 'crypto';

export const uuidTool: Tool = {
  name: 'uuid',
  description: 'Generate a UUID v4.',
  parameters: {},
  timeout: 5000,
  execute: async (): Promise<ToolResult> => {
    const start = Date.now();
    return { success: true, data: { uuid: crypto.randomUUID() }, executionTime: Date.now() - start };
  },
};
