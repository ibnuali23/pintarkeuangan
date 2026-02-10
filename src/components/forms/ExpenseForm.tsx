import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, TrendingDown, Loader2 } from 'lucide-react';
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
import { EXPENSE_CATEGORIES, ExpenseCategory } from '@/types/finance';
import { PaymentMethod } from '@/hooks/useProfileSettings';
import { useDynamicCategories } from '@/hooks/useDynamicCategories';
import { toast } from 'sonner';

const expenseSchema = z.object({
  date: z.date({ required_error: 'Tanggal wajib diisi' }),
  category: z.enum(['Kebutuhan', 'Investasi', 'Keinginan', 'Dana Darurat'], {
    required_error: 'Kategori wajib dipilih',
  }),
  subcategory: z.string().min(1, 'Subkategori wajib dipilih'),
  description: z.string().max(200, 'Deskripsi maksimal 200 karakter').optional(),
  amount: z
    .number({ required_error: 'Nominal wajib diisi' })
    .min(1, 'Nominal harus lebih dari 0'),
  payment_method_id: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
  onSubmit: (data: {
    date: string;
    category: ExpenseCategory;
    subcategory: string;
    description: string;
    amount: number;
    payment_method_id?: string;
  }) => void;
  paymentMethods?: PaymentMethod[];
}

const categoryIcons: Record<ExpenseCategory, string> = {
  Kebutuhan: '🏠',
  Investasi: '📈',
  Keinginan: '🎁',
  'Dana Darurat': '🛡️',
};

const methodIcons: Record<string, string> = {
  wallet: '💵',
  'credit-card': '💳',
  smartphone: '📱',
  building: '🏦',
  coins: '🪙',
};

export function ExpenseForm({ onSubmit, paymentMethods = [] }: ExpenseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amountDisplay, setAmountDisplay] = useState('');
  const { getExpenseSubcategories } = useDynamicCategories();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: new Date(),
      description: '',
    },
  });

  const selectedDate = watch('date');
  const selectedCategory = watch('category');
  const selectedSubcategory = watch('subcategory');
  const selectedPaymentMethod = watch('payment_method_id');

  // Get dynamic subcategories based on selected category
  const availableSubcategories = selectedCategory 
    ? getExpenseSubcategories(selectedCategory)
    : [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Reset subcategory when category changes
  useEffect(() => {
    if (selectedCategory) {
      setValue('subcategory', '');
    }
  }, [selectedCategory, setValue]);

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

  const onFormSubmit = async (data: ExpenseFormData) => {
    setIsSubmitting(true);
    try {
      onSubmit({
        date: format(data.date, 'yyyy-MM-dd'),
        category: data.category,
        subcategory: data.subcategory,
        description: data.description || '',
        amount: data.amount,
        payment_method_id: data.payment_method_id,
      });
      reset();
      setAmountDisplay('');
      toast.success('Pengeluaran berhasil dicatat!', {
        description: `Rp ${new Intl.NumberFormat('id-ID').format(data.amount)} untuk ${data.subcategory}`,
      });
    } catch {
      toast.error('Gagal mencatat pengeluaran');
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

      {/* Category */}
      <div className="space-y-2">
        <Label>Kategori Utama</Label>
        <Select
          value={selectedCategory}
          onValueChange={(value) => setValue('category', value as ExpenseCategory)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih kategori" />
          </SelectTrigger>
          <SelectContent>
            {EXPENSE_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                <span className="flex items-center gap-2">
                  <span>{categoryIcons[cat]}</span>
                  <span>{cat}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && (
          <p className="text-sm text-destructive">{errors.category.message}</p>
        )}
      </div>

      {/* Subcategory */}
      <div className="space-y-2">
        <Label>Subkategori</Label>
        <Select
          value={selectedSubcategory}
          onValueChange={(value) => setValue('subcategory', value)}
          disabled={!selectedCategory}
        >
          <SelectTrigger>
            <SelectValue placeholder={selectedCategory ? 'Pilih subkategori' : 'Pilih kategori dulu'} />
          </SelectTrigger>
          <SelectContent>
            {availableSubcategories.map((sub) => (
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
          placeholder="Contoh: Belanja bulanan di supermarket"
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
        className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
        size="lg"
      >
        {isSubmitting ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <TrendingDown className="mr-2 h-5 w-5" />
            Simpan Pengeluaran
          </>
        )}
      </Button>
    </form>
  );
}
