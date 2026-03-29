export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'in_review' | 'done';
  priority: 'low' | 'normal' | 'high';
  due_date?: string;
  assignee_id?: string;
  labels: string[]; // Array of label names
  assignees: string[]; // Array of team member names
  user_id: string;
  created_at: string;
  updated_at?: string;
}

export interface Column {
  id: string;
  title: string;
  status: Task['status'];
  taskIds: string[];
  color: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  user_id: string;
  created_at: string;
  updated_at?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  color: string;
  user_id: string;
  created_at: string;
  updated_at?: string;
}

export interface TaskActivity {
  id: string;
  task_id: string;
  action: 'created' | 'updated' | 'status_changed' | 'assigned' | 'unassigned' | 'priority_changed' | 'due_date_changed' | 'labels_changed' | 'description_changed';
  description?: string;
  old_value?: string;
  new_value?: string;
  user_id?: string;
  created_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  content: string;
  user_id?: string;
  created_at: string;
  updated_at?: string;
}

export type TaskCreateInput = Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'> & {
  labels?: string[];
  assignees?: string[];
};

export type TaskUpdateInput = Partial<Omit<Task, 'id' | 'user_id' | 'created_at'>> & {
  labels?: string[];
  assignees?: string[];
};
