 import { useState, useEffect, useCallback } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuthContext } from '@/contexts/AuthContext';
 import { triggerSyncStart, triggerSyncComplete, triggerSyncError } from '@/components/layout/SyncStatus';
 
 export interface BudgetSetting {
   id: string;
   user_id: string;
   category: string;
   subcategory: string;
   monthly_budget: number;
   created_at: string;
   updated_at: string;
 }
 
 export interface PaymentMethod {
   id: string;
   user_id: string;
   name: string;
   balance: number;
   icon: string;
   created_at: string;
   updated_at: string;
 }
 
 export interface CustomCategory {
   id: string;
   user_id: string;
   category: string;
   subcategory: string;
   type: string;
   is_default: boolean;
   created_at: string;
 }
 
 export function useProfileSettings() {
   const { user, isAuthenticated } = useAuthContext();
   const [budgetSettings, setBudgetSettings] = useState<BudgetSetting[]>([]);
   const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
   const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
   const [isLoading, setIsLoading] = useState(true);
 
   // Fetch budget settings
   const fetchBudgetSettings = useCallback(async () => {
     if (!user) return;
     const { data, error } = await supabase
       .from('budget_settings')
       .select('*')
       .eq('user_id', user.id);
     if (error) {
       console.error('Error fetching budget settings:', error);
       return;
     }
     setBudgetSettings(data || []);
   }, [user]);
 
   // Fetch payment methods
   const fetchPaymentMethods = useCallback(async () => {
     if (!user) return;
     const { data, error } = await supabase
       .from('payment_methods')
       .select('*')
       .eq('user_id', user.id)
       .order('created_at', { ascending: true });
     if (error) {
       console.error('Error fetching payment methods:', error);
       return;
     }
     setPaymentMethods(data || []);
   }, [user]);
 
   // Fetch custom categories
   const fetchCustomCategories = useCallback(async () => {
     if (!user) return;
     const { data, error } = await supabase
       .from('custom_categories')
       .select('*')
       .eq('user_id', user.id)
       .order('category', { ascending: true });
     if (error) {
       console.error('Error fetching custom categories:', error);
       return;
     }
     setCustomCategories(data || []);
   }, [user]);
 
   // Initial data fetch
   useEffect(() => {
     if (isAuthenticated && user) {
       setIsLoading(true);
       Promise.all([fetchBudgetSettings(), fetchPaymentMethods(), fetchCustomCategories()])
         .finally(() => setIsLoading(false));
     } else {
       setBudgetSettings([]);
       setPaymentMethods([]);
       setCustomCategories([]);
       setIsLoading(false);
     }
   }, [isAuthenticated, user, fetchBudgetSettings, fetchPaymentMethods, fetchCustomCategories]);
 
   // BUDGET SETTINGS CRUD
   const upsertBudgetSetting = useCallback(async (category: string, subcategory: string, monthlyBudget: number) => {
     if (!user) return { error: new Error('Not authenticated') };
     triggerSyncStart();
 
     const { data, error } = await supabase
       .from('budget_settings')
       .upsert({
         user_id: user.id,
         category,
         subcategory,
         monthly_budget: monthlyBudget,
       }, { onConflict: 'user_id,category,subcategory' })
       .select()
       .single();
 
     if (error) {
       triggerSyncError();
       return { error };
     }
 
     triggerSyncComplete();
     setBudgetSettings((prev) => {
       const existing = prev.find(b => b.category === category && b.subcategory === subcategory);
       if (existing) {
         return prev.map(b => (b.category === category && b.subcategory === subcategory) ? data : b);
       }
       return [...prev, data];
     });
     return { data };
   }, [user]);
 
   const deleteBudgetSetting = useCallback(async (id: string) => {
     if (!user) return { error: new Error('Not authenticated') };
     triggerSyncStart();
 
     const { error } = await supabase
       .from('budget_settings')
       .delete()
       .eq('id', id)
       .eq('user_id', user.id);
 
     if (error) {
       triggerSyncError();
       return { error };
     }
 
     triggerSyncComplete();
     setBudgetSettings((prev) => prev.filter(b => b.id !== id));
     return { success: true };
   }, [user]);
 
   // PAYMENT METHODS CRUD
   const addPaymentMethod = useCallback(async (name: string, balance: number, icon: string = 'wallet') => {
     if (!user) return { error: new Error('Not authenticated') };
     triggerSyncStart();
 
     const { data, error } = await supabase
       .from('payment_methods')
       .insert({ user_id: user.id, name, balance, icon })
       .select()
       .single();
 
     if (error) {
       triggerSyncError();
       return { error };
     }
 
     triggerSyncComplete();
     setPaymentMethods((prev) => [...prev, data]);
     return { data };
   }, [user]);
 
   const updatePaymentMethod = useCallback(async (id: string, updates: Partial<Pick<PaymentMethod, 'name' | 'balance' | 'icon'>>) => {
     if (!user) return { error: new Error('Not authenticated') };
     triggerSyncStart();
 
     const { data, error } = await supabase
       .from('payment_methods')
       .update(updates)
       .eq('id', id)
       .eq('user_id', user.id)
       .select()
       .single();
 
     if (error) {
       triggerSyncError();
       return { error };
     }
 
     triggerSyncComplete();
     setPaymentMethods((prev) => prev.map(p => p.id === id ? data : p));
     return { data };
   }, [user]);
 
   const deletePaymentMethod = useCallback(async (id: string) => {
     if (!user) return { error: new Error('Not authenticated') };
     triggerSyncStart();
 
     const { error } = await supabase
       .from('payment_methods')
       .delete()
       .eq('id', id)
       .eq('user_id', user.id);
 
     if (error) {
       triggerSyncError();
       return { error };
     }
 
     triggerSyncComplete();
     setPaymentMethods((prev) => prev.filter(p => p.id !== id));
     return { success: true };
   }, [user]);
 
   const adjustPaymentMethodBalance = useCallback(async (id: string, amount: number, isIncome: boolean) => {
     const method = paymentMethods.find(p => p.id === id);
     if (!method) return { error: new Error('Payment method not found') };
 
     const newBalance = isIncome ? method.balance + amount : method.balance - amount;
     return updatePaymentMethod(id, { balance: newBalance });
   }, [paymentMethods, updatePaymentMethod]);
 
   // CUSTOM CATEGORIES CRUD
   const addCustomCategory = useCallback(async (category: string, subcategory: string, type: string) => {
     if (!user) return { error: new Error('Not authenticated') };
     triggerSyncStart();
 
     const { data, error } = await supabase
       .from('custom_categories')
       .insert({ user_id: user.id, category, subcategory, type, is_default: false })
       .select()
       .single();
 
     if (error) {
       triggerSyncError();
       return { error };
     }
 
     triggerSyncComplete();
     setCustomCategories((prev) => [...prev, data]);
     return { data };
   }, [user]);
 
   const updateCustomCategory = useCallback(async (id: string, updates: Partial<Pick<CustomCategory, 'category' | 'subcategory'>>) => {
     if (!user) return { error: new Error('Not authenticated') };
     triggerSyncStart();
 
     const { data, error } = await supabase
       .from('custom_categories')
       .update(updates)
       .eq('id', id)
       .eq('user_id', user.id)
       .select()
       .single();
 
     if (error) {
       triggerSyncError();
       return { error };
     }
 
     triggerSyncComplete();
     setCustomCategories((prev) => prev.map(c => c.id === id ? data : c));
     return { data };
   }, [user]);
 
   const deleteCustomCategory = useCallback(async (id: string) => {
     if (!user) return { error: new Error('Not authenticated') };
     triggerSyncStart();
 
     const { error } = await supabase
       .from('custom_categories')
       .delete()
       .eq('id', id)
       .eq('user_id', user.id);
 
     if (error) {
       triggerSyncError();
       return { error };
     }
 
     triggerSyncComplete();
     setCustomCategories((prev) => prev.filter(c => c.id !== id));
     return { success: true };
   }, [user]);
 
   // Get budget for specific subcategory
   const getBudgetForSubcategory = useCallback((category: string, subcategory: string) => {
     return budgetSettings.find(b => b.category === category && b.subcategory === subcategory);
   }, [budgetSettings]);
 
   // Get all subcategories for a category (default + custom)
   const getSubcategoriesForCategory = useCallback((category: string, type: 'income' | 'expense') => {
     const customSubs = customCategories
       .filter(c => c.category === category && c.type === type)
       .map(c => c.subcategory);
     return customSubs;
   }, [customCategories]);
 
   return {
     budgetSettings,
     paymentMethods,
     customCategories,
     isLoading,
     // Budget
     upsertBudgetSetting,
     deleteBudgetSetting,
     getBudgetForSubcategory,
     // Payment Methods
     addPaymentMethod,
     updatePaymentMethod,
     deletePaymentMethod,
     adjustPaymentMethodBalance,
     // Custom Categories
     addCustomCategory,
     updateCustomCategory,
     deleteCustomCategory,
     getSubcategoriesForCategory,
     // Refetch
     refetch: () => Promise.all([fetchBudgetSettings(), fetchPaymentMethods(), fetchCustomCategories()]),
   };
 }