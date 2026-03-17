import { useState } from 'react';
import { useProfileSettings } from '@/hooks/useProfileSettings';
import { useExpenseCategories } from '@/hooks/useExpenseCategories';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { EXPENSE_SUBCATEGORIES } from '@/types/finance';
import { Wallet, Save, Loader2, ChevronLeft, ChevronRight, Plus, Trash2, Copy } from 'lucide-react';
import { IncomeTargetSettings } from './IncomeTargetSettings';
import { format, subMonths } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export function BudgetSettingsTab() {
  const {
    budgetSettings,
    upsertBudgetSetting,
    deleteBudgetSettingByMonth,
    copyBudgetsFromMonth,
    customCategories,
    addCustomCategory,
    deleteCustomCategory,
    isLoading: isProfileLoading,
  } = useProfileSettings();
  const { categoryNames, categoryIcons, isLoading: isCatLoading } = useExpenseCategories();
  const { toast } = useToast();
  const [savingItems, setSavingItems] = useState<Set<string>>(new Set());
  const [localBudgets, setLocalBudgets] = useState<Record<string, string>>({});
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [activeAddCategory, setActiveAddCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  const isLoading = isProfileLoading || isCatLoading;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID').format(value);
  };

  const getKey = (category: string, subcategory: string) => `${category}|${subcategory}`;

  const getCurrentBudget = (category: string, subcategory: string) => {
    const key = getKey(category, subcategory);
    if (localBudgets[key] !== undefined) return localBudgets[key];
    const monthKey = format(selectedMonth, 'yyyy-MM');
    const setting = budgetSettings.find(b =>
      b.category === category && b.subcategory === subcategory && b.month === monthKey
    );
    return setting ? formatCurrency(setting.monthly_budget) : '';
  };

  const handleBudgetChange = (category: string, subcategory: string, value: string) => {
    const key = getKey(category, subcategory);
    const numbers = value.replace(/\D/g, '');
    const formatted = numbers ? formatCurrency(parseInt(numbers)) : '';
    setLocalBudgets(prev => ({ ...prev, [key]: formatted }));
  };

  const handleSaveBudget = async (category: string, subcategory: string) => {
    const key = getKey(category, subcategory);
    const value = localBudgets[key] || getCurrentBudget(category, subcategory);
    const numericValue = parseInt(value.replace(/\D/g, '')) || 0;
    const monthKey = format(selectedMonth, 'yyyy-MM');
    setSavingItems(prev => new Set(prev).add(key));
    const { error } = await upsertBudgetSetting(category, subcategory, numericValue, monthKey);
    setSavingItems(prev => { const next = new Set(prev); next.delete(key); return next; });
    if (error) {
      toast({ variant: 'destructive', title: 'Gagal menyimpan budget' });
    } else {
      toast({ title: 'Budget berhasil disimpan' });
      setLocalBudgets(prev => { const next = { ...prev }; delete next[key]; return next; });
    }
  };

  const handleDeleteBudget = async (category: string, subcategory: string) => {
    const isCustom = customCategories.some(c => c.category === category && c.subcategory === subcategory && c.type === 'expense');
    const monthKey = format(selectedMonth, 'yyyy-MM');
    if (isCustom) {
      if (!confirm(`Hapus kategori kustom "${subcategory}" dan budgetnya?`)) return;
      const customCat = customCategories.find(c => c.category === category && c.subcategory === subcategory && c.type === 'expense');
      if (customCat) {
        const { error } = await deleteCustomCategory(customCat.id);
        if (error) toast({ variant: 'destructive', title: 'Gagal menghapus kategori' });
        else toast({ title: 'Kategori kustom berhasil dihapus' });
      }
    } else {
      if (!confirm(`Hapus budget "${subcategory}" untuk bulan ini?`)) return;
      const { error } = await deleteBudgetSettingByMonth(category, subcategory, monthKey);
      if (error) toast({ variant: 'destructive', title: 'Gagal menghapus budget' });
      else {
        toast({ title: 'Budget bulan ini berhasil dihapus' });
        const key = getKey(category, subcategory);
        setLocalBudgets(prev => { const next = { ...prev }; delete next[key]; return next; });
      }
    }
  };

  const handleCopyFromPreviousMonth = async () => {
    const fromMonth = format(subMonths(selectedMonth, 1), 'yyyy-MM');
    const toMonth = format(selectedMonth, 'yyyy-MM');
    setIsCopying(true);
    const { success, count, error } = await copyBudgetsFromMonth(fromMonth, toMonth);
    setIsCopying(false);
    if (error) toast({ variant: 'destructive', title: 'Gagal menyalin budget' });
    else if (count === 0) toast({ title: 'Tidak ada data budget di bulan sebelumnya' });
    else { toast({ title: `Berhasil menyalin ${count} budget dari bulan sebelumnya` }); setLocalBudgets({}); }
  };

  const handleAddCustomCategory = async () => {
    if (!newCategoryName.trim() || !activeAddCategory) return;
    setIsAddingCategory(true);
    const { error } = await addCustomCategory(activeAddCategory, newCategoryName, 'expense');
    setIsAddingCategory(false);
    if (error) toast({ variant: 'destructive', title: 'Gagal menambah kategori' });
    else { toast({ title: 'Kategori berhasil ditambahkan' }); setNewCategoryName(''); setIsAddCategoryOpen(false); setActiveAddCategory(null); }
  };

  const getAllSubcategoriesForCategory = (category: string) => {
    const defaults = EXPENSE_SUBCATEGORIES[category as keyof typeof EXPENSE_SUBCATEGORIES] || [];
    const custom = customCategories
      .filter(c => c.category === category && c.type === 'expense')
      .map(c => c.subcategory);
    return [...new Set([...defaults, ...custom])];
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setSelectedMonth((prev) => {
      const newDate = new Date(prev);
      if (direction === 'prev') newDate.setMonth(newDate.getMonth() - 1);
      else newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
    setLocalBudgets({});
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
        <CardHeader>
          <CardTitle className="font-serif flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Pengaturan Budget Bulanan
          </CardTitle>
          <CardDescription>Atur batas pengeluaran dan target pemasukan bulanan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-4 mb-8 bg-primary/5 p-4 rounded-lg">
            <Button variant="outline" size="icon" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center w-48">
              <p className="font-serif text-lg font-bold">{format(selectedMonth, 'MMMM yyyy', { locale: id })}</p>
            </div>
            <Button variant="outline" size="icon" onClick={() => navigateMonth('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="mb-8">
            <IncomeTargetSettings selectedMonth={selectedMonth} />
          </div>

          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-serif font-semibold flex items-center gap-2">Budget Pengeluaran</h3>
            <Button variant="outline" size="sm" className="gap-2" onClick={handleCopyFromPreviousMonth} disabled={isCopying}>
              {isCopying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
              Salin dari Bulan Lalu
            </Button>
          </div>

          <Accordion type="multiple" className="w-full">
            {categoryNames.map((category) => (
              <AccordionItem key={category} value={category}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{categoryIcons[category] || '📦'}</span>
                      <span className="font-medium">{category}</span>
                    </div>
                    <Button
                      size="sm" variant="ghost" className="h-8 gap-1 text-xs"
                      onClick={(e) => { e.stopPropagation(); setActiveAddCategory(category); setIsAddCategoryOpen(true); }}
                    >
                      <Plus className="h-3 w-3" /> Kategori
                    </Button>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-2">
                    {getAllSubcategoriesForCategory(category).map((subcategory) => {
                      const key = getKey(category, subcategory);
                      const isSaving = savingItems.has(key);
                      const hasLocalChange = localBudgets[key] !== undefined;
                      return (
                        <div key={subcategory} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                          <span className="flex-1 text-sm font-medium">{subcategory}</span>
                          <div className="flex items-center gap-2">
                            <div className="relative w-36">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Rp</span>
                              <Input
                                type="text" inputMode="numeric"
                                value={getCurrentBudget(category, subcategory)}
                                onChange={(e) => handleBudgetChange(category, subcategory, e.target.value)}
                                placeholder="0" className="pl-10 h-9 text-sm"
                              />
                            </div>
                            <Button size="icon" variant={hasLocalChange ? "default" : "ghost"} onClick={() => handleSaveBudget(category, subcategory)} disabled={isSaving} className="h-9 w-9">
                              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            </Button>
                            <Button size="icon" variant="ghost" className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteBudget(category, subcategory)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Kategori {activeAddCategory}</DialogTitle>
                <DialogDescription>Buat subkategori pengeluaran baru untuk kelompok {activeAddCategory}.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nama Subkategori</Label>
                  <Input placeholder="Contoh: Netflix, Arisan, Sewa Kantor" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddCategoryOpen(false)}>Batal</Button>
                <Button onClick={handleAddCustomCategory} disabled={isAddingCategory || !newCategoryName.trim()}>
                  {isAddingCategory && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Simpan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
