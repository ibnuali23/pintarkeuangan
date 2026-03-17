
CREATE TABLE public.expense_category_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category_name text NOT NULL,
  percentage numeric NOT NULL DEFAULT 0,
  icon text DEFAULT '📦',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, category_name)
);

ALTER TABLE public.expense_category_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own expense categories"
ON public.expense_category_settings
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
