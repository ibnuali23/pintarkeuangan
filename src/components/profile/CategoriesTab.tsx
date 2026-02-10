 import { useState } from 'react';
 import { useProfileSettings, CustomCategory } from '@/hooks/useProfileSettings';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Button } from '@/components/ui/button';
 import { useToast } from '@/hooks/use-toast';
 import { EXPENSE_CATEGORIES, EXPENSE_SUBCATEGORIES, INCOME_SUBCATEGORIES, ExpenseCategory } from '@/types/finance';
 import { FolderOpen, Plus, Trash2, Edit2, Save, X, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
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
 import {
   Accordion,
   AccordionContent,
   AccordionItem,
   AccordionTrigger,
 } from '@/components/ui/accordion';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 
 const categoryIcons: Record<ExpenseCategory, string> = {
   Kebutuhan: '🏠',
   Investasi: '📈',
   Keinginan: '🎁',
   'Dana Darurat': '🛡️',
 };
 
 export function CategoriesTab() {
   const { customCategories, addCustomCategory, updateCustomCategory, deleteCustomCategory, isLoading } = useProfileSettings();
   const { toast } = useToast();
 
   const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
   const [editingId, setEditingId] = useState<string | null>(null);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
 
   // Form state
   const [formCategory, setFormCategory] = useState('');
   const [formSubcategory, setFormSubcategory] = useState('');
   const [formType, setFormType] = useState<'income' | 'expense'>('expense');
   const [editSubcategory, setEditSubcategory] = useState('');
 
   const resetForm = () => {
     setFormCategory('');
     setFormSubcategory('');
     setFormType('expense');
     setEditingId(null);
     setEditSubcategory('');
   };
 
   const handleAdd = async () => {
     if (!formCategory.trim() || !formSubcategory.trim()) {
       toast({ variant: 'destructive', title: 'Kategori dan subkategori wajib diisi' });
       return;
     }
 
     setIsSubmitting(true);
     const { error } = await addCustomCategory(formCategory.trim(), formSubcategory.trim(), formType);
     setIsSubmitting(false);
 
     if (error) {
       toast({ variant: 'destructive', title: 'Gagal menambahkan', description: error.message });
     } else {
       toast({ title: 'Subkategori berhasil ditambahkan' });
       resetForm();
       setIsAddDialogOpen(false);
     }
   };
 
   const startEdit = (cat: CustomCategory) => {
     setEditingId(cat.id);
     setEditSubcategory(cat.subcategory);
   };
 
   const handleUpdate = async () => {
     if (!editingId || !editSubcategory.trim()) {
       toast({ variant: 'destructive', title: 'Nama subkategori wajib diisi' });
       return;
     }
 
     setIsSubmitting(true);
     const { error } = await updateCustomCategory(editingId, { subcategory: editSubcategory.trim() });
     setIsSubmitting(false);
 
     if (error) {
       toast({ variant: 'destructive', title: 'Gagal mengupdate', description: error.message });
     } else {
       toast({ title: 'Subkategori berhasil diupdate' });
       resetForm();
     }
   };
 
   const handleDelete = async (id: string) => {
     const { error } = await deleteCustomCategory(id);
     if (error) {
       toast({ variant: 'destructive', title: 'Gagal menghapus', description: error.message });
     } else {
       toast({ title: 'Subkategori berhasil dihapus' });
     }
   };
 
   const expenseCustomCategories = customCategories.filter(c => c.type === 'expense');
   const incomeCustomCategories = customCategories.filter(c => c.type === 'income');
 
   // Group custom categories by category
   const getGroupedCustomCategories = (type: 'income' | 'expense') => {
     const cats = type === 'expense' ? expenseCustomCategories : incomeCustomCategories;
     const grouped: Record<string, CustomCategory[]> = {};
     cats.forEach(cat => {
       if (!grouped[cat.category]) {
         grouped[cat.category] = [];
       }
       grouped[cat.category].push(cat);
     });
     return grouped;
   };
 
   if (isLoading) {
     return (
       <div className="flex items-center justify-center h-64">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
       </div>
     );
   }
 
   return (
     <div className="space-y-6">
       <Card className="glass-card">
         <CardHeader className="flex flex-row items-center justify-between">
           <div>
             <CardTitle className="font-serif flex items-center gap-2">
               <FolderOpen className="h-5 w-5 text-primary" />
               Kategori & Subkategori
             </CardTitle>
             <CardDescription>Kelola kategori dan subkategori transaksi Anda</CardDescription>
           </div>
           <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
             <DialogTrigger asChild>
               <Button className="gradient-primary text-primary-foreground">
                 <Plus className="mr-2 h-4 w-4" />
                 Tambah Subkategori
               </Button>
             </DialogTrigger>
             <DialogContent>
               <DialogHeader>
                 <DialogTitle>Tambah Subkategori Baru</DialogTitle>
                 <DialogDescription>Tambahkan subkategori baru ke dalam kategori yang ada</DialogDescription>
               </DialogHeader>
               <div className="space-y-4 py-4">
                 <div className="space-y-2">
                   <Label>Jenis Transaksi</Label>
                   <Select value={formType} onValueChange={(v) => { setFormType(v as 'income' | 'expense'); setFormCategory(''); }}>
                     <SelectTrigger>
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="expense">
                         <span className="flex items-center gap-2">
                           <TrendingDown className="h-4 w-4 text-destructive" />
                           Pengeluaran
                         </span>
                       </SelectItem>
                       <SelectItem value="income">
                         <span className="flex items-center gap-2">
                           <TrendingUp className="h-4 w-4 text-success" />
                           Pemasukan
                         </span>
                       </SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
                 <div className="space-y-2">
                   <Label>Kategori Utama</Label>
                   {formType === 'expense' ? (
                     <Select value={formCategory} onValueChange={setFormCategory}>
                       <SelectTrigger>
                         <SelectValue placeholder="Pilih kategori" />
                       </SelectTrigger>
                       <SelectContent>
                         {EXPENSE_CATEGORIES.map((cat) => (
                           <SelectItem key={cat} value={cat}>
                             <span className="flex items-center gap-2">
                               <span>{categoryIcons[cat]}</span>
                               {cat}
                             </span>
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   ) : (
                     <Input
                       value={formCategory}
                       onChange={(e) => setFormCategory(e.target.value)}
                       placeholder="Contoh: Pemasukan"
                     />
                   )}
                 </div>
                 <div className="space-y-2">
                   <Label>Nama Subkategori</Label>
                   <Input
                     value={formSubcategory}
                     onChange={(e) => setFormSubcategory(e.target.value)}
                     placeholder="Contoh: Bonus Tahunan"
                   />
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
           <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'expense' | 'income')}>
             <TabsList className="grid w-full grid-cols-2 mb-4">
               <TabsTrigger value="expense" className="flex items-center gap-2">
                 <TrendingDown className="h-4 w-4" />
                 Pengeluaran
               </TabsTrigger>
               <TabsTrigger value="income" className="flex items-center gap-2">
                 <TrendingUp className="h-4 w-4" />
                 Pemasukan
               </TabsTrigger>
             </TabsList>
 
             <TabsContent value="expense">
               <Accordion type="multiple" className="w-full">
                 {EXPENSE_CATEGORIES.map((category) => {
                   const defaultSubs = EXPENSE_SUBCATEGORIES[category] || [];
                   const customSubs = expenseCustomCategories.filter(c => c.category === category);
 
                   return (
                     <AccordionItem key={category} value={category}>
                       <AccordionTrigger className="hover:no-underline">
                         <div className="flex items-center gap-2">
                           <span className="text-xl">{categoryIcons[category]}</span>
                           <span className="font-medium">{category}</span>
                           <span className="text-xs text-muted-foreground">
                             ({defaultSubs.length + customSubs.length} subkategori)
                           </span>
                         </div>
                       </AccordionTrigger>
                       <AccordionContent>
                         <div className="space-y-2 pt-2">
                           {/* Default subcategories */}
                           {defaultSubs.map((sub) => (
                             <div key={sub} className="flex items-center justify-between p-2 rounded-lg bg-secondary/20">
                               <span className="text-sm">{sub}</span>
                               <span className="text-xs text-muted-foreground">Default</span>
                             </div>
                           ))}
                           {/* Custom subcategories */}
                           {customSubs.map((cat) => {
                             const isEditing = editingId === cat.id;
                             return (
                               <div
                                 key={cat.id}
                                 className="flex items-center justify-between p-2 rounded-lg bg-primary/10 group"
                               >
                                 {isEditing ? (
                                   <div className="flex-1 flex items-center gap-2">
                                     <Input
                                       value={editSubcategory}
                                       onChange={(e) => setEditSubcategory(e.target.value)}
                                       className="h-8"
                                     />
                                     <Button size="sm" variant="ghost" onClick={handleUpdate} disabled={isSubmitting}>
                                       {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                     </Button>
                                     <Button size="sm" variant="ghost" onClick={resetForm}>
                                       <X className="h-4 w-4" />
                                     </Button>
                                   </div>
                                 ) : (
                                   <>
                                     <span className="text-sm font-medium">{cat.subcategory}</span>
                                     <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                       <span className="text-xs text-primary mr-2">Kustom</span>
                                       <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(cat)}>
                                         <Edit2 className="h-3 w-3" />
                                       </Button>
                                       <AlertDialog>
                                         <AlertDialogTrigger asChild>
                                           <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive">
                                             <Trash2 className="h-3 w-3" />
                                           </Button>
                                         </AlertDialogTrigger>
                                         <AlertDialogContent>
                                           <AlertDialogHeader>
                                             <AlertDialogTitle>Hapus Subkategori?</AlertDialogTitle>
                                             <AlertDialogDescription>
                                               Subkategori "{cat.subcategory}" akan dihapus permanen.
                                             </AlertDialogDescription>
                                           </AlertDialogHeader>
                                           <AlertDialogFooter>
                                             <AlertDialogCancel>Batal</AlertDialogCancel>
                                             <AlertDialogAction
                                               onClick={() => handleDelete(cat.id)}
                                               className="bg-destructive text-destructive-foreground"
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
                       </AccordionContent>
                     </AccordionItem>
                   );
                 })}
               </Accordion>
             </TabsContent>
 
             <TabsContent value="income">
               <div className="space-y-4">
                 <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                   <h4 className="font-medium flex items-center gap-2 mb-3">
                     <TrendingUp className="h-4 w-4 text-success" />
                     Subkategori Pemasukan
                   </h4>
                   <div className="space-y-2">
                     {/* Default income subcategories */}
                     {INCOME_SUBCATEGORIES.map((sub) => (
                       <div key={sub} className="flex items-center justify-between p-2 rounded-lg bg-secondary/20">
                         <span className="text-sm">{sub}</span>
                         <span className="text-xs text-muted-foreground">Default</span>
                       </div>
                     ))}
                     {/* Custom income subcategories */}
                     {incomeCustomCategories.map((cat) => {
                       const isEditing = editingId === cat.id;
                       return (
                         <div
                           key={cat.id}
                           className="flex items-center justify-between p-2 rounded-lg bg-success/20 group"
                         >
                           {isEditing ? (
                             <div className="flex-1 flex items-center gap-2">
                               <Input
                                 value={editSubcategory}
                                 onChange={(e) => setEditSubcategory(e.target.value)}
                                 className="h-8"
                               />
                               <Button size="sm" variant="ghost" onClick={handleUpdate} disabled={isSubmitting}>
                                 {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                               </Button>
                               <Button size="sm" variant="ghost" onClick={resetForm}>
                                 <X className="h-4 w-4" />
                               </Button>
                             </div>
                           ) : (
                             <>
                               <span className="text-sm font-medium">{cat.subcategory}</span>
                               <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <span className="text-xs text-success mr-2">Kustom</span>
                                 <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(cat)}>
                                   <Edit2 className="h-3 w-3" />
                                 </Button>
                                 <AlertDialog>
                                   <AlertDialogTrigger asChild>
                                     <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive">
                                       <Trash2 className="h-3 w-3" />
                                     </Button>
                                   </AlertDialogTrigger>
                                   <AlertDialogContent>
                                     <AlertDialogHeader>
                                       <AlertDialogTitle>Hapus Subkategori?</AlertDialogTitle>
                                       <AlertDialogDescription>
                                         Subkategori "{cat.subcategory}" akan dihapus permanen.
                                       </AlertDialogDescription>
                                     </AlertDialogHeader>
                                     <AlertDialogFooter>
                                       <AlertDialogCancel>Batal</AlertDialogCancel>
                                       <AlertDialogAction
                                         onClick={() => handleDelete(cat.id)}
                                         className="bg-destructive text-destructive-foreground"
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
                 </div>
               </div>
             </TabsContent>
           </Tabs>
         </CardContent>
       </Card>
     </div>
   );
 }