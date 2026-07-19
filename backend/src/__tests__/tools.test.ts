import { describe, it, expect } from 'vitest';
import { toolRegistry } from '../features/tools/registry';
import { toolExecutor } from '../features/tools/executor';

describe('Tool Registry', () => {
  it('should have 4 tools registered', () => {
    expect(toolRegistry.getAll().length).toBe(4);
  });

  it('should find calculator tool', () => {
    expect(toolRegistry.get('calculator')).toBeDefined();
  });

  it('should find datetime tool', () => {
    expect(toolRegistry.get('datetime')).toBeDefined();
  });

  it('should find uuid tool', () => {
    expect(toolRegistry.get('uuid')).toBeDefined();
  });

  it('should find json_formatter tool', () => {
    expect(toolRegistry.get('json_formatter')).toBeDefined();
  });
});

describe('Tool Executor', () => {
  it('should execute calculator', async () => {
    const result = await toolExecutor.execute({ id: '1', name: 'calculator', arguments: { expression: '2+2' } }, 'test-user');
    expect(result.success).toBe(true);
    expect((result.data as { result: number }).result).toBe(4);
  });

  it('should execute datetime', async () => {
    const result = await toolExecutor.execute({ id: '2', name: 'datetime', arguments: {} }, 'test-user');
    expect(result.success).toBe(true);
  });

  it('should execute uuid', async () => {
    const result = await toolExecutor.execute({ id: '3', name: 'uuid', arguments: {} }, 'test-user');
    expect(result.success).toBe(true);
  });

  it('should return error for unknown tool', async () => {
    const result = await toolExecutor.execute({ id: '4', name: 'nonexistent', arguments: {} }, 'test-user');
    expect(result.success).toBe(false);
  });
});
