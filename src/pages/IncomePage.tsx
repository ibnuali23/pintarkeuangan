import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { IncomeForm } from '@/components/forms/IncomeForm';
import { useSupabaseFinanceData, Transaction } from '@/hooks/useSupabaseFinanceData';
import { useProfileSettings } from '@/hooks/useProfileSettings';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, History, Trash2, Edit2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { EditTransactionModal } from '@/components/transactions/EditTransactionModal';
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

export default function IncomePage() {
  const { incomes, addIncome, deleteIncome, updateTransaction, isLoading } = useSupabaseFinanceData();
  const { paymentMethods, adjustPaymentMethodBalance } = useProfileSettings();
  const { toast } = useToast();

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleAddIncome = async (income: any) => {
    const result = await addIncome(income);
    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Gagal menambahkan',
        description: result.error.message,
      });
    } else {
      // Update payment method balance if selected
      if (income.payment_method_id) {
        await adjustPaymentMethodBalance(income.payment_method_id, income.amount, true);
      }
      toast({
        title: 'Berhasil!',
        description: 'Pemasukan berhasil ditambahkan.',
      });
    }
  };

  const handleDeleteIncome = async (incomeId: string, paymentMethodId?: string | null, amount?: number) => {
    const result = await deleteIncome(incomeId);
    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Gagal menghapus',
        description: result.error.message,
      });
    } else {
      // Reverse the balance change if there was a payment method
      if (paymentMethodId && amount) {
        await adjustPaymentMethodBalance(paymentMethodId, amount, false);
      }
      toast({
        title: 'Berhasil!',
        description: 'Pemasukan berhasil dihapus.',
      });
    }
  };
 
   const handleEditTransaction = async (txId: string, data: {
     date: string;
     category: string;
     subcategory: string;
     description: string;
     amount: number;
     type: 'income' | 'expense';
   }) => {
     const result = await updateTransaction(txId, data);
     if (result.error) {
       toast({
         variant: 'destructive',
         title: 'Gagal mengupdate',
         description: result.error.message,
       });
       return { error: result.error };
     }
     toast({ title: 'Transaksi berhasil diperbarui' });
     return {};
   };
 
   const openEditModal = (transaction: Transaction) => {
     setEditingTransaction(transaction);
     setIsEditModalOpen(true);
   };
 
   // Sort by date descending
   const sortedIncomes = [...incomes].sort(
     (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
   );
 
   const recentIncomes = sortedIncomes.slice(0, 10);
 
   if (isLoading) {
     return (
       <Layout>
         <div className="flex h-[60vh] items-center justify-center">
           <div className="animate-pulse text-center">
             <div className="h-12 w-12 mx-auto rounded-full bg-primary/20 mb-4" />
             <p className="text-muted-foreground">Memuat data...</p>
           </div>
         </div>
       </Layout>
     );
   }
 
   return (
     <>
       <Layout>
         <div className="space-y-6">
           {/* Header */}
           <div>
             <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
               <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/20 text-success">
                 <TrendingUp className="h-5 w-5" />
               </div>
               Catat Pemasukan
             </h1>
             <p className="text-muted-foreground mt-2">
               Tambahkan sumber pemasukan baru ke catatan keuangan Anda
             </p>
           </div>
 
           <div className="grid gap-6 lg:grid-cols-2">
             {/* Income form */}
             <Card className="glass-card">
               <CardHeader>
                 <CardTitle className="font-serif">Form Pemasukan Baru</CardTitle>
                 <CardDescription>
                   Isi detail pemasukan dengan lengkap
                 </CardDescription>
               </CardHeader>
               <CardContent>
                 <IncomeForm onSubmit={handleAddIncome} paymentMethods={paymentMethods} />
               </CardContent>
             </Card>
 
             {/* Recent incomes */}
             <Card className="glass-card">
               <CardHeader>
                 <CardTitle className="font-serif flex items-center gap-2">
                   <History className="h-5 w-5" />
                   Riwayat Pemasukan
                 </CardTitle>
                 <CardDescription>
                   {incomes.length} total pemasukan tercatat
                 </CardDescription>
               </CardHeader>
               <CardContent>
                 {recentIncomes.length === 0 ? (
                   <div className="flex h-[300px] items-center justify-center">
                     <div className="text-center">
                       <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                         <span className="text-2xl">💰</span>
                       </div>
                       <p className="text-muted-foreground">Belum ada pemasukan</p>
                     </div>
                   </div>
                 ) : (
                   <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                     {recentIncomes.map((income) => (
                       <div
                         key={income.id}
                         className="flex items-center justify-between p-3 rounded-xl bg-success/5 border border-success/20 hover:bg-success/10 transition-colors group"
                       >
                         <div className="flex items-center gap-3 flex-1 min-w-0">
                           <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/20 text-success">
                             <TrendingUp className="h-5 w-5" />
                           </div>
                           <div className="min-w-0 flex-1">
                             <p className="font-medium text-sm truncate">
                               {income.subcategory}
                             </p>
                             <p className="text-xs text-muted-foreground truncate">
                               {income.description || 'Tidak ada deskripsi'}
                             </p>
                             <p className="text-xs text-muted-foreground">
                               {format(parseISO(income.date), 'd MMM yyyy', { locale: id })}
                             </p>
                           </div>
                         </div>
                         <div className="flex items-center gap-2">
                           <p className="font-semibold text-sm text-success whitespace-nowrap">
                             +{formatCurrency(Number(income.amount))}
                           </p>
                           <Button
                             variant="ghost"
                             size="icon"
                             onClick={() => openEditModal(income)}
                             className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                           >
                             <Edit2 className="h-4 w-4" />
                           </Button>
                           <AlertDialog>
                             <AlertDialogTrigger asChild>
                               <Button
                                 variant="ghost"
                                 size="icon"
                                 className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                               >
                                 <Trash2 className="h-4 w-4" />
                               </Button>
                             </AlertDialogTrigger>
                             <AlertDialogContent>
                               <AlertDialogHeader>
                                 <AlertDialogTitle>Hapus Pemasukan?</AlertDialogTitle>
                                 <AlertDialogDescription>
                                   Anda akan menghapus pemasukan {income.subcategory} sebesar{' '}
                                   {formatCurrency(Number(income.amount))}. Tindakan ini tidak dapat dibatalkan.
                                 </AlertDialogDescription>
                               </AlertDialogHeader>
                               <AlertDialogFooter>
                                 <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteIncome(income.id, (income as any).payment_method_id, Number(income.amount))}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Hapus
                            </AlertDialogAction>
                               </AlertDialogFooter>
                             </AlertDialogContent>
                           </AlertDialog>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               </CardContent>
             </Card>
           </div>
         </div>
       </Layout>
       <EditTransactionModal
         transaction={editingTransaction}
         isOpen={isEditModalOpen}
         onClose={() => {
           setIsEditModalOpen(false);
           setEditingTransaction(null);
         }}
         onSave={handleEditTransaction}
       />
     </>
   );
 }
