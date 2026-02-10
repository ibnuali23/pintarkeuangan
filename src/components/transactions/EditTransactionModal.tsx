 import { useState, useEffect } from 'react';
 import { useForm } from 'react-hook-form';
 import { zodResolver } from '@hookform/resolvers/zod';
 import { z } from 'zod';
 import { format, parseISO } from 'date-fns';
 import { CalendarIcon, Loader2, Save } from 'lucide-react';
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
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
 } from '@/components/ui/dialog';
 import { EXPENSE_CATEGORIES, EXPENSE_SUBCATEGORIES, INCOME_SUBCATEGORIES, ExpenseCategory } from '@/types/finance';
 import { Transaction } from '@/hooks/useSupabaseFinanceData';
 
 const transactionSchema = z.object({
   date: z.date({ required_error: 'Tanggal wajib diisi' }),
   category: z.string().min(1, 'Kategori wajib dipilih'),
   subcategory: z.string().min(1, 'Subkategori wajib dipilih'),
   description: z.string().max(200, 'Deskripsi maksimal 200 karakter').optional(),
   amount: z.number({ required_error: 'Nominal wajib diisi' }).min(1, 'Nominal harus lebih dari 0'),
   type: z.enum(['income', 'expense']),
 });
 
 type TransactionFormData = z.infer<typeof transactionSchema>;
 
 interface EditTransactionModalProps {
   transaction: Transaction | null;
   isOpen: boolean;
   onClose: () => void;
   onSave: (id: string, data: {
     date: string;
     category: string;
     subcategory: string;
     description: string;
     amount: number;
     type: 'income' | 'expense';
   }) => Promise<{ error?: Error }>;
 }
 
 const categoryIcons: Record<ExpenseCategory, string> = {
   Kebutuhan: '🏠',
   Investasi: '📈',
   Keinginan: '🎁',
   'Dana Darurat': '🛡️',
 };
 
 export function EditTransactionModal({ transaction, isOpen, onClose, onSave }: EditTransactionModalProps) {
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [amountDisplay, setAmountDisplay] = useState('');
   const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([]);
 
   const {
     handleSubmit,
     setValue,
     watch,
     reset,
     formState: { errors },
   } = useForm<TransactionFormData>({
     resolver: zodResolver(transactionSchema),
   });
 
   const selectedDate = watch('date');
   const selectedCategory = watch('category');
   const selectedSubcategory = watch('subcategory');
   const selectedType = watch('type');
 
   // Initialize form when transaction changes
   useEffect(() => {
     if (transaction && isOpen) {
       const txDate = parseISO(transaction.date);
       setValue('date', txDate);
       setValue('category', transaction.category);
       setValue('subcategory', transaction.subcategory);
       setValue('description', transaction.description || '');
       setValue('amount', Number(transaction.amount));
       setValue('type', transaction.type);
       setAmountDisplay(new Intl.NumberFormat('id-ID').format(Number(transaction.amount)));
 
       // Set subcategories based on type
       if (transaction.type === 'expense') {
         setAvailableSubcategories(EXPENSE_SUBCATEGORIES[transaction.category as ExpenseCategory] || []);
       } else {
         setAvailableSubcategories(INCOME_SUBCATEGORIES);
       }
     }
   }, [transaction, isOpen, setValue]);
 
   // Update subcategories when category changes
   useEffect(() => {
     if (selectedType === 'expense' && selectedCategory) {
       setAvailableSubcategories(EXPENSE_SUBCATEGORIES[selectedCategory as ExpenseCategory] || []);
     } else if (selectedType === 'income') {
       setAvailableSubcategories(INCOME_SUBCATEGORIES);
     }
   }, [selectedCategory, selectedType]);
 
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
     setValue('amount', numericValue);
   };
 
   const handleClose = () => {
     reset();
     setAmountDisplay('');
     onClose();
   };
 
   const onFormSubmit = async (data: TransactionFormData) => {
     if (!transaction) return;
 
     setIsSubmitting(true);
     const result = await onSave(transaction.id, {
       date: format(data.date, 'yyyy-MM-dd'),
       category: data.category,
       subcategory: data.subcategory,
       description: data.description || '',
       amount: data.amount,
       type: data.type,
     });
     setIsSubmitting(false);
 
     if (!result.error) {
       handleClose();
     }
   };
 
   if (!transaction) return null;
 
   return (
     <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
       <DialogContent className="max-w-lg">
         <DialogHeader>
           <DialogTitle className="font-serif">Edit Transaksi</DialogTitle>
           <DialogDescription>
             Ubah detail transaksi {transaction.type === 'income' ? 'pemasukan' : 'pengeluaran'}
           </DialogDescription>
         </DialogHeader>
 
         <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
           {/* Transaction Type */}
           <div className="space-y-2">
             <Label>Jenis Transaksi</Label>
             <Select
               value={selectedType}
               onValueChange={(value: 'income' | 'expense') => {
                 setValue('type', value);
                 setValue('category', value === 'income' ? 'Pemasukan' : '');
                 setValue('subcategory', '');
               }}
             >
               <SelectTrigger>
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="income">
                   <span className="flex items-center gap-2 text-success">💰 Pemasukan</span>
                 </SelectItem>
                 <SelectItem value="expense">
                   <span className="flex items-center gap-2 text-destructive">💸 Pengeluaran</span>
                 </SelectItem>
               </SelectContent>
             </Select>
           </div>
 
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
             {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
           </div>
 
           {/* Category (only for expense) */}
           {selectedType === 'expense' && (
             <div className="space-y-2">
               <Label>Kategori Utama</Label>
               <Select
                 value={selectedCategory}
                 onValueChange={(value) => {
                   setValue('category', value);
                   setValue('subcategory', '');
                 }}
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
               {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
             </div>
           )}
 
           {/* Subcategory */}
           <div className="space-y-2">
             <Label>{selectedType === 'income' ? 'Jenis Pemasukan' : 'Subkategori'}</Label>
             <Select
               value={selectedSubcategory}
               onValueChange={(value) => setValue('subcategory', value)}
               disabled={selectedType === 'expense' && !selectedCategory}
             >
               <SelectTrigger>
                 <SelectValue placeholder="Pilih subkategori" />
               </SelectTrigger>
               <SelectContent>
                 {availableSubcategories.map((sub) => (
                   <SelectItem key={sub} value={sub}>
                     {sub}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
             {errors.subcategory && <p className="text-sm text-destructive">{errors.subcategory.message}</p>}
           </div>
 
           {/* Description */}
           <div className="space-y-2">
             <Label>Deskripsi (opsional)</Label>
             <Textarea
               value={watch('description') || ''}
               onChange={(e) => setValue('description', e.target.value)}
               placeholder="Catatan tambahan"
               className="resize-none"
               rows={2}
             />
             {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
           </div>
 
           {/* Amount */}
           <div className="space-y-2">
             <Label>Nominal (Rp)</Label>
             <div className="relative">
               <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Rp</span>
               <Input
                 type="text"
                 inputMode="numeric"
                 value={amountDisplay}
                 onChange={handleAmountChange}
                 placeholder="0"
                 className="pl-10"
               />
             </div>
             {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
           </div>
 
           <DialogFooter className="gap-2 pt-4">
             <Button type="button" variant="outline" onClick={handleClose}>
               Batal
             </Button>
             <Button
               type="submit"
               disabled={isSubmitting}
               className="gradient-primary text-primary-foreground"
             >
               {isSubmitting ? (
                 <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</>
               ) : (
                 <><Save className="mr-2 h-4 w-4" />Simpan Perubahan</>
               )}
             </Button>
           </DialogFooter>
         </form>
       </DialogContent>
     </Dialog>
   );
 }