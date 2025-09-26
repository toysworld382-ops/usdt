/*
# [Create Tickets Table]
This operation creates a new table `tickets` for managing user support requests related to transactions.

## Query Description: [This script adds a `tickets` table to enable a customer support system. It includes columns for linking tickets to users and transactions, storing the ticket subject and message, and tracking its status. RLS policies are enabled to ensure users can only manage their own tickets, while admins have full access. This change is non-destructive and adds new functionality.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Table: `public.tickets`
- Columns: `id`, `user_id`, `transaction_id`, `subject`, `message`, `status`, `created_at`, `updated_at`
- Foreign Keys:
  - `tickets.user_id` -> `auth.users.id`
  - `tickets.transaction_id` -> `public.transactions.id`

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [Yes]
- Auth Requirements: [Requires authenticated users to create tickets]

## Performance Impact:
- Indexes: [Primary key on `id`, foreign key indexes on `user_id` and `transaction_id`]
- Triggers: [Adds an `on_ticket_update` trigger to manage the `updated_at` timestamp.]
- Estimated Impact: [Low performance impact, adds a new table for support functionality.]
*/

-- 1. Create tickets table
CREATE TABLE public.tickets (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    transaction_id uuid NULL,
    subject character varying NOT NULL,
    message text NOT NULL,
    status character varying NOT NULL DEFAULT 'open'::character varying,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT tickets_pkey PRIMARY KEY (id),
    CONSTRAINT tickets_status_check CHECK ((status::text = ANY (ARRAY['open'::text, 'in_progress'::text, 'closed'::text]))),
    CONSTRAINT tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT tickets_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE SET NULL
);

-- 2. Add comments to the table and columns
COMMENT ON TABLE public.tickets IS 'Stores support tickets created by users.';
COMMENT ON COLUMN public.tickets.status IS 'The current status of the support ticket.';

-- 3. Enable RLS
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
CREATE POLICY "Allow users to view their own tickets"
ON public.tickets
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Allow users to create tickets"
ON public.tickets
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow admins full access to tickets"
ON public.tickets
FOR ALL
USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
)
WITH CHECK (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

-- 5. Add a helper function to update `updated_at` timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Add a trigger to update `updated_at` on ticket update
CREATE TRIGGER on_ticket_update
BEFORE UPDATE ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
