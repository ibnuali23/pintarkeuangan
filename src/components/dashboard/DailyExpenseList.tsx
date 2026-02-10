import { useState } from 'react';
import { ChevronDown, ChevronRight, Calendar, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Expense } from '@/types/finance';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

interface DailyExpenseData {
  date: string;
  dateFormatted: string;
  total: number;
  expenses: Expense[];
}

interface DailyExpenseListProps {
  data: DailyExpenseData[];
}

export function DailyExpenseList({ data }: DailyExpenseListProps) {
  const [openDates, setOpenDates] = useState<Set<string>>(new Set());

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const toggleDate = (date: string) => {
    setOpenDates((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  };

  if (data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <Receipt className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">Belum ada data pengeluaran</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
      {data.map((day) => (
        <Collapsible
          key={day.date}
          open={openDates.has(day.date)}
          onOpenChange={() => toggleDate(day.date)}
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between h-auto py-3 px-4 hover:bg-secondary/50 rounded-lg border border-transparent hover:border-border transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">{day.dateFormatted}</p>
                  <p className="text-xs text-muted-foreground">
                    {day.expenses.length} transaksi
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-destructive">
                  {formatCurrency(day.total)}
                </span>
                {openDates.has(day.date) ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="animate-accordion-down">
            <div className="ml-6 mt-2 space-y-2 border-l-2 border-primary/20 pl-4 pb-2">
              {day.expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between rounded-lg bg-muted/50 p-3 text-sm animate-fade-in"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {expense.description || expense.subcategory}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {expense.category} • {expense.subcategory}
                    </p>
                  </div>
                  <span className="font-semibold text-destructive ml-2 whitespace-nowrap">
                    {formatCurrency(expense.amount)}
                  </span>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
}
