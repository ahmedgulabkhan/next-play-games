import supabase from '../../utils/supabase';
import type { TaskActivity } from '../types';

export class TaskActivityService {
  async getTaskActivities(taskId: string): Promise<TaskActivity[]> {
    const { data, error } = await supabase
      .from('task_activity')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching task activities:', error);
      throw error;
    }

    return data || [];
  }

  async createTaskActivity(activity: Omit<TaskActivity, 'id' | 'created_at'>): Promise<TaskActivity> {
    const { data, error } = await supabase
      .from('task_activity')
      .insert(activity)
      .select()
      .single();

    if (error) {
      console.error('Error creating task activity:', error);
      throw error;
    }

    return data;
  }

  async logTaskCreated(taskId: string, userId?: string): Promise<void> {
    await this.createTaskActivity({
      task_id: taskId,
      action: 'created',
      description: 'Task was created',
      user_id: userId,
    });
  }

  async logTaskUpdated(taskId: string, changes: Record<string, { old: any; new: any }>, userId?: string): Promise<void> {
    for (const [field, change] of Object.entries(changes)) {
      let action: TaskActivity['action'] = 'updated';
      let description = '';

      switch (field) {
        case 'status':
          action = 'status_changed';
          description = `Status changed from ${change.old} to ${change.new}`;
          break;
        case 'priority':
          action = 'priority_changed';
          description = `Priority changed from ${change.old} to ${change.new}`;
          break;
        case 'due_date':
          action = 'due_date_changed';
          description = `Due date changed${change.old ? ` from ${change.old}` : ''}${change.new ? ` to ${change.new}` : ''}`;
          break;
        case 'labels':
          action = 'labels_changed';
          description = `Labels updated`;
          break;
        case 'assignees':
          action = change.old?.length > change.new?.length ? 'unassigned' : 'assigned';
          description = `Assignees updated`;
          break;
        case 'description':
          action = 'description_changed';
          description = `Description updated`;
          break;
        default:
          description = `${field} updated`;
      }

      await this.createTaskActivity({
        task_id: taskId,
        action,
        description,
        old_value: change.old?.toString(),
        new_value: change.new?.toString(),
        user_id: userId,
      });
    }
  }

  subscribeToTaskActivities(taskId: string, callback: (activities: TaskActivity[]) => void) {
    return supabase
      .channel(`task_activities_${taskId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_activity',
          filter: `task_id=eq.${taskId}`,
        },
        async () => {
          const activities = await this.getTaskActivities(taskId);
          callback(activities);
        }
      )
      .subscribe();
  }
}

export const taskActivityService = new TaskActivityService();
