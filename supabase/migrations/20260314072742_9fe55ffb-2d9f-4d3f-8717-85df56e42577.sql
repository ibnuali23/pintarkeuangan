
CREATE TABLE public.debt_payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    debt_id uuid NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
    user_id uuid NOT NULL,
    amount numeric NOT NULL,
    note text,
    paid_at timestamp with time zone NOT NULL DEFAULT now(),
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own debt payments"
ON public.debt_payments
FOR ALL
TO public
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.debts ADD COLUMN remaining_amount numeric;

UPDATE public.debts SET remaining_amount = amount WHERE remaining_amount IS NULL;
