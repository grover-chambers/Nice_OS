-- NiceOS: fix zone names to match app conventions.
-- Western → Kiambu, Southern → Kajiado.
-- Idempotent: uses DO blocks and WHERE filters.

set search_path = public;

-- 1. Territories table
UPDATE public.territories SET name = 'Kiambu',  zone = 'Kiambu'  WHERE id = 'a0000000-0000-4000-8000-000000000003';
UPDATE public.territories SET name = 'Kajiado', zone = 'Kajiado' WHERE id = 'a0000000-0000-4000-8000-000000000005';

-- 2. Retailers referencing old zone names
UPDATE public.retailers SET zone = 'Kiambu'  WHERE zone = 'Western';
UPDATE public.retailers SET zone = 'Kajiado' WHERE zone = 'Southern';

-- 3. Reps referencing old zone names
UPDATE public.reps SET zone = 'Kiambu'  WHERE zone = 'Western';
UPDATE public.reps SET zone = 'Kajiado' WHERE zone = 'Southern';

-- 4. Profiles referencing old zone names
UPDATE public.profiles SET zone = 'Kiambu'  WHERE zone = 'Western';
UPDATE public.profiles SET zone = 'Kajiado' WHERE zone = 'Southern';

-- 5. Routes referencing old zone names
UPDATE public.routes SET zone = 'Kiambu'  WHERE zone = 'Western';
UPDATE public.routes SET zone = 'Kajiado' WHERE zone = 'Southern';

-- 6. Coverage logs
UPDATE public.coverage_logs SET zone = 'Kiambu'  WHERE zone = 'Western';
UPDATE public.coverage_logs SET zone = 'Kajiado' WHERE zone = 'Southern';
