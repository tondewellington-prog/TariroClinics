# TariroClinincs Web (GitHub Pages + Supabase)

This is a static web implementation of the MobiCol flow:

1. Customer info entry
2. Bill generation
3. Payment selection
4. Payment processing
5. Receipt generation
6. Real-time sync to Supabase
7. Admin dashboard revenue refresh
8. Officer/Admin login with Supabase Auth + role-based UI

## Setup

1. Open `js/config.js`
2. Replace:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
3. Leave/replace API placeholders:
   - EcoCash endpoint
   - Card gateway endpoint
   - SMS endpoint
   - Print endpoint

## Supabase SQL Setup

1. Open Supabase SQL Editor.
2. Run `supabase/schema.sql`.
3. In Supabase Authentication, create users (email/password) for officers/admins.
4. Assign roles with SQL:

```sql
select public.set_user_role('officer@tariroclinincs.com', 'officer');
select public.set_user_role('admin@tariroclinincs.com', 'admin');
```

The SQL file creates:
- `profiles` table for app roles (`officer`, `admin`)
- `transactions` table
- RLS policies so:
  - Officers can insert and view their own transactions
  - Admins can view all transactions

## Deploy to GitHub Pages

1. Push this folder to a GitHub repository.
2. In GitHub repo settings, enable Pages:
   - Source: Deploy from branch
   - Branch: `main` (root)
3. Visit your Pages URL.

## Important Note

For production, never call payment APIs directly from frontend.
Use a secure backend proxy for secret keys and signed requests.
