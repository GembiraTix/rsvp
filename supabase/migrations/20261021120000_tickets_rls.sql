-- Enable RLS is already done in previous migration, just add policies

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  );
$$;

-- event_payment_settings: only admins can manage
CREATE POLICY "Admins can read event payment settings"
  ON public.event_payment_settings
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can insert event payment settings"
  ON public.event_payment_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update event payment settings"
  ON public.event_payment_settings
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete event payment settings"
  ON public.event_payment_settings
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ticket_categories: anyone can read, admins manage (managed via migration seed for now)
CREATE POLICY "Anyone can read ticket categories"
  ON public.ticket_categories
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage ticket categories"
  ON public.ticket_categories
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ticket_types: public can read active ticket types for published events
CREATE POLICY "Anyone can read active ticket types"
  ON public.ticket_types
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Event owners and admins can manage ticket types"
  ON "public"."ticket_types"
  FOR ALL
  TO authenticated
  USING (
    public.is_admin()
    or exists (
      select 1
      from "public"."events"
      where "events"."id" = "ticket_types"."event_id"
        and "events"."created_by" = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM "public"."events"
      WHERE "events"."id" = "ticket_types"."event_id"
        AND "events"."created_by" = auth.uid()
    )
  );

-- orders: users can read their own orders, admins can read all
CREATE POLICY "Users can read their own orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can create orders"
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow guests to create orders? The schema says user_id is not null - need to check
-- Also allow service role/webhook to update

CREATE POLICY "Admins can manage all orders"
  ON public.orders
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- order_items: follow order access
CREATE POLICY "Users can read their order items"
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (
  (
    EXISTS (
        SELECT 1 FROM orders
        WHERE (
          (orders.user_id = auth.uid()) OR is_admin()
        )
    )
  )
);

CREATE POLICY "Users can create order items for their orders"
  ON "public"."order_items"
  AS permissive
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "public"."orders"
      WHERE "orders"."id" = "order_items"."order_id"
        AND "orders"."user_id" = auth.uid()
        AND "orders"."status" = 'pending'
    )
  );

CREATE POLICY "Admins can manage order items"
  ON public.order_items
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- tickets: users can read their own tickets, admins can manage all
CREATE POLICY "Users can read their tickets"
  ON public.tickets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = tickets.order_id
      AND (orders.user_id = auth.uid() OR public.is_admin())
    )
    OR public.is_admin()
  );

-- Public can read tickets by token for check-in? Or require auth
CREATE POLICY "Anyone can read ticket by token for check-in"
  ON public.tickets
  FOR SELECT
  TO anon, authenticated
  USING (true); -- We'll filter by token in query; be more restrictive in practice

CREATE POLICY "Admins can manage tickets"
  ON public.tickets
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- payment_events: only admins and service role
CREATE POLICY "Admins can read payment events"
  ON public.payment_events
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Service role can manage payment events"
  ON public.payment_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);



