import { cn } from '@/lib/utils';
import { ExpenseCategory, BUDGET_PERCENTAGES } from '@/types/finance';
import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

interface BudgetStatus {
  category: ExpenseCategory;
  targetPercentage: number;
  spentPercentage: number;
  spent: number;
  limit: number;
  status: 'good' | 'warning' | 'danger';
}

interface BudgetStatusListProps {
  budgetStatus: BudgetStatus[];
  totalIncome: number;
}

const categoryIcons: Record<ExpenseCategory, string> = {
  Kebutuhan: '🏠',
  Investasi: '📈',
  Keinginan: '🎁',
  'Dana Darurat': '🛡️',
};

export function BudgetStatusList({ budgetStatus, totalIncome }: BudgetStatusListProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

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

  const getStatusMessage = (item: BudgetStatus) => {
    if (item.status === 'danger') {
      return `Melebihi ${item.spentPercentage.toFixed(0)}% — pertimbangkan penghematan`;
    }
    if (item.status === 'warning') {
      return `Mendekati batas (${item.spentPercentage.toFixed(0)}%)`;
    }
    return `Aman (${item.spentPercentage.toFixed(0)}%)`;
  };

  return (
    <div className="space-y-3">
      {budgetStatus.map((item) => {
        const idealAmount = (totalIncome * item.targetPercentage) / 100;
        const progressPercentage = Math.min(
          (item.spent / Math.max(idealAmount, 1)) * 100,
          100
        );

        return (
          <div
            key={item.category}
            className={cn(
              'rounded-xl border p-4 transition-all duration-200',
              item.status === 'good' && 'status-good',
              item.status === 'warning' && 'status-warning',
              item.status === 'danger' && 'status-danger'
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{categoryIcons[item.category]}</span>
                <div>
                  <p className="font-medium text-sm">{item.category}</p>
                  <p className="text-xs text-muted-foreground">
                    Target: {item.targetPercentage}%
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-sm">{formatCurrency(item.spent)}</p>
                <p className="text-xs text-muted-foreground">
                  dari {formatCurrency(idealAmount)}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-2 rounded-full bg-background/50 overflow-hidden mb-2">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  item.status === 'good' && 'bg-success',
                  item.status === 'warning' && 'bg-warning',
                  item.status === 'danger' && 'bg-destructive'
                )}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              {getStatusIcon(item.status)}
              <span>{getStatusMessage(item)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
