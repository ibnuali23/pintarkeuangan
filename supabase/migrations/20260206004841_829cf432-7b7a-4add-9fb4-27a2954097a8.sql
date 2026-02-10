-- Create money_transfers table for tracking transfers between payment methods
CREATE TABLE public.money_transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  from_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  to_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.money_transfers ENABLE ROW LEVEL SECURITY;

-- RLS policies for money_transfers
CREATE POLICY "Users can view own transfers"
  ON public.money_transfers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transfers"
  ON public.money_transfers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transfers"
  ON public.money_transfers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transfers"
  ON public.money_transfers FOR DELETE
  USING (auth.uid() = user_id);

-- Admin policies for money_transfers
CREATE POLICY "Admins can view all transfers"
  ON public.money_transfers FOR SELECT
  USING (is_admin());

-- Create trigger for updated_at
CREATE TRIGGER update_money_transfers_updated_at
  BEFORE UPDATE ON public.money_transfers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add unique constraint on budget_settings for upsert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'budget_settings_user_category_subcategory_key'
  ) THEN
    ALTER TABLE public.budget_settings 
    ADD CONSTRAINT budget_settings_user_category_subcategory_key 
    UNIQUE (user_id, category, subcategory);
  END IF;
END $$;