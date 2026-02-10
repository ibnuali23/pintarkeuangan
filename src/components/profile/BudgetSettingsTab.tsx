 import { useState } from 'react';
 import { useProfileSettings } from '@/hooks/useProfileSettings';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Input } from '@/components/ui/input';
 import { Button } from '@/components/ui/button';
 import { useToast } from '@/hooks/use-toast';
 import { EXPENSE_CATEGORIES, EXPENSE_SUBCATEGORIES, ExpenseCategory } from '@/types/finance';
 import { Wallet, Save, Loader2 } from 'lucide-react';
 import {
   Accordion,
   AccordionContent,
   AccordionItem,
   AccordionTrigger,
 } from '@/components/ui/accordion';
 
 const categoryIcons: Record<ExpenseCategory, string> = {
   Kebutuhan: '🏠',
   Investasi: '📈',
   Keinginan: '🎁',
   'Dana Darurat': '🛡️',
 };
 
 export function BudgetSettingsTab() {
   const { budgetSettings, upsertBudgetSetting, customCategories, isLoading } = useProfileSettings();
   const { toast } = useToast();
   const [savingItems, setSavingItems] = useState<Set<string>>(new Set());
   const [localBudgets, setLocalBudgets] = useState<Record<string, string>>({});
 
   const formatCurrency = (value: number) => {
     return new Intl.NumberFormat('id-ID').format(value);
   };
 
   const getKey = (category: string, subcategory: string) => `${category}|${subcategory}`;
 
   const getCurrentBudget = (category: string, subcategory: string) => {
     const key = getKey(category, subcategory);
     if (localBudgets[key] !== undefined) {
       return localBudgets[key];
     }
     const setting = budgetSettings.find(b => b.category === category && b.subcategory === subcategory);
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
 
     setSavingItems(prev => new Set(prev).add(key));
 
     const { error } = await upsertBudgetSetting(category, subcategory, numericValue);
 
     setSavingItems(prev => {
       const next = new Set(prev);
       next.delete(key);
       return next;
     });
 
     if (error) {
       toast({ variant: 'destructive', title: 'Gagal menyimpan budget' });
     } else {
       toast({ title: 'Budget berhasil disimpan' });
       setLocalBudgets(prev => {
         const next = { ...prev };
         delete next[key];
         return next;
       });
     }
   };
 
   const getAllSubcategoriesForCategory = (category: ExpenseCategory) => {
     const defaults = EXPENSE_SUBCATEGORIES[category] || [];
     const custom = customCategories
       .filter(c => c.category === category && c.type === 'expense')
       .map(c => c.subcategory);
     return [...new Set([...defaults, ...custom])];
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
             Pengaturan Budget per Subkategori
           </CardTitle>
           <CardDescription>
             Atur batas pengeluaran bulanan untuk setiap subkategori
           </CardDescription>
         </CardHeader>
         <CardContent>
           <Accordion type="multiple" className="w-full">
             {EXPENSE_CATEGORIES.map((category) => (
               <AccordionItem key={category} value={category}>
                 <AccordionTrigger className="hover:no-underline">
                   <div className="flex items-center gap-2">
                     <span className="text-xl">{categoryIcons[category]}</span>
                     <span className="font-medium">{category}</span>
                   </div>
                 </AccordionTrigger>
                 <AccordionContent>
                   <div className="space-y-3 pt-2">
                     {getAllSubcategoriesForCategory(category).map((subcategory) => {
                       const key = getKey(category, subcategory);
                       const isSaving = savingItems.has(key);
                       const hasLocalChange = localBudgets[key] !== undefined;
 
                       return (
                         <div
                           key={subcategory}
                           className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                         >
                           <span className="flex-1 text-sm font-medium">{subcategory}</span>
                           <div className="flex items-center gap-2">
                             <div className="relative w-36">
                               <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                                 Rp
                               </span>
                               <Input
                                 type="text"
                                 inputMode="numeric"
                                 value={getCurrentBudget(category, subcategory)}
                                 onChange={(e) => handleBudgetChange(category, subcategory, e.target.value)}
                                 placeholder="0"
                                 className="pl-10 h-9 text-sm"
                               />
                             </div>
                             <Button
                               size="sm"
                               variant={hasLocalChange ? "default" : "ghost"}
                               onClick={() => handleSaveBudget(category, subcategory)}
                               disabled={isSaving}
                               className="h-9"
                             >
                               {isSaving ? (
                                 <Loader2 className="h-4 w-4 animate-spin" />
                               ) : (
                                 <Save className="h-4 w-4" />
                               )}
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
         </CardContent>
       </Card>
     </div>
   );
 }