import { Tool, ToolResult } from '../types';

export const calculatorTool: Tool = {
  name: 'calculator',
  description: 'Evaluate mathematical expressions. Supports +, -, *, /, ^, parentheses, and common math functions.',
  parameters: {
    expression: { type: 'string', description: 'Mathematical expression to evaluate', required: true },
  },
  timeout: 5000,
  execute: async (params): Promise<ToolResult> => {
    const start = Date.now();
    try {
      const expr = params.expression as string;
      const sanitized = expr.replace(/[^0-9+\-*/().^% ]/g, '');
      if (!sanitized) throw new Error('Invalid expression');
      // eslint-disable-next-line no-eval
      const result = Function(`"use strict"; return (${sanitized})`)();
      return { success: true, data: { expression: expr, result }, executionTime: Date.now() - start };
    } catch (e) {
      return { success: false, data: null, error: (e as Error).message, executionTime: Date.now() - start };
    }
  },
};
