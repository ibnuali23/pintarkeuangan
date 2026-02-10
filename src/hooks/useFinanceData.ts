import { useState, useEffect, useCallback } from 'react';
import { Income, Expense, MonthlyNote, BUDGET_PERCENTAGES, ExpenseCategory, IncomeSubcategory } from '@/types/finance';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

const STORAGE_KEYS = {
  incomes: 'kpm_incomes',
  expenses: 'kpm_expenses',
  notes: 'kpm_notes',
};

export function useFinanceData() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [notes, setNotes] = useState<MonthlyNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from localStorage
  useEffect(() => {
    try {
      const storedIncomes = localStorage.getItem(STORAGE_KEYS.incomes);
      const storedExpenses = localStorage.getItem(STORAGE_KEYS.expenses);
      const storedNotes = localStorage.getItem(STORAGE_KEYS.notes);

      if (storedIncomes) setIncomes(JSON.parse(storedIncomes));
      if (storedExpenses) setExpenses(JSON.parse(storedExpenses));
      if (storedNotes) setNotes(JSON.parse(storedNotes));
    } catch (error) {
      console.error('Error loading finance data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEYS.incomes, JSON.stringify(incomes));
    }
  }, [incomes, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify(expenses));
    }
  }, [expenses, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEYS.notes, JSON.stringify(notes));
    }
  }, [notes, isLoading]);

  // Add income
  const addIncome = useCallback((income: {
    date: string;
    category: 'Pemasukan';
    subcategory: IncomeSubcategory;
    description: string;
    amount: number;
  }) => {
    const newIncome: Income = {
      ...income,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setIncomes((prev) => [...prev, newIncome]);
    return newIncome;
  }, []);

  // Add expense
  const addExpense = useCallback((expense: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExpense: Expense = {
      ...expense,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setExpenses((prev) => [...prev, newExpense]);
    return newExpense;
  }, []);

  // Delete income
  const deleteIncome = useCallback((id: string) => {
    setIncomes((prev) => prev.filter((income) => income.id !== id));
  }, []);

  // Delete expense
  const deleteExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((expense) => expense.id !== id));
  }, []);

  // Save monthly note
  const saveMonthlyNote = useCallback((month: string, note: string) => {
    setNotes((prev) => {
      const existing = prev.find((n) => n.month === month);
      if (existing) {
        return prev.map((n) =>
          n.month === month ? { ...n, note, createdAt: new Date().toISOString() } : n
        );
      }
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          month,
          note,
          createdAt: new Date().toISOString(),
        },
      ];
    });
  }, []);

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

      const totalIncome = monthIncomes.reduce((sum, inc) => sum + inc.amount, 0);
      const totalExpense = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const balance = totalIncome - totalExpense;

      // Calculate spending by category
      const categorySpending: Record<ExpenseCategory, number> = {
        Kebutuhan: 0,
        Investasi: 0,
        Keinginan: 0,
        'Dana Darurat': 0,
      };

      monthExpenses.forEach((expense) => {
        categorySpending[expense.category] += expense.amount;
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

  return {
    incomes,
    expenses,
    notes,
    isLoading,
    addIncome,
    addExpense,
    deleteIncome,
    deleteExpense,
    saveMonthlyNote,
    getMonthlyData,
    getMonthlySummary,
  };
}
