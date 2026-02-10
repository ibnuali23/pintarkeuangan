import { TrendingDown, CalendarDays } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface TodayExpenseCardProps {
  total: number;
  transactionCount: number;
}

export function TodayExpenseCard({ total, transactionCount }: TodayExpenseCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const today = new Date();

  return (
    <Card className="glass-card overflow-hidden">
      <div className="absolute inset-0 gradient-primary opacity-10" />
      <CardContent className="relative p-4 sm:p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              <span className="text-sm font-medium">
                {format(today, 'd MMMM yyyy', { locale: id })}
              </span>
            </div>
            <h3 className="font-serif text-lg sm:text-xl font-semibold text-foreground">
              💸 Total Pengeluaran Hari Ini
            </h3>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <TrendingDown className="h-6 w-6 text-destructive" />
          </div>
        </div>
        <div className="mt-4">
          <p className="font-serif text-2xl sm:text-3xl font-bold text-gradient">
            {formatCurrency(total)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {transactionCount > 0 
              ? `${transactionCount} transaksi pengeluaran`
              : 'Belum ada pengeluaran hari ini 🎉'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
