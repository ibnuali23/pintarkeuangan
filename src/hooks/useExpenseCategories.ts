import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export interface ExpenseCategorySetting {
  id: string;
  user_id: string;
  category_name: string;
  percentage: number;
  icon: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const DEFAULT_CATEGORIES: Omit<ExpenseCategorySetting, 'id' | 'user_id' | 'created_at' | 'updated_at'>[] = [
  { category_name: 'Kebutuhan', percentage: 50, icon: '🏠', sort_order: 0 },
  { category_name: 'Investasi', percentage: 30, icon: '📈', sort_order: 1 },
  { category_name: 'Keinginan', percentage: 15, icon: '🎁', sort_order: 2 },
  { category_name: 'Dana Darurat', percentage: 5, icon: '🛡️', sort_order: 3 },
];

export function useExpenseCategories() {
  const { user } = useAuthContext();
  const [categories, setCategories] = useState<ExpenseCategorySetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const fetchCategories = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('expense_category_settings')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching expense categories:', error);
      return;
    }

    if (data && data.length > 0) {
      setCategories(data);
      setIsInitialized(true);
    } else {
      // Initialize with defaults
      const inserts = DEFAULT_CATEGORIES.map(c => ({
        ...c,
        user_id: user.id,
      }));

      const { data: inserted, error: insertError } = await supabase
        .from('expense_category_settings')
        .insert(inserts)
        .select();

      if (insertError) {
        console.error('Error initializing expense categories:', insertError);
      } else if (inserted) {
        setCategories(inserted);
        setIsInitialized(true);
      }
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      fetchCategories().finally(() => setIsLoading(false));
    }
  }, [user, fetchCategories]);

  const categoryNames = useMemo(() => 
    categories.map(c => c.category_name), 
    [categories]
  );

  const budgetPercentages = useMemo(() => {
    const result: Record<string, number> = {};
    categories.forEach(c => {
      result[c.category_name] = c.percentage;
    });
    return result;
  }, [categories]);

  const categoryIcons = useMemo(() => {
    const result: Record<string, string> = {};
    categories.forEach(c => {
      result[c.category_name] = c.icon;
    });
    return result;
  }, [categories]);

  const addCategory = useCallback(async (name: string, percentage: number, icon: string = '📦') => {
    if (!user) return { error: new Error('Not authenticated') };

    const maxOrder = categories.reduce((max, c) => Math.max(max, c.sort_order), -1);

    const { data, error } = await supabase
      .from('expense_category_settings')
      .insert({
        user_id: user.id,
        category_name: name,
        percentage,
        icon,
        sort_order: maxOrder + 1,
      })
      .select()
      .single();

    if (error) return { error };
    if (data) setCategories(prev => [...prev, data]);
    return { data };
  }, [user, categories]);

  const updateCategory = useCallback(async (id: string, updates: Partial<Pick<ExpenseCategorySetting, 'category_name' | 'percentage' | 'icon' | 'sort_order'>>) => {
    if (!user) return { error: new Error('Not authenticated') };

    const oldCategory = categories.find(c => c.id === id);

    const { data, error } = await supabase
      .from('expense_category_settings')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) return { error };

    // If category name changed, update related custom_categories and transactions
    if (data && oldCategory && updates.category_name && updates.category_name !== oldCategory.category_name) {
      // Update custom_categories
      await supabase
        .from('custom_categories')
        .update({ category: updates.category_name })
        .eq('user_id', user.id)
        .eq('category', oldCategory.category_name)
        .eq('type', 'expense');

      // Update transactions
      await supabase
        .from('transactions')
        .update({ category: updates.category_name })
        .eq('user_id', user.id)
        .eq('category', oldCategory.category_name)
        .eq('type', 'expense');

      // Update budget_settings
      await supabase
        .from('budget_settings')
        .update({ category: updates.category_name })
        .eq('user_id', user.id)
        .eq('category', oldCategory.category_name);
    }

    if (data) setCategories(prev => prev.map(c => c.id === id ? data : c));
    return { data };
  }, [user, categories]);

  const deleteCategory = useCallback(async (id: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const cat = categories.find(c => c.id === id);
    if (!cat) return { error: new Error('Category not found') };

    // Delete related custom_categories
    await supabase
      .from('custom_categories')
      .delete()
      .eq('user_id', user.id)
      .eq('category', cat.category_name)
      .eq('type', 'expense');

    // Delete related budget_settings
    await supabase
      .from('budget_settings')
      .delete()
      .eq('user_id', user.id)
      .eq('category', cat.category_name);

    const { error } = await supabase
      .from('expense_category_settings')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) return { error };
    setCategories(prev => prev.filter(c => c.id !== id));
    return { success: true };
  }, [user, categories]);

  return {
    categories,
    categoryNames,
    budgetPercentages,
    categoryIcons,
    isLoading,
    isInitialized,
    addCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories,
  };
}
