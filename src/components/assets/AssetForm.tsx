import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Save } from 'lucide-react';
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
import { toast } from 'sonner';
import { ASSET_CATEGORIES, AssetCategory, Asset } from '@/types/asset';

const assetSchema = z.object({
    name: z.string().min(1, 'Nama aset wajib diisi').max(100, 'Maksimal 100 karakter'),
    category: z.string().min(1, 'Kategori wajib dipilih'),
    value: z
        .number({ required_error: 'Nilai aset wajib diisi' })
        .min(0, 'Nilai aset tidak boleh negatif'),
    purchase_year: z.number().min(1900, 'Tahun tidak valid').max(new Date().getFullYear(), 'Tahun tidak bisa melebihi tahun ini').optional().or(z.literal(0)),
    notes: z.string().max(200, 'Maksimal 200 karakter').optional(),
});

type AssetFormData = z.infer<typeof assetSchema>;

interface AssetFormProps {
    initialData?: Asset;
    onSubmit: (data: Omit<Asset, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<{ error?: any }>;
    onSuccess?: () => void;
}

export function AssetForm({ initialData, onSubmit, onSuccess }: AssetFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [amountDisplay, setAmountDisplay] = useState(
        initialData ? new Intl.NumberFormat('id-ID').format(initialData.value) : ''
    );

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<AssetFormData>({
        resolver: zodResolver(assetSchema),
        defaultValues: {
            name: initialData?.name || '',
            category: initialData?.category || '',
            value: initialData?.value || 0,
            purchase_year: initialData?.purchase_year || undefined,
            notes: initialData?.notes || '',
        },
    });

    const selectedCategory = watch('category');

    const formatCurrencyInput = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        if (numbers) {
            return new Intl.NumberFormat('id-ID').format(parseInt(numbers));
        }
        return '';
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatCurrencyInput(e.target.value);
        setAmountDisplay(formatted);
        const numericValue = parseInt(e.target.value.replace(/\D/g, '')) || 0;
        setValue('value', numericValue, { shouldValidate: true });
    };

    const onFormSubmit = async (data: AssetFormData) => {
        setIsSubmitting(true);
        try {
            const payload = {
                name: data.name,
                category: data.category as AssetCategory,
                value: data.value,
                purchase_year: data.purchase_year || null,
                notes: data.notes || null,
            };

            const result = await onSubmit(payload);

            if (!result?.error) {
                if (!initialData) {
                    reset();
                    setAmountDisplay('');
                }
                if (onSuccess) onSuccess();
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
            <div className="space-y-2">
                <Label>Nama Aset</Label>
                <Input
                    {...register('name')}
                    placeholder="Contoh: Motor Honda Beat, MacBook Pro"
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
                <Label>Kategori</Label>
                <Select
                    value={selectedCategory}
                    onValueChange={(value) => setValue('category', value, { shouldValidate: true })}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                        {ASSET_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                                {cat}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
            </div>

            <div className="space-y-2">
                <Label>Nilai Saat Ini / Harga Pembelian (Rp)</Label>
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
                {errors.value && <p className="text-sm text-destructive">{errors.value.message}</p>}
                <p className="text-xs text-muted-foreground">
                    Masukkan nilai aset. Jika fitur depresiasi diaktifkan, nilai akan menyusut otomatis.
                </p>
            </div>

            <div className="space-y-2">
                <Label>Tahun Pembelian (Opsional)</Label>
                <Input
                    type="number"
                    placeholder="Contoh: 2021"
                    {...register('purchase_year', { valueAsNumber: true })}
                />
                {errors.purchase_year && <p className="text-sm text-destructive">{errors.purchase_year.message}</p>}
            </div>

            <div className="space-y-2">
                <Label>Catatan Tambahan (Opsional)</Label>
                <Textarea
                    {...register('notes')}
                    placeholder="Detail tambahan mengenai aset..."
                    rows={3}
                    className="resize-none"
                />
                {errors.notes && <p className="text-sm text-destructive">{errors.notes.message}</p>}
            </div>

            <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full"
            >
                {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                    <Save className="h-4 w-4 mr-2" />
                )}
                {initialData ? 'Simpan Perubahan' : 'Tambah Aset'}
            </Button>
        </form>
    );
}
