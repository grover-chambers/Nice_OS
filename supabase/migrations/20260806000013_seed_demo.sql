-- NiceOS: demo seed. Creates exactly four users (profiles with auth_id = NULL,
-- so they cannot log in until linked to a real auth user via the signup
-- trigger on email match):
--   * System Admin        (admin)
--   * Grace Kamau         (territory_manager) — Central
--   * Kevin Otieno        (sales_rep)         — Central, reports to Grace
--   * Nice Limited CEO    (ceo)               — report-based view
-- Plus a starter set of retailers so the dashboard/map have data to show
-- immediately after `supabase db push`. Retailers are owned by the single
-- rep / manager for FK + RLS scoping.

set search_path = public;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

insert into public.profiles (id, auth_id, email, full_name, phone, role, zone, territory_id, status)
values
  ('10000000-0000-4000-8000-000000000001', null, 'admin@niceos.co.ke', 'System Admin',     '0711 111 111', 'admin',             null,   null, 'active'),
  ('10000000-0000-4000-8000-000000000002', null, 'manager@niceos.co.ke', 'Grace Kamau',    '0712 222 222', 'territory_manager', 'Central', 'a0000000-0000-4000-8000-000000000001', 'active'),
  ('20000000-0000-4000-8000-000000000001', null, 'kevin.otieno@niceos.co.ke', 'Kevin Otieno', '0722 101 001', 'sales_rep', 'Central', 'a0000000-0000-4000-8000-000000000001', 'active'),
  ('30000000-0000-4000-8000-000000000001', null, 'ceo@niceos.co.ke',   'CEO, Nice Limited', '0733 333 333', 'ceo',          null,   null, 'active')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Reps
-- ---------------------------------------------------------------------------

insert into public.reps (id, name, phone, email, color, zone, wards, target_visits_month, actual_visits_month, on_route, last_sync_at, device, status, manager_id)
values
  ('20000000-0000-4000-8000-000000000001', 'Kevin Otieno', '0722 101 001', 'kevin.otieno@niceos.co.ke', '#2563eb', 'Central', array['Nairobi Central', 'Pangani', 'Ngara'], 96, 84, true, now() - interval '8 minutes', 'Samsung A15', 'active', '10000000-0000-4000-8000-000000000002')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Retailers (a starter set across all six zones, all serviced by Kevin)
-- ---------------------------------------------------------------------------

insert into public.retailers
  (id, name, owner_name, phone, business_type, business_size, tier, status, ward, constituency, zone, address, lat, lng, health_score, churn_risk, last_visit_at, visits30d, orders30d, avg_order_value, order_trend_pct, rep_id, territory_id, created_by, competitor_presence, shelf_note)
