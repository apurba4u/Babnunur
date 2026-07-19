import { Tool, ToolResult } from '../types';

export const datetimeTool: Tool = {
  name: 'datetime',
  description: 'Get current date and time, or format a timestamp.',
  parameters: {
    format: { type: 'string', description: 'Format: iso, date, time, datetime, timestamp', required: false, default: 'datetime' },
    timezone: { type: 'string', description: 'Timezone (e.g., UTC, America/New_York)', required: false, default: 'UTC' },
  },
  timeout: 5000,
  execute: async (params): Promise<ToolResult> => {
    const start = Date.now();
    const now = new Date();
    const format = (params.format as string) || 'datetime';
    let result: string;
    switch (format) {
      case 'iso': result = now.toISOString(); break;
      case 'date': result = now.toLocaleDateString(); break;
      case 'time': result = now.toLocaleTimeString(); break;
      case 'timestamp': result = now.getTime().toString(); break;
      default: result = now.toISOString();
    }
    return { success: true, data: { datetime: result, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }, executionTime: Date.now() - start };
  },
};
