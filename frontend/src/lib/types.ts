export type TaskStatus = 'DO NOW' | 'QUEUED' | 'IN PROGRESS' | 'WAITING' | 'BLOCKED' | 'REVIEW' | 'DONE';
export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskCategory = 'business' | 'work' | 'personal' | 'other';

export interface Artifact {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'url';
  created_at: string;
}

export interface CompletionLog {
  what_was_done: string;
  artifacts: string[];
  time_spent: string;
  lessons_learned: string;
}

export interface RecurringConfig {
  schedule: 'daily' | 'weekly' | 'monthly';
  day?: string;
  time?: string;
  auto_create: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  outcome?: string;
  action_steps?: string[];
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  project?: string;
  assignee?: string;
  time_estimate_minutes?: number;
  time_actual_minutes?: number;
  due_date?: string;
  started_at?: string;
  completed_at?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
  artifacts: Artifact[];
  depends_on: string[];
  dependencies?: string[];
  blocked_by_dependencies?: boolean;
  blocked_reason?: string;
  parent_id?: string;
  template_id?: string;
  acceptance_criteria?: string[];
  completion_log?: CompletionLog;
  approval_notes?: string;
  recurring?: RecurringConfig;
  stale_days?: number;
  retry_count?: number;
  rejection_notes?: string;
  retry_history?: Array<{attempt: number; completed_at?: string; rejected_at: string; rejection_notes: string}>;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: TaskCategory;
  project?: string;
  priority: TaskPriority;
  time_estimate_minutes: number;
  acceptance_criteria?: string[];
}

export interface DigestData {
  completed_count: number;
  completed_tasks: Task[];
  in_review_count: number;
  in_review: Task[];
  blocked_count: number;
  blocked_tasks: Task[];
  waiting_count: number;
  waiting_tasks: Task[];
  stale_count: number;
  stale_tasks: Task[];
  priority_queue: Task[];
  overdue_count: number;
  overdue_tasks: Task[];
  generated_at: string;
}

export interface Metrics {
  completed_today: number;
  completed_this_week: number;
  completed_this_month: number;
  total_completed: number;
  average_completion_minutes: number;
  by_category: Record<string, number>;
  by_status: Record<string, number>;
  queue_depth: number;
  in_review: number;
  total_tasks: number;
}
