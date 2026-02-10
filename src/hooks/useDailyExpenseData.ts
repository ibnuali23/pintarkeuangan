import { useMemo, useCallback } from 'react';
import { Expense } from '@/types/finance';
import { 
  format, 
  parseISO, 
  startOfDay, 
  endOfDay, 
  subDays, 
  startOfMonth, 
  endOfMonth, 
  isWithinInterval,
  isToday 
} from 'date-fns';
import { id } from 'date-fns/locale';
import { FilterType } from '@/components/dashboard/DailyExpenseFilter';

interface DailyExpenseData {
  date: string;
  dateFormatted: string;
  total: number;
  expenses: Expense[];
}

interface ChartData {
  date: string;
  dateLabel: string;
  total: number;
}

export function useDailyExpenseData(
  expenses: Expense[],
  filter: FilterType,
  customRange: { from: Date | undefined; to: Date | undefined }
) {
  // Get filter date range
  const getDateRange = useCallback(() => {
    const today = new Date();
    
    switch (filter) {
      case '7days':
        return { start: subDays(today, 6), end: today };
      case '30days':
        return { start: subDays(today, 29), end: today };
      case 'thisMonth':
        return { start: startOfMonth(today), end: endOfMonth(today) };
      case 'custom':
        if (customRange.from && customRange.to) {
          return { start: customRange.from, end: customRange.to };
        }
        return { start: subDays(today, 6), end: today };
      default:
        return { start: subDays(today, 6), end: today };
    }
  }, [filter, customRange]);

  // Filter expenses by date range
  const filteredExpenses = useMemo(() => {
    const { start, end } = getDateRange();
    
    return expenses.filter((expense) => {
      const expenseDate = parseISO(expense.date);
      return isWithinInterval(expenseDate, { 
        start: startOfDay(start), 
        end: endOfDay(end) 
      });
    });
  }, [expenses, getDateRange]);

  // Get today's expenses
  const todayExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const expenseDate = parseISO(expense.date);
      return isToday(expenseDate);
    });
  }, [expenses]);

  const todayTotal = useMemo(() => {
    return todayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [todayExpenses]);

  // Group expenses by date
  const dailyData = useMemo((): DailyExpenseData[] => {
    const groupedByDate: Record<string, Expense[]> = {};
    
    filteredExpenses.forEach((expense) => {
      const dateKey = expense.date;
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = [];
      }
      groupedByDate[dateKey].push(expense);
    });

    const result = Object.entries(groupedByDate)
      .map(([date, exps]) => ({
        date,
        dateFormatted: format(parseISO(date), 'd MMMM yyyy', { locale: id }),
        total: exps.reduce((sum, exp) => sum + exp.amount, 0),
        expenses: exps.sort((a, b) => b.amount - a.amount),
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return result;
  }, [filteredExpenses]);

  // Prepare chart data
  const chartData = useMemo((): ChartData[] => {
    const { start, end } = getDateRange();
    const dayCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    const result: ChartData[] = [];
    
    for (let i = 0; i < dayCount; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const dayExpenses = filteredExpenses.filter(exp => exp.date === dateStr);
      const total = dayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      
      result.push({
        date: format(date, 'd MMMM yyyy', { locale: id }),
        dateLabel: format(date, 'd MMM', { locale: id }),
        total,
      });
    }
    
    return result;
  }, [filteredExpenses, getDateRange]);

  // Export to CSV/Excel
  const exportToExcel = useCallback(() => {
    if (dailyData.length === 0) {
      alert('Tidak ada data untuk diekspor');
      return;
    }

    const rows: string[] = [];
    rows.push('Tanggal,Kategori,Subkategori,Deskripsi,Nominal');
    
    dailyData.forEach((day) => {
      day.expenses.forEach((expense) => {
        const row = [
          day.dateFormatted,
          expense.category,
          expense.subcategory,
          `"${expense.description || '-'}"`,
          expense.amount.toString(),
        ].join(',');
        rows.push(row);
      });
    });

    // Add summary
    rows.push('');
    rows.push('RINGKASAN HARIAN');
    rows.push('Tanggal,Total Pengeluaran');
    dailyData.forEach((day) => {
      rows.push(`${day.dateFormatted},${day.total}`);
    });

    const csvContent = rows.join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Laporan-Pengeluaran-Harian-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }, [dailyData]);

  // Calculate totals
  const totalExpense = useMemo(() => {
    return filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [filteredExpenses]);

  const averageDaily = useMemo(() => {
    const days = dailyData.length;
    return days > 0 ? totalExpense / days : 0;
  }, [totalExpense, dailyData]);

  return {
    dailyData,
    chartData,
    todayTotal,
    todayTransactionCount: todayExpenses.length,
    totalExpense,
    averageDaily,
    transactionCount: filteredExpenses.length,
    exportToExcel,
  };
}
