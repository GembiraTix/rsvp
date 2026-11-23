# Manual test: registration model v2 (PR #28)

Step-by-step verification for the reworked paid ordering model (RSVP-71): one
registration per ticket, orderer data on orders, duplicate attendee data legal,
e-ticket per settled order.

## Setup

1. Docker running, then `pnpm supabase start`.
2. `pnpm supabase db reset` — applies all migrations including
   `20261120000000_registration_model_v2.sql`.
3. `.env.local` must have `NUXT_PUBLIC_PAYMENTS_ENABLED=true`,
   `NUXT_EMAIL_PROVIDER=smtp`, and SMTP settings pointing at Inbucket
   (`smtp_port=54325`).
4. `pnpm dev --dotenv .env.local`
5. Tools: Supabase Studio http://localhost:54323 (Table Editor for DB checks),
   Inbucket http://localhost:54324 (email), Midtrans Sandbox.
6. Prepare two user accounts: **A** (will place orders) and **B** (clean, no
   orders). An admin account is needed for section 1.

## 1. Ticket quantity multiples

1. As admin, create/edit a ticket type with **Kelipatan (multiple) = 2**
   (the "couples" case), min 1 / max 10. Keep a normal type with Kelipatan 1.
2. On `/e/<slug>/tickets`: the couples type's stepper steps by 2, and selecting
   it starts at 2 (snapped to the grid).
3. Type an off-grid qty (e.g. 3) directly into the input, press Lanjut:
   `/register` rejects the cart and bounces back to `/tickets` (URL decode
   validation). The server rejects it too (`checkout-validation`).
4. The Kelipatan-1 type accepts 1, 2, 3, ... normally.

## 2. Data Pemesan + attendee forms

1. Pick qty 2 on the normal type, Lanjut. `/register` shows the **Data
   Pemesan** card plus **exactly 2** attendee cards.
2. Pemesan name/email prefilled from the logged-in profile, fully editable.
   Identity type/number and WhatsApp are empty and required.
3. No duplicate-email warnings anywhere (the old dedupe UI is gone).
4. Toggle **Samakan dengan detail pemesan** on attendee 1: copies the orderer's
   name, identity type/number, email, WhatsApp. **Gender stays empty** (copy
   never touches gender). Toggling off keeps the copied values.
5. Attendee forms require all fields including gender.

## 3. Duplicate attendee data allowed

1. With the copy switch on, attendee 2 is identical to attendee 1 (same name +
   email). Lanjut must reach `/checkout` without any duplicate error.

## 4. Checkout page

1. Ringkasan shows subtotal, Biaya layanan (admin fee), and correct total.
2. Info alert reads "E-tiket akan dikirim ke \<orderer email\> setelah
   pembayaran berhasil." — go back, change the orderer email, return: the
   notice reflects the new email.
3. The 10-minute countdown banner is visible.
4. Bayar redirects to Midtrans Sandbox.

## 5. Settlement: one rsvp per ticket

1. Pay in the sandbox and let Snap redirect back to `/checkout/finish`
   (locally the finish endpoint is what settles; the webhook path is prod-only).
2. Studio → `rsvps`: exactly 2 new rows for the event, **same email**, distinct
   `ticket_id`, both `is_attending = true`, names/identity/whatsapp/gender from
   the attendee forms, distinct `token`s.
3. `tickets`: 2 rows with the attendee data. `orders`: `status = paid`,
   `payment_status = settled`, `orderer_*` columns match what was typed (not
   the account data).
4. `confirmation_emails`: exactly 1 new row, `order_id` set, `rsvp_id` null,
   `status = sent`.

## 6. E-ticket email

1. Inbucket: exactly **one** email, sent to the **orderer** email (not the
   account email).
2. Subject `E-Tiket <event title> - INV-...`. Body lists both tickets (the
   duplicated attendee appears twice), Lokasi/Waktu in id-ID, CTA pointing at
   `/users/orders/<order id>`.

## 7. Orderer data may differ from the account

1. Place another order (1 ticket) from account A, but fill Data Pemesan with a
   completely different person (Hasan/Ef case).
2. After settlement: `orders.orderer_*` = the typed data, the e-ticket goes to
   that email, and the order still shows in account A's `/users/orders`.

## 8. Repeat orders allowed

1. Same account, same event, same ticket type, same attendee data, again.
2. No 409 anywhere: the order settles, one more rsvp row, one more ticket. No
   order-duplication prevention exists by decision.

## 9. Event page notice

1. Logged in as A (has settled orders), open the event page: sidebar shows the
   info alert "Kamu sudah punya tiket untuk acara ini" with a **Lihat
   pesanan** button to `/users/orders`, and **Beli Tiket remains the primary
   CTA**.
2. Logged in as B (no orders): no alert, plain Beli Tiket panel.
3. Logged out: no alert, and devtools network shows **no** calls to
   `/api/users/me/rsvps` or `/api/orders`.
4. A free event still shows the existing "RSVP Terkonfirmasi!" panel for
   registered users — no alert there.

## 10. Free RSVP regressions

1. On a free event, register with email X: success, confirmation email to X.
2. Register again with X: rejected with "Email sudah terdaftar untuk acara
   ini." (free uniqueness kept).
3. An email that exists only as a **paid** rsvp can still register for a free
   event, and an email with a free rsvp can still buy tickets.

## 11. Expiry and resume

1. Start an order and don't pay. After it expires (30 min, or set `expires_at`
   in the past via Studio), press Lanjutkan pembayaran in `/users/orders`:
   error "Pesanan telah kedaluwarsa." (410), order becomes `expired`, and its
   `tickets` rows are deleted.
2. For a pending, unexpired order: Lanjutkan pembayaran creates a new Snap
   transaction with the same Midtrans order id, updates the checkout URL, and
   payment completes normally.

## 12. Webhook race / idempotency

Not practical by hand locally: covered by the 23505 catch in
`createRsvpsForOrderTickets` (webhook vs finish race) and by unit tests.
