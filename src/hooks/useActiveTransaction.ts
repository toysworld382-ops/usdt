import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useActiveTransaction = () => {
  const { user } = useAuth();
  const [hasActiveTransaction, setHasActiveTransaction] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkActiveTransaction = async () => {
      if (!user) {
        setHasActiveTransaction(false);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { count, error } = await supabase
          .from('transactions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .in('status', ['pending', 'processing']);

        if (error) throw error;

        setHasActiveTransaction((count || 0) > 0);
      } catch (error) {
        console.error('Error checking for active transactions:', error);
        setHasActiveTransaction(false); // Fail safe
      } finally {
        setLoading(false);
      }
    };

    checkActiveTransaction();
  }, [user]);

  return { hasActiveTransaction, loading };
};
