# Red Dot Drive 2026

Global donation tracker using Vercel + Supabase.

- Public tracker shows only verified donations.
- Donors submit transaction details and see verification in progress.
- Admin verification dashboard lives at `/admin/`.
- Existing confirmed seed: ₹25,003 against ₹5,00,000 goal (5.00%).

Setup details are in this README and `supabase/schema.sql`.

Never commit a Supabase service-role key. Use only the browser-safe publishable/anon key in `config.js`.
