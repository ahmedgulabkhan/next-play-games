import { useState, useEffect } from 'react';
import supabase from '../../utils/supabase';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';

export const useGuestSession = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeGuestSession = async () => {
      try {
        // Check if user is already signed in
        const { data: { user: existingUser } } = await supabase.auth.getUser();
        
        if (existingUser) {
          setUser(existingUser);
          setUserId(existingUser.id);
        } else {
          // Create anonymous guest session
          const { data, error } = await supabase.auth.signInAnonymously();
          
          if (error) {
            console.error('Error creating guest session:', error);
            // Fallback to localStorage if Supabase auth fails
            const fallbackId = localStorage.getItem('guest_session_id');
            if (fallbackId) {
              setUserId(fallbackId);
            } else {
              const newFallbackId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              localStorage.setItem('guest_session_id', newFallbackId);
              setUserId(newFallbackId);
            }
          } else if (data.user) {
            setUser(data.user);
            setUserId(data.user.id);
            
            // Store in localStorage as backup
            localStorage.setItem('guest_session_id', data.user.id);
          }
        }
      } catch (error) {
        console.error('Guest session initialization failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeGuestSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          setUserId(session.user.id);
          localStorage.setItem('guest_session_id', session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setUserId('');
          localStorage.removeItem('guest_session_id');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, userId, isLoading };
};