values
  -- Central
  ('40000000-0000-4000-8000-000000000001', 'Star Stores',      'James Otieno',    '0711 301 001', 'duka',       'small',  'B', 'active',   'Nairobi Central',   'Starehe',     'Central',       'Koinange St 12, Nairobi Central', -1.2833, 36.8219, 82, 'low',    now() - interval '2 days',   4, 3, 5400,   12, '20000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', '[{"brand":"Unga Ltd","proximity":"same-street"}]', null),
  ('40000000-0000-4000-8000-000000000002', 'Alpha Mini-Mart',  'Fatuma Hassan',   '0711 301 002', 'supermarket', 'medium', 'A', 'active',   'Pangani',           'Starehe',     'Central',       'Jogoo Rd 44, Pangani',          -1.2790, 36.8350, 76, 'low',    now() - interval '1 day',    6, 5, 9800,   20, '20000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', '[]', null),
  ('40000000-0000-4000-8000-000000000003', 'Unity General',    'Samuel Kimani',   '0711 301 003', 'duka',       'small',  'C', 'at-risk', 'Ngara',             'Starehe',     'Central',       'Moi Ave 7, Ngara',              -1.2721, 36.8275, 45, 'high',   now() - interval '18 days',  3, 1, 2600,   -22, '20000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', '[{"brand":"Pembe Flour","proximity":"nearby"}]', 'Low Nice stock — competitor shelf presence high'),
  -- Northern
  ('40000000-0000-4000-8000-000000000004', 'Sunrise Shop',     'Eunice Wanjiru',  '0711 302 001', 'kiosk',      'small',  'C', 'active',   'Roysambu',          'Roysambu',    'Northern',      'Thika Rd 101, Roysambu',        -1.2194, 36.8670, 71, 'low',    now() - interval '3 days',   3, 2, 3200,    5, '20000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '[]', null),
  ('40000000-0000-4000-8000-000000000005', 'City Wholesale',   'David Maina',     '0711 302 002', 'wholesaler', 'large',  'A', 'active',   'Kahawa',            'Roysambu',    'Northern',      'Kenyatta Ave 21, Kahawa',       -1.1936, 36.9180, 88, 'low',    now() - interval '1 day',    7, 6, 15400,  30, '20000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '[{"brand":"Bidco Millers","proximity":"same-street"}]', null),
  ('40000000-0000-4000-8000-000000000006', 'Green Dealers',    'Halima Ali',      '0711 302 003', 'duka',       'small',  'C', 'prospect', 'Githurai',          'Roysambu',    'Northern',      'Kipande Rd 5, Githurai',        -1.2115, 36.8815, 50, 'medium', null,                   0, 0, 0,      0, '20000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '[{"brand":"Mombasa Maize Millers","proximity":"nearby"}]', null),
  -- Western
  ('40000000-0000-4000-8000-000000000007', 'GoodLife Mart',    'George Wanyama',  '0711 303 001', 'supermarket', 'medium', 'A', 'active',   'Westlands',         'Westlands',   'Western',       'Oginga Odinga St 33, Westlands', -1.2681, 36.8083, 90, 'low',    now() - interval '1 day',    8, 7, 12100,  25, '20000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', '[]', null),
  ('40000000-0000-4000-8000-000000000008', 'Family Kiosk',     'Mercy Chepkemoi', '0711 303 002', 'kiosk',      'small',  'C', 'active',   'Kilimani',          'Westlands',   'Western',       'Ngong Rd 9, Kilimani',          -1.2870, 36.7880, 68, 'low',    now() - interval '4 days',   2, 1, 2800,   -8, '20000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', '[]', null),
  ('40000000-0000-4000-8000-000000000009', 'Sunshine Stores',  'Stephen Ochieng', '0711 303 003', 'duka',       'small',  'B', 'at-risk', 'Kawangware',        'Westlands',   'Western',       'Tom Mboya St 17, Kawangware',   -1.2875, 36.7630, 42, 'high',   now() - interval '21 days',  2, 0, 1900,   -31, '20000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', '[{"brand":"Unga Ltd","proximity":"same-street"},{"brand":"Pembe Flour","proximity":"nearby"}]', 'Low Nice stock — competitor shelf presence high'),
  ('40000000-0000-4000-8000-000000000010', 'Jumbo Depot',      'Catherine Njeri', '0711 303 004', 'wholesaler', 'large',  'A', 'active',   'Kangemi',           'Westlands',   'Western',       'Enterprise Rd 2, Kangemi',      -1.2622, 36.7840, 84, 'low',    now() - interval '2 days',   5, 4, 11200,  18, '20000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', '[]', null),
  -- Eastern
  ('40000000-0000-4000-8000-000000000011', 'Bright Mart',      'Ali Mohammed',    '0711 304 001', 'supermarket', 'medium', 'A', 'active',   'Embakasi',          'Embakasi',    'Eastern',       'Kimathi St 4, Embakasi',        -1.3150, 36.8990, 79, 'low',    now() - interval '1 day',    6, 5, 8900,   15, '20000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000002', '[]', null),
  ('40000000-0000-4000-8000-000000000012', 'Market Traders',   'Rose Akinyi',     '0711 304 002', 'duka',       'small',  'B', 'active',   'Kayole',            'Embakasi',    'Eastern',       'Moi Ave 19, Kayole',            -1.2730, 36.9050, 64, 'low',    now() - interval '6 days',   3, 2, 4100,   -5, '20000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000002', '[{"brand":"Unga Ltd","proximity":"nearby"}]', null),
  ('40000000-0000-4000-8000-000000000013', 'Top Kiosk',        'Patrick Omondi',  '0711 304 003', 'kiosk',      'small',  'C', 'churned', 'Dandora',           'Embakasi',    'Eastern',       'Jogoo Rd 27, Dandora',          -1.2515, 36.8910, 24, 'high',   now() - interval '45 days',  0, 0, 0,     -40, '20000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000002', '[{"brand":"Pembe Flour","proximity":"same-street"}]', 'Low Nice stock — competitor shelf presence high'),
  -- Southern
  ('40000000-0000-4000-8000-000000000014', 'Blessed General',  'Jane Muthoni',    '0711 305 001', 'duka',       'small',  'B', 'active',   'Kibera',            'Lang''ata',    'Southern',      'Kenyatta Ave 8, Kibera',        -1.3150, 36.7870, 70, 'low',    now() - interval '2 days',   4, 3, 3800,   10, '20000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000002', '[]', null),
  ('40000000-0000-4000-8000-000000000015', 'Royal Wholesale',  'Mohammed Yusuf',  '0711 305 002', 'wholesaler', 'large',  'A', 'active',   'Lang''ata',         'Lang''ata',    'Southern',      'Koinange St 3, Lang''ata',      -1.3490, 36.7460, 86, 'low',    now() - interval '1 day',    6, 5, 13500,  22, '20000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000002', '[{"brand":"Bidco Millers","proximity":"same-street"}]', null),
  ('40000000-0000-4000-8000-000000000016', 'Quick Corner',     'Agnes Wambui',    '0711 305 003', 'kiosk',      'small',  'C', 'prospect', 'Karen',             'Lang''ata',    'Southern',      'Kipande Rd 22, Karen',          -1.3250, 36.7200, 52, 'medium', null,                   0, 0, 0,      0, '20000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000002', '[{"brand":"Mombasa Maize Millers","proximity":"nearby"}]', null),
  -- South-Eastern
  ('40000000-0000-4000-8000-000000000017', 'Evergreen Store',  'Joseph Karanja',  '0711 306 001', 'duka',       'small',  'B', 'active',   'Imara Daima',       'Makadara',    'South-Eastern', 'Tom Mboya St 6, Imara Daima',   -1.3030, 36.8720, 73, 'low',    now() - interval '2 days',   4, 3, 3600,    8, '20000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000002', '[]', null),
  ('40000000-0000-4000-8000-000000000018', 'Central Depot',    'Teresa Nduta',    '0711 306 002', 'wholesaler', 'large',  'A', 'active',   'Pipeline',          'Makadara',    'South-Eastern', 'Ngong Rd 14, Pipeline',         -1.3210, 36.8940, 81, 'low',    now() - interval '1 day',    7, 6, 12800,  19, '20000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000002', '[]', null),
  ('40000000-0000-4000-8000-000000000019', 'Kilimani Mart',    'Michael Otieno',  '0711 306 003', 'supermarket','medium', 'A', 'active',   'Viwandani',         'Makadara',    'South-Eastern', 'Moi Ave 11, Viwandani',         -1.3100, 36.8860, 77, 'low',    now() - interval '3 days',   5, 4, 7600,   14, '20000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000002', '[{"brand":"Pembe Flour","proximity":"nearby"}]', null),
  ('40000000-0000-4000-8000-000000000020', 'Metro Kiosk',      'Elizabeth Wafula','0711 306 004', 'kiosk',      'small',  'C', 'at-risk', 'Mukuru kwa Njenga', 'Makadara',    'South-Eastern', 'Jogoo Rd 31, Mukuru kwa Njenga',-1.3120, 36.9050, 38, 'high',   now() - interval '24 days',  2, 1, 1500,   -28, '20000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000002', '[{"brand":"Unga Ltd","proximity":"same-street"}]', 'Low Nice stock — competitor shelf presence high')
on conflict (id) do nothing;
