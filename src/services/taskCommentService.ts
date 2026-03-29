import supabase from '../../utils/supabase';
import type { TaskComment } from '../types';

export class TaskCommentService {
  async getTaskComments(taskId: string): Promise<TaskComment[]> {
    const { data, error } = await supabase
      .from('task_comments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching task comments:', error);
      throw error;
    }

    return data || [];
  }

  async createTaskComment(comment: Omit<TaskComment, 'id' | 'created_at' | 'updated_at'>): Promise<TaskComment> {
    const { data, error } = await supabase
      .from('task_comments')
      .insert({
        ...comment,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating task comment:', error);
      throw error;
    }

    return data;
  }

  async updateTaskComment(id: string, content: string): Promise<TaskComment> {
    const { data, error } = await supabase
      .from('task_comments')
      .update({
        content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating task comment:', error);
      throw error;
    }

    return data;
  }

  async deleteTaskComment(id: string): Promise<void> {
    const { error } = await supabase
      .from('task_comments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting task comment:', error);
      throw error;
    }
  }

  subscribeToTaskComments(taskId: string, callback: (comments: TaskComment[]) => void) {
    return supabase
      .channel(`task_comments_${taskId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_comments',
          filter: `task_id=eq.${taskId}`,
        },
        async () => {
          const comments = await this.getTaskComments(taskId);
          callback(comments);
        }
      )
      .subscribe();
  }
}

export const taskCommentService = new TaskCommentService();
