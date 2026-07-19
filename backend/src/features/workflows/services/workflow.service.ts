import { WorkflowModel, WorkflowRunModel } from '../models/workflow.model';
import { NotFoundError } from '../../../core/errors';
import { toolExecutor } from '../../tools/executor';
import { searchService } from '../../websearch/services/search.service';
import { ProviderFactory } from '../../ai/providers/factory';

export class WorkflowService {
  async create(userId: string, data: { name: string; description?: string; steps: any[] }) {
    return WorkflowModel.create({ userId, ...data });
  }
  async list(userId: string) {
    return WorkflowModel.find({ userId }).sort({ updatedAt: -1 }).lean();
  }
  async getById(id: string, userId: string) {
    const wf = await WorkflowModel.findOne({ _id: id, userId });
    if (!wf) throw new NotFoundError('Workflow');
    return wf;
  }
  async delete(id: string, userId: string) {
    const wf = await WorkflowModel.findOneAndDelete({ _id: id, userId });
    if (!wf) throw new NotFoundError('Workflow');
  }
  async run(id: string, userId: string, input: string) {
    const wf = await this.getById(id, userId);
    const run = await WorkflowRunModel.create({ workflowId: id, userId, status: 'running', results: [], startedAt: new Date() });
    const results: Array<{ stepId: string; output: unknown; duration: number }> = [];
    try {
      for (const step of wf.steps) {
        const start = Date.now();
        let output: unknown;
        switch (step.type) {
          case 'prompt': {
            const provider = ProviderFactory.getProvider('gemini');
            const resp = await provider.chat([{ role: 'user', content: `${step.config.prompt || ''} ${input}` }], { temperature: 0.7 });
            output = resp.content;
            break;
          }
          case 'tool': {
            const result = await toolExecutor.execute({ id: Date.now().toString(), name: step.config.toolName as string, arguments: (step.config.args as Record<string, unknown>) || {} }, userId);
            output = result.data;
            break;
          }
          case 'search': {
            const searchResults = await searchService.search(input, { count: 3 });
            output = searchResults;
            break;
          }
          default:
            output = 'Step type not implemented';
        }
        results.push({ stepId: step.id, output, duration: Date.now() - start });
      }
      await WorkflowRunModel.findByIdAndUpdate(run._id, { status: 'completed', results, completedAt: new Date() });
      await WorkflowModel.findByIdAndUpdate(id, { $inc: { runCount: 1 } });
      return { runId: run._id, status: 'completed', results };
    } catch (error) {
      await WorkflowRunModel.findByIdAndUpdate(run._id, { status: 'failed', error: (error as Error).message, completedAt: new Date() });
      throw error;
    }
  }
}
export const workflowService = new WorkflowService();
