import supabase from '../../utils/supabase';
import type { Task, TaskCreateInput, TaskUpdateInput } from '../types';
import { taskActivityService } from './taskActivityService';

export const taskService = {
  async getTasks(userId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }

    return data || [];
  },

  async createTask(task: TaskCreateInput, userId: string): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...task,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      throw error;
    }

    // Log task creation activity
    try {
      await taskActivityService.logTaskCreated(data.id, userId);
    } catch (activityError) {
      console.error('Error logging task creation activity:', activityError);
      // Don't throw here - the task creation succeeded, just log the error
    }

    return data;
  },

  async updateTask(id: string, updates: TaskUpdateInput): Promise<Task> {
    // First, get the current task to track changes
    const { data: currentTask, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching current task:', fetchError);
      throw fetchError;
    }

    // Track changes for activity logging
    const changes: Record<string, { old: any; new: any }> = {};
    
    if (updates.title !== undefined && updates.title !== currentTask.title) {
      changes.title = { old: currentTask.title, new: updates.title };
    }
    
    if (updates.description !== undefined && updates.description !== currentTask.description) {
      changes.description = { old: currentTask.description, new: updates.description };
    }
    
    if (updates.status !== undefined && updates.status !== currentTask.status) {
      changes.status = { old: currentTask.status, new: updates.status };
    }
    
    if (updates.priority !== undefined && updates.priority !== currentTask.priority) {
      changes.priority = { old: currentTask.priority, new: updates.priority };
    }
    
    if (updates.due_date !== undefined && updates.due_date !== currentTask.due_date) {
      changes.due_date = { old: currentTask.due_date, new: updates.due_date };
    }
    
    if (updates.labels !== undefined && JSON.stringify(updates.labels) !== JSON.stringify(currentTask.labels)) {
      changes.labels = { old: currentTask.labels, new: updates.labels };
    }
    
    if (updates.assignees !== undefined && JSON.stringify(updates.assignees) !== JSON.stringify(currentTask.assignees)) {
      changes.assignees = { old: currentTask.assignees, new: updates.assignees };
    }

    // Update the task
    const { data, error } = await supabase
      .from('tasks')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating task:', error);
      throw error;
    }

    // Log activity if there were changes
    if (Object.keys(changes).length > 0) {
      try {
        await taskActivityService.logTaskUpdated(id, changes, currentTask.user_id);
      } catch (activityError) {
        console.error('Error logging task activity:', activityError);
        // Don't throw here - the task update succeeded, just log the error
      }
    }

    return data;
  },

  async deleteTask(id: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },

  async moveTask(id: string, status: Task['status']): Promise<Task> {
    return this.updateTask(id, { status });
  },

  subscribeToTasks(userId: string, callback: (tasks: Task[]) => void) {
    const channel = supabase
      .channel('tasks')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          const tasks = await this.getTasks(userId);
          callback(tasks);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
