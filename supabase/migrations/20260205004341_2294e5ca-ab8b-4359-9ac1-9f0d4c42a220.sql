
-- Create budget_settings table for per-subcategory budgets
CREATE TABLE public.budget_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT NOT NULL,
  monthly_budget NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, category, subcategory)
);

-- Create payment_methods table
CREATE TABLE public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  balance NUMERIC NOT NULL DEFAULT 0,
  icon TEXT DEFAULT 'wallet',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Create custom_categories table for user-defined categories
CREATE TABLE public.custom_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, category, subcategory, type)
);

-- Add payment_method_id to transactions table
ALTER TABLE public.transactions 
ADD COLUMN payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL;

-- Enable RLS on all new tables
ALTER TABLE public.budget_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies for budget_settings
CREATE POLICY "Users can view own budget settings" ON public.budget_settings
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budget settings" ON public.budget_settings
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budget settings" ON public.budget_settings
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budget settings" ON public.budget_settings
FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for payment_methods
CREATE POLICY "Users can view own payment methods" ON public.payment_methods
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment methods" ON public.payment_methods
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment methods" ON public.payment_methods
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own payment methods" ON public.payment_methods
FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for custom_categories
CREATE POLICY "Users can view own custom categories" ON public.custom_categories
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own custom categories" ON public.custom_categories
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custom categories" ON public.custom_categories
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own custom categories" ON public.custom_categories
FOR DELETE USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_budget_settings_updated_at
BEFORE UPDATE ON public.budget_settings
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_payment_methods_updated_at
BEFORE UPDATE ON public.payment_methods
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
