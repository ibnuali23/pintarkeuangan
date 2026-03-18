import { useMemo, useCallback } from 'react';
import { useProfileSettings, CustomCategory } from './useProfileSettings';
import { useExpenseCategories } from './useExpenseCategories';
import { 
  EXPENSE_SUBCATEGORIES, 
  INCOME_SUBCATEGORIES,
} from '@/types/finance';

export interface DynamicCategory {
  category: string;
  subcategories: string[];
}

export function useDynamicCategories() {
  const { customCategories, isLoading: isProfileLoading, refetch: refetchProfile } = useProfileSettings();
  const { categoryNames, budgetPercentages, categoryIcons, isLoading: isCategoriesLoading } = useExpenseCategories();

  const isLoading = isProfileLoading || isCategoriesLoading;

  // Get all expense subcategories (default + custom) grouped by category
  const expenseCategories = useMemo((): DynamicCategory[] => {
    return categoryNames.map(category => {
      const defaultSubs = EXPENSE_SUBCATEGORIES[category as keyof typeof EXPENSE_SUBCATEGORIES] || [];
      const customSubs = customCategories
        .filter(c => c.type === 'expense' && c.category === category)
        .map(c => c.subcategory);
      
      // Merge default and custom, removing duplicates
      const allSubs = [...new Set([...defaultSubs, ...customSubs])];
      
      return {
        category,
        subcategories: allSubs,
      };
    });
  }, [customCategories, categoryNames]);

  // Get all income subcategories (default + custom)
  const incomeSubcategories = useMemo((): string[] => {
    const customIncomeSubs = customCategories
      .filter(c => c.type === 'income')
      .map(c => c.subcategory);
    
    // Merge default and custom, removing duplicates
    return [...new Set([...INCOME_SUBCATEGORIES, ...customIncomeSubs])];
  }, [customCategories]);

  // Get subcategories for a specific expense category
  const getExpenseSubcategories = useCallback((category: string): string[] => {
    const categoryData = expenseCategories.find(c => c.category === category);
    return categoryData?.subcategories || [];
  }, [expenseCategories]);

  // Get all custom categories (for display in settings)
  const getCustomCategoriesByType = (type: 'income' | 'expense'): CustomCategory[] => {
    return customCategories.filter(c => c.type === type);
  };

  // Get custom subcategories for a specific expense category
  const getCustomSubcategoriesForCategory = (category: string, type: 'income' | 'expense'): CustomCategory[] => {
    return customCategories.filter(c => c.category === category && c.type === type);
  };

  return {
    expenseCategories,
    incomeSubcategories,
    getExpenseSubcategories,
    getCustomCategoriesByType,
    getCustomSubcategoriesForCategory,
    customCategories,
    categoryNames,
    budgetPercentages,
    categoryIcons,
    isLoading,
    refetch: refetchProfile,
  };
}
