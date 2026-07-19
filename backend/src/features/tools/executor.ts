import { Tool, ToolCall, ToolResult } from './types';
import { toolRegistry } from './registry';

export class ToolExecutor {
  async execute(toolCall: ToolCall, userId: string): Promise<ToolResult> {
    const tool = toolRegistry.get(toolCall.name);
    if (!tool) {
      return { success: false, data: null, error: `Tool '${toolCall.name}' not found`, executionTime: 0 };
    }

    // Validate parameters
    for (const [key, param] of Object.entries(tool.parameters)) {
      if (param.required && !(key in toolCall.arguments)) {
        return { success: false, data: null, error: `Missing required parameter: ${key}`, executionTime: 0 };
      }
    }

    // Apply defaults
    const params = { ...toolCall.arguments };
    for (const [key, param] of Object.entries(tool.parameters)) {
      if (!(key in params) && param.default !== undefined) {
        params[key] = param.default;
      }
    }

    // Execute with timeout
    const timeout = tool.timeout || 10000;
    return Promise.race([
      tool.execute(params, userId),
      new Promise<ToolResult>((resolve) =>
        setTimeout(() => resolve({ success: false, data: null, error: 'Tool execution timed out', executionTime: timeout }), timeout)
      ),
    ]);
  }

  async executeMultiple(toolCalls: ToolCall[], userId: string): Promise<ToolResult[]> {
    return Promise.all(toolCalls.map((tc) => this.execute(tc, userId)));
  }
}

export const toolExecutor = new ToolExecutor();
