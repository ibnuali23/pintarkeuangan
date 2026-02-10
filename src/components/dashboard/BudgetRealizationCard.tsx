import { useState } from 'react';
import { format, startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns';
import { id } from 'date-fns/locale';
import { ChevronDown, TrendingDown, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BudgetSetting } from '@/hooks/useProfileSettings';
import { Transaction } from '@/hooks/useSupabaseFinanceData';
import { cn } from '@/lib/utils';

interface BudgetRealizationCardProps {
  budgetSettings: BudgetSetting[];
  expenses: Transaction[];
}

export function BudgetRealizationCard({ budgetSettings, expenses }: BudgetRealizationCardProps) {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Generate last 12 months for filter
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy', { locale: id }),
    };
  });

  // Filter expenses for selected month
  const selectedDate = parseISO(`${selectedMonth}-01`);
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);

  const monthlyExpenses = expenses.filter((exp) => {
    const expDate = parseISO(exp.date);
    return isWithinInterval(expDate, { start: monthStart, end: monthEnd });
  });

  // Calculate spending per subcategory
  const subcategorySpending = new Map<string, number>();
  monthlyExpenses.forEach((exp) => {
    const key = `${exp.category}|${exp.subcategory}`;
    subcategorySpending.set(key, (subcategorySpending.get(key) || 0) + Number(exp.amount));
  });

  // Calculate realization for each budget
  const realizations = budgetSettings
    .filter((b) => b.monthly_budget > 0)
    .map((budget) => {
      const key = `${budget.category}|${budget.subcategory}`;
      const spent = subcategorySpending.get(key) || 0;
      const remaining = budget.monthly_budget - spent;
      const percentage = (spent / budget.monthly_budget) * 100;

      let status: 'good' | 'warning' | 'danger' = 'good';
      if (percentage >= 90) {
        status = 'danger';
      } else if (percentage >= 70) {
        status = 'warning';
      }

      return {
        ...budget,
        spent,
        remaining,
        percentage,
        status,
      };
    })
    .sort((a, b) => b.percentage - a.percentage);

  // Calculate totals
  const totalBudget = realizations.reduce((sum, r) => sum + Number(r.monthly_budget), 0);
  const totalSpent = realizations.reduce((sum, r) => sum + r.spent, 0);
  const totalRemaining = totalBudget - totalSpent;

  const getStatusIcon = (status: 'good' | 'warning' | 'danger') => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'danger':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const getStatusLabel = (status: 'good' | 'warning' | 'danger') => {
    switch (status) {
      case 'good':
        return 'Aman';
      case 'warning':
        return 'Hati-hati';
      case 'danger':
        return 'Mendekati batas';
    }
  };

  if (budgetSettings.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Pemakaian Anggaran
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm text-center py-4">
            Belum ada budget yang diatur. Atur budget di halaman Profil.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="font-serif text-lg flex items-center gap-2">
          <TrendingDown className="h-5 w-5" />
          Pemakaian Anggaran
        </CardTitle>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-secondary/50 p-2 text-center">
            <p className="text-xs text-muted-foreground">💡 Budget</p>
            <p className="font-serif text-sm font-semibold">{formatCurrency(totalBudget)}</p>
          </div>
          <div className="rounded-lg bg-secondary/50 p-2 text-center">
            <p className="text-xs text-muted-foreground">💸 Terpakai</p>
            <p className="font-serif text-sm font-semibold text-destructive">{formatCurrency(totalSpent)}</p>
          </div>
          <div className="rounded-lg bg-secondary/50 p-2 text-center">
            <p className="text-xs text-muted-foreground">💰 Sisa</p>
            <p className={cn(
              'font-serif text-sm font-semibold',
              totalRemaining >= 0 ? 'text-success' : 'text-destructive'
            )}>
              {formatCurrency(totalRemaining)}
            </p>
          </div>
        </div>

        {/* Realization list */}
        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
          {realizations.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              Tidak ada budget dengan nilai &gt; 0
            </p>
          ) : (
            realizations.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'rounded-lg border p-3 transition-all',
                  item.status === 'good' && 'border-success/30 bg-success/5',
                  item.status === 'warning' && 'border-warning/30 bg-warning/5',
                  item.status === 'danger' && 'border-destructive/30 bg-destructive/5'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">{item.subcategory}</p>
                    <p className="text-xs text-muted-foreground">{item.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatCurrency(item.spent)}</p>
                    <p className="text-xs text-muted-foreground">
                      / {formatCurrency(Number(item.monthly_budget))}
                    </p>
                  </div>
                </div>

                <Progress
                  value={Math.min(item.percentage, 100)}
                  className={cn(
                    'h-2',
                    item.status === 'good' && '[&>div]:bg-success',
                    item.status === 'warning' && '[&>div]:bg-warning',
                    item.status === 'danger' && '[&>div]:bg-destructive'
                  )}
                />

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1 text-xs">
                    {getStatusIcon(item.status)}
                    <span>{getStatusLabel(item.status)}</span>
                  </div>
                  <span className="text-xs font-medium">
                    {item.percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
