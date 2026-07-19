export interface WorkflowStep {
  id: string;
  type: 'prompt' | 'tool' | 'search' | 'condition';
  name: string;
  config: Record<string, unknown>;
  nextStepId?: string;
}

export interface Workflow {
  userId: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  status: 'draft' | 'active' | 'archived';
  runCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowRun {
  workflowId: string;
  userId: string;
  status: 'running' | 'completed' | 'failed';
  results: Array<{ stepId: string; output: unknown; duration: number }>;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}
