-- Checkout creates tickets with the buyer's client
CREATE POLICY "Users can create tickets" ON "public"."tickets"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = tickets.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their tickets"
  ON public.tickets
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = tickets.order_id
      AND orders.user_id = auth.uid()
    )
  );
