import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { ArrowRightLeft, ArrowRight, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoneyTransfer } from '@/hooks/useMoneyTransfers';
import { PaymentMethod } from '@/hooks/useProfileSettings';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface TransferHistoryCardProps {
  transfers: MoneyTransfer[];
  paymentMethods: PaymentMethod[];
  onDelete?: (id: string) => void;
  isAdmin?: boolean;
}

const methodIcons: Record<string, string> = {
  wallet: '💵',
  'credit-card': '💳',
  smartphone: '📱',
  building: '🏦',
  coins: '🪙',
};

export function TransferHistoryCard({
  transfers,
  paymentMethods,
  onDelete,
  isAdmin = false,
}: TransferHistoryCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getMethodName = (id: string | null) => {
    if (!id) return 'Metode Dihapus';
    const method = paymentMethods.find((m) => m.id === id);
    return method?.name || 'Metode Dihapus';
  };

  const getMethodIcon = (id: string | null) => {
    if (!id) return '❓';
    const method = paymentMethods.find((m) => m.id === id);
    return methodIcons[method?.icon || 'wallet'] || '💳';
  };

  const recentTransfers = transfers.slice(0, 5);

  if (transfers.length === 0) {
    return null;
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="font-serif text-lg flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5" />
          Riwayat Pindah Uang
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentTransfers.map((transfer) => (
            <div
              key={transfer.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-sm">
                  <span>{getMethodIcon(transfer.from_method_id)}</span>
                  <span className="text-destructive font-medium">
                    {getMethodName(transfer.from_method_id)}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground mx-1" />
                  <span>{getMethodIcon(transfer.to_method_id)}</span>
                  <span className="text-success font-medium">
                    {getMethodName(transfer.to_method_id)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="font-semibold text-sm">
                    {formatCurrency(Number(transfer.amount))}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(transfer.date), 'd MMM yyyy', { locale: id })}
                  </p>
                </div>
                {isAdmin && onDelete && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Transfer?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Transfer ini akan dihapus dari riwayat. Saldo tidak akan dikembalikan secara otomatis.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(transfer.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Hapus
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          ))}
        </div>
        {transfers.length > 5 && (
          <p className="text-center text-sm text-muted-foreground mt-3">
            + {transfers.length - 5} transfer lainnya
          </p>
        )}
      </CardContent>
    </Card>
  );
}
