import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { triggerSyncStart, triggerSyncComplete, triggerSyncError } from '@/components/layout/SyncStatus';

export interface MoneyTransfer {
  id: string;
  user_id: string;
  from_method_id: string | null;
  to_method_id: string | null;
  amount: number;
  description: string | null;
  date: string;
  created_at: string;
  updated_at: string;
}

export function useMoneyTransfers() {
  const { user, isAuthenticated } = useAuthContext();
  const [transfers, setTransfers] = useState<MoneyTransfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransfers = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('money_transfers')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching transfers:', error);
      return;
    }

    setTransfers(data || []);
  }, [user]);

  useEffect(() => {
    if (isAuthenticated && user) {
      setIsLoading(true);
      fetchTransfers().finally(() => setIsLoading(false));
    } else {
      setTransfers([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, user, fetchTransfers]);

  const addTransfer = useCallback(async (transfer: {
    from_method_id: string;
    to_method_id: string;
    amount: number;
    description?: string;
    date: string;
  }) => {
    if (!user) return { error: new Error('Not authenticated') };

    triggerSyncStart();

    const { data, error } = await supabase
      .from('money_transfers')
      .insert({
        user_id: user.id,
        from_method_id: transfer.from_method_id,
        to_method_id: transfer.to_method_id,
        amount: transfer.amount,
        description: transfer.description || null,
        date: transfer.date,
      })
      .select()
      .single();

    if (error) {
      triggerSyncError();
      console.error('Error adding transfer:', error);
      return { error };
    }

    triggerSyncComplete();
    setTransfers((prev) => [data, ...prev]);
    return { data };
  }, [user]);

  const deleteTransfer = useCallback(async (id: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    triggerSyncStart();

    const { error } = await supabase
      .from('money_transfers')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      triggerSyncError();
      console.error('Error deleting transfer:', error);
      return { error };
    }

    triggerSyncComplete();
    setTransfers((prev) => prev.filter((t) => t.id !== id));
    return { success: true };
  }, [user]);

  return {
    transfers,
    isLoading,
    addTransfer,
    deleteTransfer,
    refetch: fetchTransfers,
  };
}
