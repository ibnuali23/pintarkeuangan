import { useState } from 'react';
import { useProfileSettings, CustomCategory } from '@/hooks/useProfileSettings';
import { useExpenseCategories } from '@/hooks/useExpenseCategories';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { EXPENSE_SUBCATEGORIES, INCOME_SUBCATEGORIES } from '@/types/finance';
import { FolderOpen, Plus, Trash2, Edit2, Save, X, Loader2, TrendingUp, TrendingDown, Percent } from 'lucide-react';
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

export function CategoriesTab() {
  const { customCategories, addCustomCategory, updateCustomCategory, deleteCustomCategory, isLoading: isProfileLoading } = useProfileSettings();
  const { categories: expenseCategorySettings, categoryNames, categoryIcons, budgetPercentages, addCategory: addExpenseCategory, updateCategory: updateExpenseCategory, deleteCategory: deleteExpenseCategory, isLoading: isCatLoading } = useExpenseCategories();
  const { toast } = useToast();

  const isLoading = isProfileLoading || isCatLoading;

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');

  // Sub-category form state
  const [formCategory, setFormCategory] = useState('');
  const [formSubcategory, setFormSubcategory] = useState('');
  const [formType, setFormType] = useState<'income' | 'expense'>('expense');
  const [editSubcategory, setEditSubcategory] = useState('');

  // Category form state
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryPercentage, setNewCategoryPercentage] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('📦');
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryPercentage, setEditCategoryPercentage] = useState('');
  const [editCategoryIcon, setEditCategoryIcon] = useState('');

  const resetForm = () => {
    setFormCategory('');
    setFormSubcategory('');
    setFormType('expense');
    setEditingId(null);
    setEditSubcategory('');
  };

  const handleAddSubcategory = async () => {
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

  const startEditSub = (cat: CustomCategory) => {
    setEditingId(cat.id);
    setEditSubcategory(cat.subcategory);
  };

  const handleUpdateSubcategory = async () => {
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

  const handleDeleteSubcategory = async (id: string) => {
    const { error } = await deleteCustomCategory(id);
    if (error) {
      toast({ variant: 'destructive', title: 'Gagal menghapus', description: error.message });
    } else {
      toast({ title: 'Subkategori berhasil dihapus' });
    }
  };

  // Category CRUD
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({ variant: 'destructive', title: 'Nama kategori wajib diisi' });
      return;
    }
    const pct = parseFloat(newCategoryPercentage) || 0;
    setIsSubmitting(true);
    const { error } = await addExpenseCategory(newCategoryName.trim(), pct, newCategoryIcon || '📦');
    setIsSubmitting(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Gagal menambahkan kategori', description: error.message });
    } else {
      toast({ title: 'Kategori berhasil ditambahkan' });
      setNewCategoryName('');
      setNewCategoryPercentage('');
      setNewCategoryIcon('📦');
      setIsAddCategoryDialogOpen(false);
    }
  };

  const startEditCategory = (cat: typeof expenseCategorySettings[0]) => {
    setEditingCategoryId(cat.id);
    setEditCategoryName(cat.category_name);
    setEditCategoryPercentage(String(cat.percentage));
    setEditCategoryIcon(cat.icon);
  };

  const handleUpdateCategory = async () => {
    if (!editingCategoryId || !editCategoryName.trim()) return;
    setIsSubmitting(true);
    const { error } = await updateExpenseCategory(editingCategoryId, {
      category_name: editCategoryName.trim(),
      percentage: parseFloat(editCategoryPercentage) || 0,
      icon: editCategoryIcon || '📦',
    });
    setIsSubmitting(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Gagal mengupdate kategori', description: error.message });
    } else {
      toast({ title: 'Kategori berhasil diupdate' });
      setEditingCategoryId(null);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const { error } = await deleteExpenseCategory(id);
    if (error) {
      toast({ variant: 'destructive', title: 'Gagal menghapus kategori', description: error.message });
    } else {
      toast({ title: 'Kategori berhasil dihapus' });
    }
  };

  const expenseCustomCategories = customCategories.filter(c => c.type === 'expense');
  const incomeCustomCategories = customCategories.filter(c => c.type === 'income');

  const totalPercentage = expenseCategorySettings.reduce((sum, c) => sum + c.percentage, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Expense Category Management */}
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-serif flex items-center gap-2">
              <Percent className="h-5 w-5 text-primary" />
              Kategori Pengeluaran & Alokasi Budget
            </CardTitle>
            <CardDescription>
              Kelola kategori pengeluaran dan atur persentase alokasi budget
            </CardDescription>
          </div>
          <Dialog open={isAddCategoryDialogOpen} onOpenChange={setIsAddCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" />
                Tambah Kategori
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Kategori Pengeluaran Baru</DialogTitle>
                <DialogDescription>Buat kategori baru dengan persentase alokasi budget</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nama Kategori</Label>
                  <Input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Contoh: Pendidikan"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Persentase Budget (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={newCategoryPercentage}
                    onChange={(e) => setNewCategoryPercentage(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ikon (emoji)</Label>
                  <Input
                    value={newCategoryIcon}
                    onChange={(e) => setNewCategoryIcon(e.target.value)}
                    placeholder="📦"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddCategoryDialogOpen(false)}>Batal</Button>
                <Button onClick={handleAddCategory} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Tambah'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {/* Total percentage indicator */}
          <div className={`mb-4 p-3 rounded-lg border ${totalPercentage === 100 ? 'bg-success/10 border-success/30' : 'bg-warning/10 border-warning/30'}`}>
            <p className="text-sm font-medium">
              Total Alokasi: <span className={totalPercentage === 100 ? 'text-success' : 'text-warning'}>{totalPercentage}%</span>
              {totalPercentage !== 100 && <span className="text-muted-foreground"> (idealnya 100%)</span>}
            </p>
          </div>

          <div className="space-y-3">
            {expenseCategorySettings.map((cat) => {
              const isEditing = editingCategoryId === cat.id;
              return (
                <div key={cat.id} className="p-4 rounded-xl border bg-card/50 space-y-2">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          value={editCategoryIcon}
                          onChange={(e) => setEditCategoryIcon(e.target.value)}
                          className="w-16 text-center"
                          placeholder="📦"
                        />
                        <Input
                          value={editCategoryName}
                          onChange={(e) => setEditCategoryName(e.target.value)}
                          className="flex-1"
                          placeholder="Nama kategori"
                        />
                        <div className="relative w-24">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={editCategoryPercentage}
                            onChange={(e) => setEditCategoryPercentage(e.target.value)}
                            className="pr-6"
                            placeholder="0"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => setEditingCategoryId(null)}>
                          <X className="h-4 w-4 mr-1" /> Batal
                        </Button>
                        <Button size="sm" onClick={handleUpdateCategory} disabled={isSubmitting}>
                          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-1" /> Simpan</>}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{cat.icon}</span>
                        <div>
                          <p className="font-medium">{cat.category_name}</p>
                          <p className="text-sm text-muted-foreground">Alokasi: {cat.percentage}%</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEditCategory(cat)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Kategori "{cat.category_name}"?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Kategori ini beserta semua subkategori kustom dan pengaturan budget terkait akan dihapus permanen. Transaksi yang sudah tercatat tidak akan terpengaruh.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Hapus
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Subcategory Management */}
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-serif flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-primary" />
              Subkategori
            </CardTitle>
            <CardDescription>Kelola subkategori transaksi Anda</CardDescription>
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
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">
                        <span className="flex items-center gap-2"><TrendingDown className="h-4 w-4 text-destructive" /> Pengeluaran</span>
                      </SelectItem>
                      <SelectItem value="income">
                        <span className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-success" /> Pemasukan</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Kategori Utama</Label>
                  {formType === 'expense' ? (
                    <Select value={formCategory} onValueChange={setFormCategory}>
                      <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                      <SelectContent>
                        {categoryNames.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            <span className="flex items-center gap-2">
                              <span>{categoryIcons[cat] || '📦'}</span>
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
                <Button variant="outline" onClick={() => { resetForm(); setIsAddDialogOpen(false); }}>Batal</Button>
                <Button onClick={handleAddSubcategory} disabled={isSubmitting} className="gradient-primary text-primary-foreground">
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
                <TrendingDown className="h-4 w-4" /> Pengeluaran
              </TabsTrigger>
              <TabsTrigger value="income" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Pemasukan
              </TabsTrigger>
            </TabsList>

            <TabsContent value="expense">
              <Accordion type="multiple" className="w-full">
                {categoryNames.map((category) => {
                  const defaultSubs = EXPENSE_SUBCATEGORIES[category as keyof typeof EXPENSE_SUBCATEGORIES] || [];
                  const customSubs = expenseCustomCategories.filter(c => c.category === category);
                  const icon = categoryIcons[category] || '📦';

                  return (
                    <AccordionItem key={category} value={category}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{icon}</span>
                          <span className="font-medium">{category}</span>
                          <span className="text-xs text-muted-foreground">
                            ({defaultSubs.length + customSubs.length} subkategori)
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 pt-2">
                          {defaultSubs.map((sub) => (
                            <div key={sub} className="flex items-center justify-between p-2 rounded-lg bg-secondary/20">
                              <span className="text-sm">{sub}</span>
                              <span className="text-xs text-muted-foreground">Default</span>
                            </div>
                          ))}
                          {customSubs.map((cat) => {
                            const isEditing = editingId === cat.id;
                            return (
                              <div key={cat.id} className="flex items-center justify-between p-2 rounded-lg bg-primary/10 group">
                                {isEditing ? (
                                  <div className="flex-1 flex items-center gap-2">
                                    <Input value={editSubcategory} onChange={(e) => setEditSubcategory(e.target.value)} className="h-8" />
                                    <Button size="sm" variant="ghost" onClick={handleUpdateSubcategory} disabled={isSubmitting}>
                                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={resetForm}><X className="h-4 w-4" /></Button>
                                  </div>
                                ) : (
                                  <>
                                    <span className="text-sm font-medium">{cat.subcategory}</span>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <span className="text-xs text-primary mr-2">Kustom</span>
                                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEditSub(cat)}>
                                        <Edit2 className="h-3 w-3" />
                                      </Button>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"><Trash2 className="h-3 w-3" /></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Hapus Subkategori?</AlertDialogTitle>
                                            <AlertDialogDescription>Subkategori "{cat.subcategory}" akan dihapus permanen.</AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Batal</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteSubcategory(cat.id)} className="bg-destructive text-destructive-foreground">Hapus</AlertDialogAction>
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
                    {INCOME_SUBCATEGORIES.map((sub) => (
                      <div key={sub} className="flex items-center justify-between p-2 rounded-lg bg-secondary/20">
                        <span className="text-sm">{sub}</span>
                        <span className="text-xs text-muted-foreground">Default</span>
                      </div>
                    ))}
                    {incomeCustomCategories.map((cat) => {
                      const isEditing = editingId === cat.id;
                      return (
                        <div key={cat.id} className="flex items-center justify-between p-2 rounded-lg bg-success/20 group">
                          {isEditing ? (
                            <div className="flex-1 flex items-center gap-2">
                              <Input value={editSubcategory} onChange={(e) => setEditSubcategory(e.target.value)} className="h-8" />
                              <Button size="sm" variant="ghost" onClick={handleUpdateSubcategory} disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                              </Button>
                              <Button size="sm" variant="ghost" onClick={resetForm}><X className="h-4 w-4" /></Button>
                            </div>
                          ) : (
                            <>
                              <span className="text-sm font-medium">{cat.subcategory}</span>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-xs text-success mr-2">Kustom</span>
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEditSub(cat)}>
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"><Trash2 className="h-3 w-3" /></Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Hapus Subkategori?</AlertDialogTitle>
                                      <AlertDialogDescription>Subkategori "{cat.subcategory}" akan dihapus permanen.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Batal</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteSubcategory(cat.id)} className="bg-destructive text-destructive-foreground">Hapus</AlertDialogAction>
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
