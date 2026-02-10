import { CreditCard, AlertTriangle, ArrowRightLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PaymentMethod } from '@/hooks/useProfileSettings';
import { cn } from '@/lib/utils';

interface PaymentMethodsCardProps {
  paymentMethods: PaymentMethod[];
  onTransferClick: () => void;
}

const methodIcons: Record<string, string> = {
  wallet: '💵',
  'credit-card': '💳',
  smartphone: '📱',
  building: '🏦',
  coins: '🪙',
};

export function PaymentMethodsCard({ paymentMethods, onTransferClick }: PaymentMethodsCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const totalBalance = paymentMethods.reduce((sum, m) => sum + Number(m.balance), 0);
  const maxBalance = Math.max(...paymentMethods.map((m) => Number(m.balance)), 1);

  if (paymentMethods.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Ringkasan Saldo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm text-center py-4">
            Belum ada metode pembayaran. Tambahkan di halaman Profil.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="font-serif text-lg flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Ringkasan Saldo
        </CardTitle>
        <Button variant="outline" size="sm" onClick={onTransferClick} className="gap-2">
          <ArrowRightLeft className="h-4 w-4" />
          Pindah Uang
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total balance */}
        <div className="rounded-lg bg-primary/10 p-3 text-center">
          <p className="text-xs text-muted-foreground">Total Saldo</p>
          <p className="font-serif text-xl font-bold text-primary">
            {formatCurrency(totalBalance)}
          </p>
        </div>

        {/* Method list */}
        <div className="space-y-3">
          {paymentMethods.map((method) => {
            const balance = Number(method.balance);
            const percentage = (balance / maxBalance) * 100;
            const isLow = balance < 50000;

            return (
              <div key={method.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{methodIcons[method.icon] || '💳'}</span>
                    <span className="font-medium text-sm">{method.name}</span>
                    {isLow && (
                      <AlertTriangle className="h-4 w-4 text-warning" />
                    )}
                  </div>
                  <span className={cn(
                    'font-semibold text-sm',
                    isLow && 'text-warning'
                  )}>
                    {formatCurrency(balance)}
                  </span>
                </div>
                <Progress 
                  value={percentage} 
                  className={cn(
                    'h-2',
                    isLow && '[&>div]:bg-warning'
                  )}
                />
              </div>
            );
          })}
        </div>

        {/* Low balance warning */}
        {paymentMethods.some((m) => Number(m.balance) < 50000) && (
          <div className="flex items-start gap-2 rounded-lg bg-warning/10 p-3 text-sm">
            <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
            <span className="text-warning">
              {paymentMethods
                .filter((m) => Number(m.balance) < 50000)
                .map((m) => `Saldo ${m.name} hampir habis`)
                .join('. ')}
              . Harap isi ulang.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
