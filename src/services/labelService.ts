import supabase from '../../utils/supabase';
import type { Label } from '../types';

export const labelService = {
  // Get all labels for a user
  async getLabels(userId: string): Promise<Label[]> {
    try {
      const { data, error } = await supabase
        .from('labels')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching labels:', error);
      return [];
    }
  },

  // Create a new label
  async createLabel(label: { name: string; color: string; user_id: string }): Promise<Label> {
    try {
      const { data, error } = await supabase
        .from('labels')
        .insert([label])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating label:', error);
      throw error;
    }
  },

  // Update a label
  async updateLabel(id: string, updates: { name?: string; color?: string }): Promise<Label> {
    try {
      const { data, error } = await supabase
        .from('labels')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating label:', error);
      throw error;
    }
  },

  // Delete a label
  async deleteLabel(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('labels')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting label:', error);
      throw error;
    }
  },

  // Subscribe to real-time label updates
  subscribeToLabels(userId: string, callback: (labels: Label[]) => void) {
    const channel = supabase
      .channel('labels_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'labels',
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          // Refetch labels when changes occur
          const updatedLabels = await this.getLabels(userId);
          callback(updatedLabels);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
