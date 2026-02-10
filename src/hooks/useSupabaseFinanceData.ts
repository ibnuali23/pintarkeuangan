import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { ExpenseCategory, IncomeSubcategory, BUDGET_PERCENTAGES, ExpenseSubcategory } from '@/types/finance';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { triggerSyncStart, triggerSyncComplete, triggerSyncError } from '@/components/layout/SyncStatus';

export interface Transaction {
  id: string;
  user_id: string;
  date: string;
  category: string;
  subcategory: string;
  description: string | null;
  amount: number;
  type: 'income' | 'expense';
  created_at: string;
  updated_at: string;
}

export interface MonthlyNote {
  id: string;
  user_id: string;
  month: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export function useSupabaseFinanceData() {
  const { user, isAuthenticated } = useAuthContext();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notes, setNotes] = useState<MonthlyNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all transactions for the user
  const fetchTransactions = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
      return;
    }

    setTransactions(data || []);
  }, [user]);

  // Fetch all notes for the user
  const fetchNotes = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('monthly_notes')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching notes:', error);
      return;
    }

    setNotes(data || []);
  }, [user]);

  // Initial data fetch
  useEffect(() => {
    if (isAuthenticated && user) {
      setIsLoading(true);
      Promise.all([fetchTransactions(), fetchNotes()]).finally(() => {
        setIsLoading(false);
      });
    } else {
      setTransactions([]);
      setNotes([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, user, fetchTransactions, fetchNotes]);

  // Add income
  const addIncome = useCallback(async (income: {
    date: string;
    category: string;
    subcategory: IncomeSubcategory;
    description: string;
    amount: number;
    payment_method_id?: string;
  }) => {
    if (!user) return { error: new Error('Not authenticated') };

    triggerSyncStart();

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        date: income.date,
        category: income.category,
        subcategory: income.subcategory,
        description: income.description || null,
        amount: income.amount,
        type: 'income' as const,
        payment_method_id: income.payment_method_id || null,
      })
      .select()
      .single();

    if (error) {
      triggerSyncError();
      console.error('Error adding income:', error);
      return { error };
    }

    triggerSyncComplete();
    setTransactions((prev) => [data, ...prev]);
    return { data, payment_method_id: income.payment_method_id };
  }, [user]);

  // Add expense
  const addExpense = useCallback(async (expense: {
    date: string;
    category: ExpenseCategory;
    subcategory: string;
    description: string;
    amount: number;
    payment_method_id?: string;
  }) => {
    if (!user) return { error: new Error('Not authenticated') };

    triggerSyncStart();

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        date: expense.date,
        category: expense.category,
        subcategory: expense.subcategory,
        description: expense.description || null,
        amount: expense.amount,
        type: 'expense' as const,
        payment_method_id: expense.payment_method_id || null,
      })
      .select()
      .single();

    if (error) {
      triggerSyncError();
      console.error('Error adding expense:', error);
      return { error };
    }

    triggerSyncComplete();
    setTransactions((prev) => [data, ...prev]);
    return { data, payment_method_id: expense.payment_method_id };
  }, [user]);

  // Delete transaction (income or expense)
  const deleteTransaction = useCallback(async (id: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    triggerSyncStart();

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      triggerSyncError();
      console.error('Error deleting transaction:', error);
      return { error };
    }

    triggerSyncComplete();
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    return { success: true };
  }, [user]);

  // Save monthly note
  const saveMonthlyNote = useCallback(async (month: string, note: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    triggerSyncStart();

    const { data, error } = await supabase
      .from('monthly_notes')
      .upsert({
        user_id: user.id,
        month,
        note,
      }, {
        onConflict: 'user_id,month',
      })
      .select()
      .single();

    if (error) {
      triggerSyncError();
      console.error('Error saving note:', error);
      return { error };
    }

    triggerSyncComplete();
    setNotes((prev) => {
      const existing = prev.find((n) => n.month === month);
      if (existing) {
        return prev.map((n) => (n.month === month ? data : n));
      }
      return [...prev, data];
    });
    return { data };
  }, [user]);

  // Get incomes (filtered from transactions)
  const incomes = transactions.filter((t) => t.type === 'income');

  // Get expenses (filtered from transactions)
  const expenses = transactions.filter((t) => t.type === 'expense');

  // Get data for specific month
  const getMonthlyData = useCallback(
    (date: Date) => {
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      const monthIncomes = incomes.filter((income) => {
        const incomeDate = parseISO(income.date);
        return isWithinInterval(incomeDate, { start: monthStart, end: monthEnd });
      });

      const monthExpenses = expenses.filter((expense) => {
        const expenseDate = parseISO(expense.date);
        return isWithinInterval(expenseDate, { start: monthStart, end: monthEnd });
      });

      const totalIncome = monthIncomes.reduce((sum, inc) => sum + Number(inc.amount), 0);
      const totalExpense = monthExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
      const balance = totalIncome - totalExpense;

      // Calculate spending by category
      const categorySpending: Record<ExpenseCategory, number> = {
        Kebutuhan: 0,
        Investasi: 0,
        Keinginan: 0,
        'Dana Darurat': 0,
      };

      monthExpenses.forEach((expense) => {
        const category = expense.category as ExpenseCategory;
        if (categorySpending[category] !== undefined) {
          categorySpending[category] += Number(expense.amount);
        }
      });

      // Calculate budget status
      const budgetStatus = (Object.keys(BUDGET_PERCENTAGES) as ExpenseCategory[]).map(
        (category) => {
          const spent = categorySpending[category];
          const percentage = BUDGET_PERCENTAGES[category];
          const limit = (totalIncome * percentage) / 100;
          const spentPercentage = totalExpense > 0 ? (spent / totalExpense) * 100 : 0;

          let status: 'good' | 'warning' | 'danger' = 'good';
          if (spentPercentage > percentage) {
            status = 'danger';
          } else if (spentPercentage > percentage * 0.8) {
            status = 'warning';
          }

          return {
            category,
            targetPercentage: percentage,
            spentPercentage,
            spent,
            limit,
            status,
          };
        }
      );

      const monthKey = format(date, 'yyyy-MM');
      const monthNote = notes.find((n) => n.month === monthKey);

      return {
        incomes: monthIncomes,
        expenses: monthExpenses,
        totalIncome,
        totalExpense,
        balance,
        categorySpending,
        budgetStatus,
        monthNote: monthNote?.note || '',
      };
    },
    [incomes, expenses, notes]
  );

  // Get monthly summary for charts (last N months)
  const getMonthlySummary = useCallback(
    (months: number = 6) => {
      const summaries = [];
      const today = new Date();

      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const data = getMonthlyData(date);
        summaries.push({
          month: format(date, 'MMM yyyy'),
          monthKey: format(date, 'yyyy-MM'),
          income: data.totalIncome,
          expense: data.totalExpense,
          balance: data.balance,
        });
      }

      return summaries;
    },
    [getMonthlyData]
  );

   // Update transaction
   const updateTransaction = useCallback(async (id: string, updates: {
     date: string;
     category: string;
     subcategory: string;
     description: string;
     amount: number;
     type: 'income' | 'expense';
   }) => {
     if (!user) return { error: new Error('Not authenticated') };
 
     triggerSyncStart();
 
     const { data, error } = await supabase
       .from('transactions')
       .update({
         date: updates.date,
         category: updates.category,
         subcategory: updates.subcategory,
         description: updates.description || null,
         amount: updates.amount,
         type: updates.type,
       })
       .eq('id', id)
       .eq('user_id', user.id)
       .select()
       .single();
 
     if (error) {
       triggerSyncError();
       console.error('Error updating transaction:', error);
       return { error };
     }
 
     triggerSyncComplete();
     setTransactions((prev) => prev.map((t) => (t.id === id ? data : t)));
     return { data };
   }, [user]);
 
   return {
     transactions,
     incomes,
     expenses,
     notes,
     isLoading,
     addIncome,
     addExpense,
     updateTransaction,
     deleteIncome: deleteTransaction,
     deleteExpense: deleteTransaction,
     deleteTransaction,
     saveMonthlyNote,
     getMonthlyData,
     getMonthlySummary,
     refetch: () => Promise.all([fetchTransactions(), fetchNotes()]),
   };
}
