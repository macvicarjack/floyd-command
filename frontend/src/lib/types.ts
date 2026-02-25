export type TaskStatus = 'DO NOW' | 'QUEUED' | 'IN PROGRESS' | 'DONE' | 'BLOCKED';
export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskCategory = 'business' | 'work' | 'personal' | 'other';

export interface Artifact {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'url';
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
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
  created_at: string;
  updated_at: string;
  artifacts: Artifact[];
  depends_on: string[];
  blocked_by_dependencies?: boolean;
  parent_id?: string;
  template_id?: string;
  acceptance_criteria?: string[];
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
  awaiting_review_count: number;
  awaiting_review: Task[];
  blocked_count: number;
  blocked_tasks: Task[];
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
  total_tasks: number;
}
