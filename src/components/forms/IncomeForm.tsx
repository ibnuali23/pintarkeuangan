import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, TrendingUp, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { IncomeSubcategory } from '@/types/finance';
import { PaymentMethod } from '@/hooks/useProfileSettings';
import { useDynamicCategories } from '@/hooks/useDynamicCategories';
import { toast } from 'sonner';

const incomeSchema = z.object({
  date: z.date({ required_error: 'Tanggal wajib diisi' }),
  subcategory: z.string().min(1, 'Subkategori wajib dipilih'),
  description: z.string().max(200, 'Deskripsi maksimal 200 karakter').optional(),
  amount: z
    .number({ required_error: 'Nominal wajib diisi' })
    .min(1, 'Nominal harus lebih dari 0'),
  payment_method_id: z.string().optional(),
});

type IncomeFormData = z.infer<typeof incomeSchema>;

interface IncomeFormProps {
  onSubmit: (data: {
    date: string;
    category: 'Pemasukan';
    subcategory: IncomeSubcategory;
    description: string;
    amount: number;
    payment_method_id?: string;
  }) => void;
  paymentMethods?: PaymentMethod[];
}

const methodIcons: Record<string, string> = {
  wallet: '💵',
  'credit-card': '💳',
  smartphone: '📱',
  building: '🏦',
  coins: '🪙',
};

export function IncomeForm({ onSubmit, paymentMethods = [] }: IncomeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amountDisplay, setAmountDisplay] = useState('');
  const { incomeSubcategories } = useDynamicCategories();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      date: new Date(),
      description: '',
    },
  });

  const selectedDate = watch('date');
  const selectedSubcategory = watch('subcategory');
  const selectedPaymentMethod = watch('payment_method_id');

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

  const onFormSubmit = async (data: IncomeFormData) => {
    setIsSubmitting(true);
    try {
      onSubmit({
        date: format(data.date, 'yyyy-MM-dd'),
        category: 'Pemasukan',
        subcategory: data.subcategory as IncomeSubcategory,
        description: data.description || '',
        amount: data.amount,
        payment_method_id: data.payment_method_id,
      });
      reset();
      setAmountDisplay('');
      toast.success('Pemasukan berhasil dicatat!', {
        description: `Rp ${new Intl.NumberFormat('id-ID').format(data.amount)} dari ${data.subcategory}`,
      });
    } catch {
      toast.error('Gagal mencatat pemasukan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
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

      {/* Subcategory (Jenis Pemasukan) */}
      <div className="space-y-2">
        <Label>Jenis Pemasukan</Label>
        <Select
          value={selectedSubcategory}
          onValueChange={(value) => setValue('subcategory', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih jenis pemasukan" />
          </SelectTrigger>
          <SelectContent>
            {incomeSubcategories.map((sub) => (
              <SelectItem key={sub} value={sub}>
                {sub}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.subcategory && (
          <p className="text-sm text-destructive">{errors.subcategory.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label>Deskripsi (opsional)</Label>
        <Textarea
          {...register('description')}
          placeholder="Contoh: Gaji bulan Januari 2024"
          className="resize-none"
          rows={2}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
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
        {errors.amount && (
          <p className="text-sm text-destructive">{errors.amount.message}</p>
        )}
      </div>

      {/* Payment Method */}
      {paymentMethods.length > 0 && (
        <div className="space-y-2">
          <Label>Metode Pembayaran</Label>
          <Select
            value={selectedPaymentMethod}
            onValueChange={(value) => setValue('payment_method_id', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih metode (opsional)" />
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
        </div>
      )}

      {/* Submit button */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full gradient-primary text-primary-foreground"
        size="lg"
      >
        {isSubmitting ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <TrendingUp className="mr-2 h-5 w-5" />
            Simpan Pemasukan
          </>
        )}
      </Button>
    </form>
  );
}
