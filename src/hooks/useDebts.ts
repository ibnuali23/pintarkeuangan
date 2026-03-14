import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { triggerSyncStart, triggerSyncComplete, triggerSyncError } from '@/components/layout/SyncStatus';

export type DebtType = 'hutang' | 'piutang';
export type DebtStatus = 'belum_lunas' | 'lunas';

export interface DebtPayment {
    id: string;
    debt_id: string;
    user_id: string;
    amount: number;
    note: string | null;
    paid_at: string;
    created_at: string;
}

export interface Debt {
    id: string;
    user_id: string;
    type: DebtType;
    amount: number;
    remaining_amount: number;
    person_name: string;
    description: string | null;
    due_date: string | null;
    status: DebtStatus;
    created_at: string;
    updated_at: string;
}

export function useDebts() {
    const { user, isAuthenticated } = useAuthContext();
    const [debts, setDebts] = useState<Debt[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchDebts = useCallback(async () => {
        if (!user) return;

        const { data, error } = await supabase
            .from('debts' as any)
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching debts:', error);
            return;
        }

        setDebts((data as unknown as Debt[]) || []);
    }, [user]);

    useEffect(() => {
        if (isAuthenticated && user) {
            setIsLoading(true);
            fetchDebts().finally(() => setIsLoading(false));
        } else {
            setDebts([]);
            setIsLoading(false);
        }
    }, [isAuthenticated, user, fetchDebts]);

    const addDebt = useCallback(async (debtData: {
        type: DebtType;
        amount: number;
        person_name: string;
        description?: string;
        due_date?: string;
    }) => {
        if (!user) return { error: new Error('Not authenticated') };
        triggerSyncStart();

        const { data, error } = await supabase
            .from('debts' as any)
            .insert({
                user_id: user.id,
                type: debtData.type,
                amount: debtData.amount,
                remaining_amount: debtData.amount,
                person_name: debtData.person_name,
                description: debtData.description || null,
                due_date: debtData.due_date || null,
                status: 'belum_lunas',
            })
            .select()
            .single();

        if (error) {
            triggerSyncError();
            console.error('Error adding debt:', error);
            return { error };
        }

        triggerSyncComplete();
        setDebts((prev) => [data as unknown as Debt, ...prev]);
        return { data: data as unknown as Debt };
    }, [user]);

    const makePayment = useCallback(async (debtId: string, paymentAmount: number, note?: string) => {
        if (!user) return { error: new Error('Not authenticated') };
        triggerSyncStart();

        const debt = debts.find(d => d.id === debtId);
        if (!debt) return { error: new Error('Debt not found') };

        const newRemaining = Math.max(0, Number(debt.remaining_amount) - paymentAmount);
        const newStatus = newRemaining <= 0 ? 'lunas' : 'belum_lunas';

        // Insert payment record
        const { error: paymentError } = await supabase
            .from('debt_payments' as any)
            .insert({
                debt_id: debtId,
                user_id: user.id,
                amount: paymentAmount,
                note: note || null,
            });

        if (paymentError) {
            triggerSyncError();
            console.error('Error adding payment:', paymentError);
            return { error: paymentError };
        }

        // Update debt remaining_amount and status
        const { data, error } = await supabase
            .from('debts' as any)
            .update({
                remaining_amount: newRemaining,
                status: newStatus,
                updated_at: new Date().toISOString(),
            })
            .eq('id', debtId)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) {
            triggerSyncError();
            console.error('Error updating debt:', error);
            return { error };
        }

        triggerSyncComplete();
        setDebts((prev) => prev.map((d) => (d.id === debtId ? (data as unknown as Debt) : d)));
        return { data: data as unknown as Debt };
    }, [user, debts]);

    const getPayments = useCallback(async (debtId: string): Promise<DebtPayment[]> => {
        if (!user) return [];

        const { data, error } = await supabase
            .from('debt_payments' as any)
            .select('*')
            .eq('debt_id', debtId)
            .eq('user_id', user.id)
            .order('paid_at', { ascending: false });

        if (error) {
            console.error('Error fetching payments:', error);
            return [];
        }

        return (data as unknown as DebtPayment[]) || [];
    }, [user]);

    const updateDebt = useCallback(async (id: string, updates: Partial<Pick<Debt, 'amount' | 'person_name' | 'description' | 'due_date' | 'status'>>) => {
        if (!user) return { error: new Error('Not authenticated') };
        triggerSyncStart();

        const { data, error } = await supabase
            .from('debts' as any)
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) {
            triggerSyncError();
            console.error('Error updating debt:', error);
            return { error };
        }

        triggerSyncComplete();
        setDebts((prev) => prev.map((d) => (d.id === id ? (data as unknown as Debt) : d)));
        return { data: data as unknown as Debt };
    }, [user]);

    const deleteDebt = useCallback(async (id: string) => {
        if (!user) return { error: new Error('Not authenticated') };
        triggerSyncStart();

        const { error } = await supabase
            .from('debts' as any)
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            triggerSyncError();
            console.error('Error deleting debt:', error);
            return { error };
        }

        triggerSyncComplete();
        setDebts((prev) => prev.filter((d) => d.id !== id));
        return { success: true };
    }, [user]);

    return {
        debts,
        isLoading,
        addDebt,
        makePayment,
        getPayments,
        updateDebt,
        deleteDebt,
        refetch: fetchDebts,
    };
}
