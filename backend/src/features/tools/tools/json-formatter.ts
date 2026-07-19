import { Tool, ToolResult } from '../types';

export const jsonFormatterTool: Tool = {
  name: 'json_formatter',
  description: 'Format or validate JSON data.',
  parameters: {
    input: { type: 'string', description: 'JSON string to format', required: true },
    indent: { type: 'number', description: 'Indentation spaces', required: false, default: 2 },
  },
  timeout: 5000,
  execute: async (params): Promise<ToolResult> => {
    const start = Date.now();
    try {
      const parsed = JSON.parse(params.input as string);
      const formatted = JSON.stringify(parsed, null, params.indent as number || 2);
      return { success: true, data: { formatted, valid: true }, executionTime: Date.now() - start };
    } catch (e) {
      return { success: false, data: { valid: false, error: (e as Error).message }, executionTime: Date.now() - start };
    }
  },
};
