import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, ArrowRightLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PaymentMethod } from '@/hooks/useProfileSettings';
import { toast } from 'sonner';

const transferSchema = z.object({
  date: z.date({ required_error: 'Tanggal wajib diisi' }),
  from_method_id: z.string().min(1, 'Pilih metode asal'),
  to_method_id: z.string().min(1, 'Pilih metode tujuan'),
  amount: z.number({ required_error: 'Nominal wajib diisi' }).min(1, 'Nominal harus lebih dari 0'),
  description: z.string().max(200, 'Deskripsi maksimal 200 karakter').optional(),
}).refine((data) => data.from_method_id !== data.to_method_id, {
  message: 'Metode asal dan tujuan tidak boleh sama',
  path: ['to_method_id'],
});

type TransferFormData = z.infer<typeof transferSchema>;

interface MoneyTransferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentMethods: PaymentMethod[];
  onTransfer: (data: {
    from_method_id: string;
    to_method_id: string;
    amount: number;
    description?: string;
    date: string;
  }) => Promise<{ error?: Error; data?: any }>;
  onUpdateBalance: (id: string, amount: number, isIncome: boolean) => Promise<{ error?: Error }>;
}

const methodIcons: Record<string, string> = {
  wallet: '💵',
  'credit-card': '💳',
  smartphone: '📱',
  building: '🏦',
  coins: '🪙',
};

export function MoneyTransferModal({
  open,
  onOpenChange,
  paymentMethods,
  onTransfer,
  onUpdateBalance,
}: MoneyTransferModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amountDisplay, setAmountDisplay] = useState('');

  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      date: new Date(),
      description: '',
    },
  });

  const selectedDate = watch('date');
  const fromMethodId = watch('from_method_id');
  const toMethodId = watch('to_method_id');
  const amount = watch('amount');

  const fromMethod = paymentMethods.find((m) => m.id === fromMethodId);
  const toMethod = paymentMethods.find((m) => m.id === toMethodId);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatCurrencyInput = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers) {
      const formatted = new Intl.NumberFormat('id-ID').format(parseInt(numbers));
      return formatted;
    }
    return '';
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value);
    setAmountDisplay(formatted);
    const numericValue = parseInt(e.target.value.replace(/\D/g, '')) || 0;
    setValue('amount', numericValue);
  };

  const onFormSubmit = async (data: TransferFormData) => {
    if (!fromMethod) return;
    
    // Validate sufficient balance
    if (Number(fromMethod.balance) < data.amount) {
      toast.error('Saldo tidak cukup', {
        description: `Saldo ${fromMethod.name} hanya ${formatCurrency(Number(fromMethod.balance))}`,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // First create the transfer record
      const transferResult = await onTransfer({
        from_method_id: data.from_method_id,
        to_method_id: data.to_method_id,
        amount: data.amount,
        description: data.description,
        date: format(data.date, 'yyyy-MM-dd'),
      });

      if (transferResult.error) {
        toast.error('Gagal membuat transfer');
        return;
      }

      // Then update balances
      await onUpdateBalance(data.from_method_id, data.amount, false); // Decrease from
      await onUpdateBalance(data.to_method_id, data.amount, true); // Increase to

      toast.success('Transfer berhasil!', {
        description: `${formatCurrency(data.amount)} dari ${fromMethod?.name} ke ${toMethod?.name}`,
      });

      reset();
      setAmountDisplay('');
      onOpenChange(false);
    } catch (err) {
      toast.error('Gagal melakukan transfer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setAmountDisplay('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Pindah Uang
          </DialogTitle>
          <DialogDescription>
            Transfer saldo antar metode pembayaran
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          {/* Date picker */}
          <div className="space-y-2">
            <Label>Tanggal</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !selectedDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'dd MMMM yyyy') : 'Pilih tanggal'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setValue('date', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.date && (
              <p className="text-sm text-destructive">{errors.date.message}</p>
            )}
          </div>

          {/* From method */}
          <div className="space-y-2">
            <Label>Dari (Metode Asal)</Label>
            <Select
              value={fromMethodId}
              onValueChange={(value) => setValue('from_method_id', value)}
            >
              <SelectTrigger className="border-destructive/30">
                <SelectValue placeholder="Pilih metode asal" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method.id} value={method.id}>
                    <span className="flex items-center gap-2">
                      <span>{methodIcons[method.icon] || '💳'}</span>
                      <span>{method.name}</span>
                      <span className="text-muted-foreground">
                        ({formatCurrency(Number(method.balance))})
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.from_method_id && (
              <p className="text-sm text-destructive">{errors.from_method_id.message}</p>
            )}
          </div>

          {/* To method */}
          <div className="space-y-2">
            <Label>Ke (Metode Tujuan)</Label>
            <Select
              value={toMethodId}
              onValueChange={(value) => setValue('to_method_id', value)}
            >
              <SelectTrigger className="border-success/30">
                <SelectValue placeholder="Pilih metode tujuan" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods
                  .filter((m) => m.id !== fromMethodId)
                  .map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      <span className="flex items-center gap-2">
                        <span>{methodIcons[method.icon] || '💳'}</span>
                        <span>{method.name}</span>
                        <span className="text-muted-foreground">
                          ({formatCurrency(Number(method.balance))})
                        </span>
                      </span>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {errors.to_method_id && (
              <p className="text-sm text-destructive">{errors.to_method_id.message}</p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label>Nominal (Rp)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                Rp
              </span>
              <Input
                type="text"
                inputMode="numeric"
                value={amountDisplay}
                onChange={handleAmountChange}
                placeholder="0"
                className="pl-10"
              />
            </div>
            {fromMethod && amount > Number(fromMethod.balance) && (
              <p className="text-sm text-destructive">
                Saldo tidak cukup. Tersedia: {formatCurrency(Number(fromMethod.balance))}
              </p>
            )}
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Deskripsi (opsional)</Label>
            <Textarea
              placeholder="Contoh: Tarik tunai dari Bank ke Cash"
              className="resize-none"
              rows={2}
              onChange={(e) => setValue('description', e.target.value)}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Preview */}
          {fromMethod && toMethod && amount > 0 && (
            <div className="rounded-lg bg-secondary/50 p-3 text-sm">
              <p className="text-center">
                <span className="text-destructive">{fromMethod.name}</span>
                {' → '}
                <span className="font-semibold">{formatCurrency(amount)}</span>
                {' → '}
                <span className="text-success">{toMethod.name}</span>
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleClose}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="flex-1 gradient-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Kirim'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
