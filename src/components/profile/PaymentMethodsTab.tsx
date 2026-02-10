 import { useState } from 'react';
 import { useProfileSettings, PaymentMethod } from '@/hooks/useProfileSettings';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Button } from '@/components/ui/button';
 import { useToast } from '@/hooks/use-toast';
 import { 
   CreditCard, Plus, Trash2, Edit2, Save, X, Loader2, 
   Wallet, Smartphone, Building2, Banknote
 } from 'lucide-react';
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
 } from '@/components/ui/dialog';
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
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from '@/components/ui/select';
 
 const iconOptions = [
   { value: 'wallet', label: 'Cash', icon: Wallet },
   { value: 'smartphone', label: 'E-Wallet', icon: Smartphone },
   { value: 'building', label: 'Bank', icon: Building2 },
   { value: 'card', label: 'Kartu', icon: CreditCard },
   { value: 'banknote', label: 'Uang', icon: Banknote },
 ];
 
 const getIconComponent = (iconName: string) => {
   const option = iconOptions.find(o => o.value === iconName);
   return option?.icon || Wallet;
 };
 
 export function PaymentMethodsTab() {
   const { paymentMethods, addPaymentMethod, updatePaymentMethod, deletePaymentMethod, isLoading } = useProfileSettings();
   const { toast } = useToast();
 
   const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
   const [editingId, setEditingId] = useState<string | null>(null);
   const [isSubmitting, setIsSubmitting] = useState(false);
 
   // Form state
   const [formName, setFormName] = useState('');
   const [formBalance, setFormBalance] = useState('');
   const [formIcon, setFormIcon] = useState('wallet');
 
   const formatCurrency = (value: number) => {
     return new Intl.NumberFormat('id-ID', {
       style: 'currency',
       currency: 'IDR',
       minimumFractionDigits: 0,
     }).format(value);
   };
 
   const formatCurrencyInput = (value: string) => {
     const numbers = value.replace(/\D/g, '');
     return numbers ? new Intl.NumberFormat('id-ID').format(parseInt(numbers)) : '';
   };
 
   const resetForm = () => {
     setFormName('');
     setFormBalance('');
     setFormIcon('wallet');
     setEditingId(null);
   };
 
   const handleAdd = async () => {
     if (!formName.trim()) {
       toast({ variant: 'destructive', title: 'Nama metode pembayaran wajib diisi' });
       return;
     }
 
     setIsSubmitting(true);
     const balance = parseInt(formBalance.replace(/\D/g, '')) || 0;
     const { error } = await addPaymentMethod(formName.trim(), balance, formIcon);
     setIsSubmitting(false);
 
     if (error) {
       toast({ variant: 'destructive', title: 'Gagal menambahkan', description: error.message });
     } else {
       toast({ title: 'Metode pembayaran berhasil ditambahkan' });
       resetForm();
       setIsAddDialogOpen(false);
     }
   };
 
   const startEdit = (method: PaymentMethod) => {
     setEditingId(method.id);
     setFormName(method.name);
     setFormBalance(new Intl.NumberFormat('id-ID').format(method.balance));
     setFormIcon(method.icon || 'wallet');
   };
 
   const handleUpdate = async () => {
     if (!editingId || !formName.trim()) {
       toast({ variant: 'destructive', title: 'Nama metode pembayaran wajib diisi' });
       return;
     }
 
     setIsSubmitting(true);
     const balance = parseInt(formBalance.replace(/\D/g, '')) || 0;
     const { error } = await updatePaymentMethod(editingId, { name: formName.trim(), balance, icon: formIcon });
     setIsSubmitting(false);
 
     if (error) {
       toast({ variant: 'destructive', title: 'Gagal mengupdate', description: error.message });
     } else {
       toast({ title: 'Metode pembayaran berhasil diupdate' });
       resetForm();
     }
   };
 
   const handleDelete = async (id: string) => {
     const { error } = await deletePaymentMethod(id);
     if (error) {
       toast({ variant: 'destructive', title: 'Gagal menghapus', description: error.message });
     } else {
       toast({ title: 'Metode pembayaran berhasil dihapus' });
     }
   };
 
   const totalBalance = paymentMethods.reduce((sum, m) => sum + Number(m.balance), 0);
 
   if (isLoading) {
     return (
       <div className="flex items-center justify-center h-64">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
       </div>
     );
   }
 
   return (
     <div className="space-y-6">
       {/* Total Balance Card */}
       <Card className="glass-card border-primary/20">
         <CardContent className="pt-6">
           <div className="flex items-center justify-between">
             <div>
               <p className="text-sm text-muted-foreground">Total Saldo Semua Metode</p>
               <p className="text-2xl font-bold font-serif text-primary">{formatCurrency(totalBalance)}</p>
             </div>
             <div className="h-12 w-12 rounded-full gradient-primary flex items-center justify-center">
               <CreditCard className="h-6 w-6 text-primary-foreground" />
             </div>
           </div>
         </CardContent>
       </Card>
 
       {/* Payment Methods List */}
       <Card className="glass-card">
         <CardHeader className="flex flex-row items-center justify-between">
           <div>
             <CardTitle className="font-serif flex items-center gap-2">
               <CreditCard className="h-5 w-5 text-primary" />
               Metode Pembayaran
             </CardTitle>
             <CardDescription>Kelola daftar metode pembayaran Anda</CardDescription>
           </div>
           <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
             <DialogTrigger asChild>
               <Button className="gradient-primary text-primary-foreground">
                 <Plus className="mr-2 h-4 w-4" />
                 Tambah Baru
               </Button>
             </DialogTrigger>
             <DialogContent>
               <DialogHeader>
                 <DialogTitle>Tambah Metode Pembayaran</DialogTitle>
                 <DialogDescription>Tambahkan metode pembayaran baru dengan saldo awal</DialogDescription>
               </DialogHeader>
               <div className="space-y-4 py-4">
                 <div className="space-y-2">
                   <Label>Nama Metode</Label>
                   <Input
                     value={formName}
                     onChange={(e) => setFormName(e.target.value)}
                     placeholder="Contoh: GoPay, Dana, BCA"
                   />
                 </div>
                 <div className="space-y-2">
                   <Label>Saldo Awal (Rp)</Label>
                   <div className="relative">
                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Rp</span>
                     <Input
                       type="text"
                       inputMode="numeric"
                       value={formBalance}
                       onChange={(e) => setFormBalance(formatCurrencyInput(e.target.value))}
                       placeholder="0"
                       className="pl-10"
                     />
                   </div>
                 </div>
                 <div className="space-y-2">
                   <Label>Ikon</Label>
                   <Select value={formIcon} onValueChange={setFormIcon}>
                     <SelectTrigger>
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       {iconOptions.map((opt) => {
                         const Icon = opt.icon;
                         return (
                           <SelectItem key={opt.value} value={opt.value}>
                             <span className="flex items-center gap-2">
                               <Icon className="h-4 w-4" />
                               {opt.label}
                             </span>
                           </SelectItem>
                         );
                       })}
                     </SelectContent>
                   </Select>
                 </div>
               </div>
               <DialogFooter>
                 <Button variant="outline" onClick={() => { resetForm(); setIsAddDialogOpen(false); }}>
                   Batal
                 </Button>
                 <Button onClick={handleAdd} disabled={isSubmitting} className="gradient-primary text-primary-foreground">
                   {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Tambah'}
                 </Button>
               </DialogFooter>
             </DialogContent>
           </Dialog>
         </CardHeader>
         <CardContent>
           {paymentMethods.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-12 text-center">
               <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                 <CreditCard className="h-8 w-8 text-muted-foreground" />
               </div>
               <p className="text-muted-foreground">Belum ada metode pembayaran</p>
               <p className="text-sm text-muted-foreground">Klik tombol "Tambah Baru" untuk menambahkan</p>
             </div>
           ) : (
             <div className="space-y-3">
               {paymentMethods.map((method) => {
                 const Icon = getIconComponent(method.icon || 'wallet');
                 const isEditing = editingId === method.id;
 
                 return (
                   <div
                     key={method.id}
                     className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors group"
                   >
                     {isEditing ? (
                       <div className="flex-1 space-y-3">
                         <div className="flex gap-2">
                           <Input
                             value={formName}
                             onChange={(e) => setFormName(e.target.value)}
                             placeholder="Nama metode"
                             className="flex-1"
                           />
                           <Select value={formIcon} onValueChange={setFormIcon}>
                             <SelectTrigger className="w-32">
                               <SelectValue />
                             </SelectTrigger>
                             <SelectContent>
                               {iconOptions.map((opt) => {
                                 const OptIcon = opt.icon;
                                 return (
                                   <SelectItem key={opt.value} value={opt.value}>
                                     <span className="flex items-center gap-2">
                                       <OptIcon className="h-4 w-4" />
                                       {opt.label}
                                     </span>
                                   </SelectItem>
                                 );
                               })}
                             </SelectContent>
                           </Select>
                         </div>
                         <div className="flex items-center gap-2">
                           <div className="relative flex-1">
                             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Rp</span>
                             <Input
                               type="text"
                               inputMode="numeric"
                               value={formBalance}
                               onChange={(e) => setFormBalance(formatCurrencyInput(e.target.value))}
                               placeholder="0"
                               className="pl-10"
                             />
                           </div>
                           <Button size="sm" onClick={handleUpdate} disabled={isSubmitting}>
                             {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                           </Button>
                           <Button size="sm" variant="ghost" onClick={resetForm}>
                             <X className="h-4 w-4" />
                           </Button>
                         </div>
                       </div>
                     ) : (
                       <>
                         <div className="flex items-center gap-3">
                           <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
                             <Icon className="h-5 w-5" />
                           </div>
                           <div>
                             <p className="font-medium">{method.name}</p>
                             <p className="text-sm text-muted-foreground">
                               Saldo: <span className="font-semibold text-foreground">{formatCurrency(method.balance)}</span>
                             </p>
                           </div>
                         </div>
                         <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(method)}>
                             <Edit2 className="h-4 w-4" />
                           </Button>
                           <AlertDialog>
                             <AlertDialogTrigger asChild>
                               <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive">
                                 <Trash2 className="h-4 w-4" />
                               </Button>
                             </AlertDialogTrigger>
                             <AlertDialogContent>
                               <AlertDialogHeader>
                                 <AlertDialogTitle>Hapus Metode Pembayaran?</AlertDialogTitle>
                                 <AlertDialogDescription>
                                   Anda akan menghapus metode pembayaran "{method.name}". Tindakan ini tidak dapat dibatalkan.
                                 </AlertDialogDescription>
                               </AlertDialogHeader>
                               <AlertDialogFooter>
                                 <AlertDialogCancel>Batal</AlertDialogCancel>
                                 <AlertDialogAction
                                   onClick={() => handleDelete(method.id)}
                                   className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                 >
                                   Hapus
                                 </AlertDialogAction>
                               </AlertDialogFooter>
                             </AlertDialogContent>
                           </AlertDialog>
                         </div>
                       </>
                     )}
                   </div>
                 );
               })}
             </div>
           )}
         </CardContent>
       </Card>
     </div>
   );
 }