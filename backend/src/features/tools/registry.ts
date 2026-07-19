import { Tool } from './types';
import { calculatorTool } from './tools/calculator';
import { datetimeTool } from './tools/datetime';
import { uuidTool } from './tools/uuid';
import { jsonFormatterTool } from './tools/json-formatter';

class ToolRegistry {
  private tools = new Map<string, Tool>();

  constructor() {
    this.register(calculatorTool);
    this.register(datetimeTool);
    this.register(uuidTool);
    this.register(jsonFormatterTool);
  }

  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  getAll(): Tool[] {
    return Array.from(this.tools.values());
  }

  getSchemas() {
    return this.getAll().map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    }));
  }
}

export const toolRegistry = new ToolRegistry();
