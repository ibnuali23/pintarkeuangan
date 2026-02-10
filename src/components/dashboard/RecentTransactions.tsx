import { TrendingUp, TrendingDown } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

interface Transaction {
  id: string;
  date: string;
  category: string;
  subcategory: string;
  description: string | null;
  amount: number;
  type?: 'income' | 'expense';
  created_at?: string;
  createdAt?: string;
}

interface RecentTransactionsProps {
  incomes: Transaction[];
  expenses: Transaction[];
}

export function RecentTransactions({ incomes, expenses }: RecentTransactionsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Combine and sort transactions
  const allTransactions = [
    ...incomes.map((inc) => ({ ...inc, transactionType: 'income' as const })),
    ...expenses.map((exp) => ({ ...exp, transactionType: 'expense' as const })),
  ]
    .sort((a, b) => {
      const dateA = a.created_at || a.createdAt || a.date;
      const dateB = b.created_at || b.createdAt || b.date;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    })
    .slice(0, 5);

  if (allTransactions.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <span className="text-2xl">💳</span>
          </div>
          <p className="text-muted-foreground">Belum ada transaksi</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {allTransactions.map((transaction) => (
        <div
          key={transaction.id}
          className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                transaction.transactionType === 'income'
                  ? 'bg-success/20 text-success'
                  : 'bg-destructive/20 text-destructive'
              }`}
            >
              {transaction.transactionType === 'income' ? (
                <TrendingUp className="h-5 w-5" />
              ) : (
                <TrendingDown className="h-5 w-5" />
              )}
            </div>
            <div>
              <p className="font-medium text-sm line-clamp-1">
                {transaction.description || transaction.subcategory}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(parseISO(transaction.date), 'd MMM yyyy', { locale: id })}
              </p>
            </div>
          </div>
          <p
            className={`font-semibold text-sm ${
              transaction.transactionType === 'income' ? 'text-success' : 'text-destructive'
            }`}
          >
            {transaction.transactionType === 'income' ? '+' : '-'}
            {formatCurrency(Number(transaction.amount))}
          </p>
        </div>
      ))}
    </div>
  );
}
