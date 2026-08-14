-- NiceOS: expanded seed for production demo.
-- Adds 10 reps (2 per zone), ~120 retailers, 7 days of routes + visits,
-- SKU catalog, and competitor brands. All UUIDs are deterministic so
-- the seed is reproducible across `db reset`.
--
-- Depends on: 000001 (enums), 000002 (profiles), 000003 (territories),
-- 000004 (reps), 000005 (retailers), 000013 (original seed), 000007 (visits),
-- 000006 (routes), 000008 (order_intents), 000009 (competitor_observations),
-- 000014 (sku_catalog), 000015 (competitor_brands), 000001 (fix_zone_names).

set search_path = public;

-- ---------------------------------------------------------------------------
-- Zone territory UUIDs (stable, from migration 03)
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  v_zone_central   uuid := 'a0000000-0000-4000-8000-000000000001';
  v_zone_northern  uuid := 'a0000000-0000-4000-8000-000000000002';
  v_zone_kiambu    uuid := 'a0000000-0000-4000-8000-000000000003';
  v_zone_eastern   uuid := 'a0000000-0000-4000-8000-000000000004';
  v_zone_kajiado   uuid := 'a0000000-0000-4000-8000-000000000005';
  v_zone_se        uuid := 'a0000000-0000-4000-8000-000000000006';

  -- Manager profile (from seed 13)
  v_manager_id     uuid := '10000000-0000-4000-8000-000000000002';
  -- Existing rep profile (from seed 13)
  v_kevin_id       uuid := '20000000-0000-4000-8000-000000000001';

  -- New rep profile IDs (deterministic)
  v_lucy_profile   uuid := '20000000-0000-4000-8000-000000000010';
  v_brian_profile  uuid := '20000000-0000-4000-8000-000000000011';
  v_amina_profile  uuid := '20000000-0000-4000-8000-000000000012';
  v_daniel_profile uuid := '20000000-0000-4000-8000-000000000013';
  v_grace_profile  uuid := '20000000-0000-4000-8000-000000000014';
  v_peter_profile  uuid := '20000000-0000-4000-8000-000000000015';
  v_sarah_profile  uuid := '20000000-0000-4000-8000-000000000016';
  v_john_profile   uuid := '20000000-0000-4000-8000-000000000017';
  v_faith_profile  uuid := '20000000-0000-4000-8000-000000000018';
  v_collins_profile uuid := '20000000-0000-4000-8000-000000000019';

  v_rec record;
  v_i int;
  v_day int;
  v_route_id uuid;
  v_retailer_ids uuid[];
  v_retailer_id uuid;
  v_visit_id uuid;
  v_stop_count int;
  v_start_min int;
  v_acc_km numeric;
  v_acc_min int;
  v_km numeric;
  v_min int;
  v_visit_dur int;
  v_h int;
  v_m int;
  v_at timestamptz;
  v_status text;
  v_order_val numeric;
  v_sku_list text[] := ARRAY['NG-2','NG-5','NG-10','WM-2','JR-2','MC-5'];
  v_sku_names text[] := ARRAY['Nice Ugali 2kg','Nice Ugali 5kg','Nice Ugali 10kg','Nice Wimbi 2kg','Nice Jogoo 2kg','Nice Mchele 5kg'];
  v_sku_prices numeric[] := ARRAY[205,490,950,235,220,620];
  v_sku text;
  v_sku_name text;
  v_sku_price numeric;
  v_qty int;
  v_shelf text;
  v_order_id uuid;
  v_order_item_id uuid;
  v_seq int := 0;
BEGIN
  -- Skip if expanded seed already applied (check for Lucy's profile)
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_lucy_profile) THEN
    RAISE NOTICE 'Expanded seed already applied, skipping.';
    RETURN;
  END IF;

  -- =====================================================================
  -- 1. PROFILES + REPS (10 reps across 6 zones)
  -- =====================================================================

  -- Profiles for new reps
  INSERT INTO public.profiles (id, auth_id, email, full_name, phone, role, zone, territory_id, status)
  VALUES
    (v_lucy_profile,   null, 'lucy.mwangi@niceos.co.ke',    'Lucy Mwangi',    '0722 101 010', 'sales_rep', 'Central',      v_zone_central, 'active'),
    (v_brian_profile,  null, 'brian.kamau@niceos.co.ke',    'Brian Kamau',    '0722 101 011', 'sales_rep', 'Central',      v_zone_central, 'active'),
    (v_amina_profile,  null, 'amina.wanjiku@niceos.co.ke',  'Amina Wanjiku',  '0722 101 012', 'sales_rep', 'Northern',     v_zone_northern, 'active'),
    (v_daniel_profile, null, 'daniel.otieno@niceos.co.ke',  'Daniel Otieno',  '0722 101 013', 'sales_rep', 'Northern',     v_zone_northern, 'active'),
    (v_grace_profile,  null, 'grace.achieng@niceos.co.ke',  'Grace Achieng',  '0722 101 014', 'sales_rep', 'Kiambu',       v_zone_kiambu, 'active'),
    (v_peter_profile,  null, 'peter.njoroge@niceos.co.ke',  'Peter Njoroge',  '0722 101 015', 'sales_rep', 'Eastern',      v_zone_eastern, 'active'),
    (v_sarah_profile,  null, 'sarah.kiprop@niceos.co.ke',   'Sarah Kiprop',   '0722 101 016', 'sales_rep', 'Kajiado',      v_zone_kajiado, 'active'),
    (v_john_profile,   null, 'john.odhiambo@niceos.co.ke',  'John Odhiambo',  '0722 101 017', 'sales_rep', 'South-Eastern', v_zone_se, 'active'),
    (v_faith_profile,  null, 'faith.mutua@niceos.co.ke',    'Faith Mutua',    '0722 101 018', 'sales_rep', 'South-Eastern', v_zone_se, 'active'),
    (v_collins_profile,null, 'collins.wekesa@niceos.co.ke', 'Collins Wekesa', '0722 101 019', 'sales_rep', 'Kiambu',       v_zone_kiambu, 'active')
  ON CONFLICT (id) DO NOTHING;

  -- Reps table
  INSERT INTO public.reps (id, name, phone, email, color, zone, wards, target_visits_month, actual_visits_month, on_route, last_sync_at, device, status, manager_id)
  VALUES
    (v_kevin_id,       'Kevin Otieno',  '0722 101 001', 'kevin.otieno@niceos.co.ke',  '#2563eb', 'Central',      ARRAY['Nairobi Central','Pangani','Ngara','Eastleigh'], 96, 84, true,  now() - interval '8 min',  'Samsung A15',     'active', v_manager_id),
    (v_lucy_profile,   'Lucy Mwangi',   '0722 101 010', 'lucy.mwangi@niceos.co.ke',   '#0d9488', 'Central',      ARRAY['Landimawe','Pumwani','California'],               96, 78, false, now() - interval '25 min', 'Tecno Spark 10',  'active', v_manager_id),
    (v_brian_profile,  'Brian Kamau',   '0722 101 011', 'brian.kamau@niceos.co.ke',   '#7c3aed', 'Central',      ARRAY['Huruma','Kariobangi','Mathare','Korogocho'],      96, 71, false, now() - interval '2 h',   'Infinix Note 30', 'active', v_manager_id),
    (v_amina_profile,  'Amina Wanjiku', '0722 101 012', 'amina.wanjiku@niceos.co.ke', '#c2410c', 'Northern',     ARRAY['Kasarani','Githurai','Mwiki','Roysambu'],         96, 88, true,  now() - interval '15 min','Redmi Note 13',   'active', v_manager_id),
    (v_daniel_profile, 'Daniel Otieno', '0722 101 013', 'daniel.otieno@niceos.co.ke', '#be185d', 'Northern',     ARRAY['Njiru','Zimmerman','Kahawa West','Kahawa Sukari'], 96, 65, false, now() - interval '3 h',   'Samsung A15',     'active', v_manager_id),
    (v_grace_profile,  'Grace Achieng', '0722 101 014', 'grace.achieng@niceos.co.ke', '#4d7c0f', 'Kiambu',       ARRAY['Kangemi','Ruaka','Kihunguro','Tigoni'],           96, 72, false, now() - interval '1 h',   'Tecno Spark 10',  'active', v_manager_id),
    (v_peter_profile,  'Peter Njoroge', '0722 101 015', 'peter.njoroge@niceos.co.ke', '#1d4ed8', 'Eastern',      ARRAY['Jogoo Road','Buruburu','Umoja','Kayole'],         96, 82, true,  now() - interval '5 min',  'Infinix Note 30', 'active', v_manager_id),
    (v_sarah_profile,  'Sarah Kiprop',  '0722 101 016', 'sarah.kiprop@niceos.co.ke',  '#9333ea', 'Kajiado',      ARRAY['Kitengela','Ongata Rongai','Ngong','Karen'],      96, 60, false, now() - interval '4 h',   'Redmi Note 13',   'active', v_manager_id),
    (v_john_profile,   'John Odhiambo', '0722 101 017', 'john.odhiambo@niceos.co.ke', '#0f766e', 'South-Eastern',ARRAY['Imara Daima','Pipeline','Viwandani'],             96, 76, false, now() - interval '45 min','Samsung A15',     'active', v_manager_id),
    (v_faith_profile,  'Faith Mutua',   '0722 101 018', 'faith.mutua@niceos.co.ke',   '#b45309', 'South-Eastern',ARRAY['Mukuru kwa Njenga','Embakasi','Donholm'],         96, 69, false, now() - interval '2 h',   'Tecno Spark 10',  'active', v_manager_id),
    (v_collins_profile,'Collins Wekesa','0722 101 019', 'collins.wekesa@niceos.co.ke','#2563eb', 'Kiambu',       ARRAY['Ruiru','Juja','Zimmerman spillover'],             96, 55, false, now() - interval '5 h',   'Infinix Note 30', 'active', v_manager_id)
  ON CONFLICT (id) DO NOTHING;

  -- =====================================================================
  -- 2. RETAILERS (~120 across all zones)
  -- =====================================================================

  -- Central zone: 22 retailers (dense urban)
  INSERT INTO public.retailers (id, name, owner_name, phone, business_type, tier, status, ward, constituency, zone, address, lat, lng, health_score, churn_risk, last_visit_at, visits30d, orders30d, avg_order_value, order_trend_pct, rep_id, territory_id, created_by, competitor_presence, shelf_note)
  SELECT v.id::uuid, v.name, v.owner, v.phone, v.type::public.outlet_type, v.tier::public.retailer_tier, v.status::public.retailer_status, v.ward, v.const, 'Central', v.addr, v.lat::double precision, v.lng::double precision, v.hs::int, v.churn::public.churn_risk, v.last::timestamptz, v.vis::int, v.ord::int, v.avg::numeric, v.trend::int, v.rep::uuid, v_zone_central, v_manager_id, v.comp::jsonb, v.shelf
  FROM (VALUES
    ('50000000-0000-4000-8000-000000000001','Star Stores','James Otieno','0711 401 001','duka','B','active','Nairobi Central','Starehe','Koinange St 12',-1.2833,36.8219,82,'low',now()-interval '2 days',4,3,5400,12,'20000000-0000-4000-8000-000000000001','[{"brand":"Unga Ltd","proximity":"same-street"}]',null),
    ('50000000-0000-4000-8000-000000000002','Alpha Mini-Mart','Fatuma Hassan','0711 401 002','supermarket','A','active','Pangani','Starehe','Jogoo Rd 44',-1.2790,36.8350,76,'low',now()-interval '1 day',6,5,9800,20,'20000000-0000-4000-8000-000000000001','[]',null),
    ('50000000-0000-4000-8000-000000000003','Unity General','Samuel Kimani','0711 401 003','duka','C','at-risk','Ngara','Starehe','Moi Ave 7',-1.2721,36.8275,45,'high',now()-interval '18 days',3,1,2600,-22,'20000000-0000-4000-8000-000000000001','[{"brand":"Pembe Flour","proximity":"nearby"}]','Low Nice stock'),
    ('50000000-0000-4000-8000-000000000004','Landimawe Duka','Eunice Wanjiru','0711 401 004','duka','C','active','Landimawe','Starehe','Kenyatta Ave 19',-1.2750,36.8200,68,'low',now()-interval '3 days',3,2,3200,5,'20000000-0000-4000-8000-000000000010','[]',null),
    ('50000000-0000-4000-8000-000000000005','Pumwani Mart','David Maina','0711 401 005','supermarket','B','active','Pumwani','Starehe','Moi Ave 31',-1.2875,36.8525,71,'low',now()-interval '1 day',5,4,7200,15,'20000000-0000-4000-8000-000000000010','[]',null),
    ('50000000-0000-4000-8000-000000000006','Eastleigh Wholesale','Halima Ali','0711 401 006','wholesaler','A','active','Eastleigh','Starehe','Muratina St 8',-1.2680,36.8550,88,'low',now()-interval '1 day',7,6,15400,30,'20000000-0000-4000-8000-000000000001','[{"brand":"Bidco Millers","proximity":"same-street"}]',null),
    ('50000000-0000-4000-8000-000000000007','California Kiosk','George Wanyama','0711 401 007','kiosk','C','active','California','Starehe','Lucky Summer Rd 3',-1.2650,36.8550,62,'low',now()-interval '5 days',2,1,2800,-8,'20000000-0000-4000-8000-000000000010','[]',null),
    ('50000000-0000-4000-8000-000000000008','Huruma Stores','Mercy Chepkemoi','0711 401 008','duka','B','active','Huruma','Mathare','Huruma Dr 14',-1.2550,36.8700,74,'low',now()-interval '2 days',4,3,4100,8,'20000000-0000-4000-8000-000000000011','[]',null),
    ('50000000-0000-4000-8000-000000000009','Kariobangi Mart','Stephen Ochieng','0711 401 009','supermarket','B','at-risk','Kariobangi','Mathare','Kariobangi Rd 22',-1.2500,36.8900,42,'high',now()-interval '21 days',2,0,1900,-31,'20000000-0000-4000-8000-000000000011','[{"brand":"Unga Ltd","proximity":"same-street"},{"brand":"Pembe Flour","proximity":"nearby"}]','Low Nice stock'),
    ('50000000-0000-4000-8000-000000000010','Mathare Duka','Catherine Njeri','0711 401 010','duka','C','active','Mathare','Mathare','Mathare Slum Rd 5',-1.2600,36.8650,58,'medium',now()-interval '4 days',2,1,2200,-5,'20000000-0000-4000-8000-000000000011','[]',null),
    ('50000000-0000-4000-8000-000000000011','Korogocho General','Ali Mohammed','0711 401 011','duka','C','active','Korogocho','Mathare','Korogocho Way 17',-1.2450,36.8950,55,'medium',now()-interval '6 days',2,1,1800,-10,'20000000-0000-4000-8000-000000000011','[]',null),
    ('50000000-0000-4000-8000-000000000012','Dandora Bright','Rose Akinyi','0711 401 012','kiosk','C','active','Dandora','Embakasi North','Dandora Phase 2',-1.2550,36.9050,64,'low',now()-interval '3 days',3,2,3600,10,'20000000-0000-4000-8000-000000000001','[]',null),
    ('50000000-0000-4000-8000-000000000013','Baba Ndogo Shops','Patrick Omondi','0711 401 013','duka','C','prospect','Baba Ndogo','Roysambu','Baba Ndogo Rd 9',-1.2400,36.8800,50,'medium',null,0,0,0,0,'20000000-0000-4000-8000-000000000011','[{"brand":"Mombasa Maize Millers","proximity":"nearby"}]',null),
    ('50000000-0000-4000-8000-000000000014','Lucky Summer Mart','Jane Muthoni','0711 401 014','kiosk','C','active','Lucky Summer','Roysambu','Lucky Summer Rd 21',-1.2350,36.8850,60,'low',now()-interval '7 days',2,1,2400,0,'20000000-0000-4000-8000-000000000001','[]',null),
    ('50000000-0000-4000-8000-000000000015','Ziwani Store','Mohammed Yusuf','0711 401 015','duka','B','active','Ziwani','Starehe','Ziwani Kariokor Rd',-1.2850,36.8350,70,'low',now()-interval '2 days',4,3,4800,12,'20000000-0000-4000-8000-000000000010','[]',null),
    ('50000000-0000-4000-8000-000000000016','Ngara Kiosk','Agnes Wambui','0711 401 016','kiosk','C','active','Ngara','Starehe','Ngara Rd 33',-1.2721,36.8275,66,'low',now()-interval '4 days',3,2,3000,5,'20000000-0000-4000-8000-000000000001','[]',null),
    ('50000000-0000-4000-8000-000000000017','Starehe Wholesale','Joseph Karanja','0711 401 017','wholesaler','A','active','Nairobi Central','Starehe','Moi Ave 1',-1.2833,36.8219,90,'low',now()-interval '1 day',8,7,18200,25,'20000000-0000-4000-8000-000000000001','[]',null),
    ('50000000-0000-4000-8000-000000000018','City Market Duka','Teresa Nduta','0711 401 018','duka','B','active','Nairobi Central','Starehe','Muindi Mbingu St',-1.2833,36.8219,72,'low',now()-interval '3 days',5,4,6100,10,'20000000-0000-4000-8000-000000000010','[]',null),
    ('50000000-0000-4000-8000-000000000019','Pangani Mart','Michael Otieno','0711 401 019','supermarket','B','active','Pangani','Starehe','Pangani Rd 15',-1.2745,36.8400,75,'low',now()-interval '2 days',5,4,7800,14,'20000000-0000-4000-8000-000000000001','[]',null),
    ('50000000-0000-4000-8000-000000000020','Eastleigh Duka','Elizabeth Wafula','0711 401 020','duka','C','churned','Eastleigh','Starehe','1st Ave Eastleigh',-1.2680,36.8550,24,'high',now()-interval '45 days',0,0,0,-40,'20000000-0000-4000-8000-000000000001','[{"brand":"Pembe Flour","proximity":"same-street"}]','No Nice stock — competitor dominant'),
    ('50000000-0000-4000-8000-000000000021','Mwiki Kiosk','Kevin Mwangi','0711 401 021','kiosk','C','active','Mwiki','Kasarani','Mwiki Rd 8',-1.1900,36.9300,56,'medium',now()-interval '8 days',1,1,2100,-15,'20000000-0000-4000-8000-000000000011','[]',null),
    ('50000000-0000-4000-8000-000000000022','Ruaraka Store','Grace Njeri','0711 401 022','duka','B','active','Ruaraka','Roysambu','Thika Rd 88',-1.2450,36.8850,70,'low',now()-interval '3 days',4,3,4500,8,'20000000-0000-4000-8000-000000000001','[]',null)
  ) AS v(id, name, owner, phone, type, tier, status, ward, const, addr, lat, lng, hs, churn, last, vis, ord, avg, trend, rep, comp, shelf)
  ON CONFLICT (id) DO NOTHING;

  -- Northern zone: 20 retailers
  INSERT INTO public.retailers (id, name, owner_name, phone, business_type, tier, status, ward, constituency, zone, address, lat, lng, health_score, churn_risk, last_visit_at, visits30d, orders30d, avg_order_value, order_trend_pct, rep_id, territory_id, created_by, competitor_presence, shelf_note)
  SELECT v.id::uuid, v.name, v.owner, v.phone, v.type::public.outlet_type, v.tier::public.retailer_tier, v.status::public.retailer_status, v.ward, v.const, 'Northern', v.addr, v.lat::double precision, v.lng::double precision, v.hs::int, v.churn::public.churn_risk, v.last::timestamptz, v.vis::int, v.ord::int, v.avg::numeric, v.trend::int, v.rep::uuid, v_zone_northern, v_manager_id, v.comp::jsonb, v.shelf
  FROM (VALUES
    ('50000000-0000-4000-8000-000000000030','Sunrise Shop','Eunice Wanjiru','0711 402 001','kiosk','C','active','Roysambu','Roysambu','Thika Rd 101',-1.2194,36.8670,71,'low',now()-interval '3 days',3,2,3200,5,'20000000-0000-4000-8000-000000000001','[]',null),
    ('50000000-0000-4000-8000-000000000031','City Wholesale','David Maina','0711 402 002','wholesaler','A','active','Kahawa','Roysambu','Kenyatta Ave 21',-1.1936,36.9180,88,'low',now()-interval '1 day',7,6,15400,30,'20000000-0000-4000-8000-000000000001','[{"brand":"Bidco Millers","proximity":"same-street"}]',null),
    ('50000000-0000-4000-8000-000000000032','Green Dealers','Halima Ali','0711 402 003','duka','C','prospect','Githurai','Roysambu','Kipande Rd 5',-1.2115,36.8815,50,'medium',null,0,0,0,0,'20000000-0000-4000-8000-000000000001','[{"brand":"Mombasa Maize Millers","proximity":"nearby"}]',null),
    ('50000000-0000-4000-8000-000000000033','Kasarani Mart','George Wanyama','0711 402 004','supermarket','B','active','Kasarani','Kasarani','Kasarani Rd 45',-1.2250,36.9000,74,'low',now()-interval '2 days',5,4,6800,12,'20000000-0000-4000-8000-000000000012','[]',null),
    ('50000000-0000-4000-8000-000000000034','Mwiki Duka','Mercy Chepkemoi','0711 402 005','duka','C','active','Mwiki','Kasarani','Mwiki Rd 12',-1.1900,36.9300,58,'medium',now()-interval '5 days',2,1,2400,-8,'20000000-0000-4000-8000-000000000012','[]',null),
    ('50000000-0000-4000-8000-000000000035','Njiru Stores','Stephen Ochieng','0711 402 006','duka','B','active','Njiru','Kasarani','Njiru Rd 28',-1.2150,36.9300,66,'low',now()-interval '3 days',3,2,3600,5,'20000000-0000-4000-8000-000000000013','[]',null),
    ('50000000-0000-4000-8000-000000000036','Zimmerman Kiosk','Catherine Njeri','0711 402 007','kiosk','C','active','Zimmerman','Kasarani','Zimmerman Rd 7',-1.2050,36.8700,55,'medium',now()-interval '6 days',2,1,2100,-10,'20000000-0000-4000-8000-000000000013','[]',null),
    ('50000000-0000-4000-8000-000000000037','Roysambu Bright','Ali Mohammed','0711 402 008','supermarket','A','active','Roysambu','Roysambu','Thika Rd 78',-1.2100,36.8700,85,'low',now()-interval '1 day',7,6,12800,22,'20000000-0000-4000-8000-000000000012','[]',null),
    ('50000000-0000-4000-8000-000000000038','Kahawa West Mart','Rose Akinyi','0711 402 009','duka','B','active','Kahawa West','Roysambu','Kahawa West Rd',-1.1950,36.8850,72,'low',now()-interval '2 days',4,3,4200,8,'20000000-0000-4000-8000-000000000012','[]',null),
    ('50000000-0000-4000-8000-000000000039','Kahawa Sukari Duka','Patrick Omondi','0711 402 010','kiosk','C','active','Kahawa Sukari','Roysambu','Kahawa Sukari Rd',-1.1750,36.9000,60,'low',now()-interval '4 days',3,2,2800,0,'20000000-0000-4000-8000-000000000013','[]',null),
    ('50000000-0000-4000-8000-000000000040','Kahawa Wendani Shop','Jane Muthoni','0711 402 011','duka','C','active','Kahawa Wendani','Roysambu','Kahawa Wendani Rd',-1.1650,36.9150,56,'medium',now()-interval '7 days',1,1,2200,-12,'20000000-0000-4000-8000-000000000012','[]',null),
    ('50000000-0000-4000-8000-000000000041','Ruiru Mart','Mohammed Yusuf','0711 402 012','supermarket','A','active','Ruiru','Juja','Ruiru Town Centre',-1.1450,36.9450,91,'low',now()-interval '1 day',8,7,16500,28,'20000000-0000-4000-8000-000000000012','[]',null),
    ('50000000-0000-4000-8000-000000000042','Juja Store','Joseph Karanja','0711 402 013','duka','B','active','Juja','Juja','Juja Town Rd',-1.1000,37.0100,70,'low',now()-interval '3 days',4,3,4800,10,'20000000-0000-4000-8000-000000000013','[]',null),
    ('50000000-0000-4000-8000-000000000043','Eastern Bypass Duka','Teresa Nduta','0711 402 014','kiosk','C','active','Kasarani','Kasarani','Eastern Bypass',-1.2300,36.9550,52,'medium',now()-interval '5 days',2,1,2000,-5,'20000000-0000-4000-8000-000000000012','[]',null),
    ('50000000-0000-4000-8000-000000000044','Chokaa Mart','Michael Otieno','0711 402 015','duka','C','active','Chokaa','Kasarani','Chokaa Rd 3',-1.2300,36.9400,48,'medium',now()-interval '8 days',1,1,1800,-18,'20000000-0000-4000-8000-000000000013','[{"brand":"Unga Ltd","proximity":"nearby"}]',null),
    ('50000000-0000-4000-8000-000000000045','Ruai Shops','Elizabeth Wafula','0711 402 016','duka','C','prospect','Ruai','Kasarani','Ruai Rd 10',-1.2000,36.9500,50,'medium',null,0,0,0,0,'20000000-0000-4000-8000-000000000013','[]',null),
    ('50000000-0000-4000-8000-000000000046','Kamulu Duka','Kevin Mwangi','0711 402 017','kiosk','C','active','Kamulu','Kasarani','Kamulu Rd 4',-1.2200,36.9700,45,'high',now()-interval '12 days',1,0,0,-25,'20000000-0000-4000-8000-000000000013','[{"brand":"Pembe Flour","proximity":"same-street"}]','Low Nice stock'),
    ('50000000-0000-4000-8000-000000000047','Joska Mart','Grace Njeri','0711 402 018','duka','C','active','Joska','Kasarani','Joska Rd 6',-1.2400,36.9900,52,'medium',now()-interval '6 days',2,1,2200,-8,'20000000-0000-4000-8000-000000000013','[]',null),
    ('50000000-0000-4000-8000-000000000048','Githurai Duka','Brian Kamau','0711 402 019','duka','B','active','Githurai','Roysambu','Githurai 45 Rd',-1.2115,36.8815,68,'low',now()-interval '3 days',3,2,3400,5,'20000000-0000-4000-8000-000000000011','[]',null),
    ('50000000-0000-4000-8000-000000000049','Clay City Store','Lucy Mwangi','0711 402 020','supermarket','B','churned','Clay City','Kasarani','Clay City Rd',-1.2200,36.8900,30,'high',now()-interval '55 days',0,0,0,-45,'20000000-0000-4000-8000-000000000010','[{"brand":"Unga Ltd","proximity":"same-street"},{"brand":"Pembe Flour","proximity":"nearby"}]','No Nice stock — competitor dominant')
  ) AS v(id, name, owner, phone, type, tier, status, ward, const, addr, lat, lng, hs, churn, last, vis, ord, avg, trend, rep, comp, shelf)
  ON CONFLICT (id) DO NOTHING;

  -- Kiambu zone: 18 retailers
  INSERT INTO public.retailers (id, name, owner_name, phone, business_type, tier, status, ward, constituency, zone, address, lat, lng, health_score, churn_risk, last_visit_at, visits30d, orders30d, avg_order_value, order_trend_pct, rep_id, territory_id, created_by, competitor_presence, shelf_note)
  SELECT v.id::uuid, v.name, v.owner, v.phone, v.type::public.outlet_type, v.tier::public.retailer_tier, v.status::public.retailer_status, v.ward, v.const, 'Kiambu', v.addr, v.lat::double precision, v.lng::double precision, v.hs::int, v.churn::public.churn_risk, v.last::timestamptz, v.vis::int, v.ord::int, v.avg::numeric, v.trend::int, v.rep::uuid, v_zone_kiambu, v_manager_id, v.comp::jsonb, v.shelf
  FROM (VALUES
    ('50000000-0000-4000-8000-000000000060','GoodLife Mart','George Wanyama','0711 403 001','supermarket','A','active','Kangemi','Westlands','Oginga Odinga St 33',-1.2681,36.8083,90,'low',now()-interval '1 day',8,7,12100,25,'20000000-0000-4000-8000-000000000014','[]',null),
    ('50000000-0000-4000-8000-000000000061','Family Kiosk','Mercy Chepkemoi','0711 403 002','kiosk','C','active','Kilimani','Westlands','Ngong Rd 9',-1.2870,36.7880,68,'low',now()-interval '4 days',2,1,2800,-8,'20000000-0000-4000-8000-000000000014','[]',null),
    ('50000000-0000-4000-8000-000000000062','Sunshine Stores','Stephen Ochieng','0711 403 003','duka','B','at-risk','Kawangware','Westlands','Tom Mboya St 17',-1.2875,36.7630,42,'high',now()-interval '21 days',2,0,1900,-31,'20000000-0000-4000-8000-000000000014','[{"brand":"Unga Ltd","proximity":"same-street"},{"brand":"Pembe Flour","proximity":"nearby"}]','Low Nice stock'),
    ('50000000-0000-4000-8000-000000000063','Jumbo Depot','Catherine Njeri','0711 403 004','wholesaler','A','active','Kangemi','Westlands','Enterprise Rd 2',-1.2622,36.7840,84,'low',now()-interval '2 days',5,4,11200,18,'20000000-0000-4000-8000-000000000014','[]',null),
    ('50000000-0000-4000-8000-000000000064','Ruaka Mart','Ali Mohammed','0711 403 005','supermarket','B','active','Ruaka','Kiambaa','Ruaka Town Rd',-1.1900,36.7800,75,'low',now()-interval '2 days',5,4,6800,12,'20000000-0000-4000-8000-000000000019','[]',null),
    ('50000000-0000-4000-8000-000000000065','Kihunguro Store','Rose Akinyi','0711 403 006','duka','C','active','Kihunguro','Kiambaa','Kihunguro Rd 5',-1.1750,36.7900,58,'medium',now()-interval '5 days',2,1,2400,-5,'20000000-0000-4000-8000-000000000019','[]',null),
    ('50000000-0000-4000-8000-000000000066','Tigoni Duka','Patrick Omondi','0711 403 007','duka','C','active','Tigoni','Limuru','Tigoni Rd 8',-1.1500,36.7400,55,'medium',now()-interval '6 days',2,1,2200,-8,'20000000-0000-4000-8000-000000000014','[]',null),
    ('50000000-0000-4000-8000-000000000067','Ruiru Town Mart','Jane Muthoni','0711 403 008','supermarket','A','active','Ruiru','Juja','Ruiru Town Centre',-1.1450,36.9450,92,'low',now()-interval '1 day',8,7,17200,30,'20000000-0000-4000-8000-000000000019','[]',null),
    ('50000000-0000-4000-8000-000000000068','Juja Kiosk','Mohammed Yusuf','0711 403 009','kiosk','C','active','Juja','Juja','Juja Rd 12',-1.1000,37.0100,54,'medium',now()-interval '4 days',3,2,2600,0,'20000000-0000-4000-8000-000000000019','[]',null),
    ('50000000-0000-4000-8000-000000000069','Kiambu Road Store','Joseph Karanja','0711 403 010','duka','B','active','Kiambu Town','Kiambu','Kiambu Rd 55',-1.1700,36.8300,72,'low',now()-interval '3 days',4,3,4500,10,'20000000-0000-4000-8000-000000000019','[]',null),
    ('50000000-0000-4000-8000-000000000070','Kangemi Duka','Teresa Nduta','0711 403 011','duka','C','active','Kangemi','Westlands','Kangemi Rd 18',-1.2650,36.7620,60,'low',now()-interval '4 days',3,2,3200,5,'20000000-0000-4000-8000-000000000014','[]',null),
    ('50000000-0000-4000-8000-000000000071','Westlands Mart','Michael Otieno','0711 403 012','supermarket','A','active','Westlands','Westlands','Westlands Rd 10',-1.2681,36.8083,86,'low',now()-interval '1 day',7,6,14500,22,'20000000-0000-4000-8000-000000000014','[]',null),
    ('50000000-0000-4000-8000-000000000072','Kilimani Store','Elizabeth Wafula','0711 403 013','duka','B','active','Kilimani','Westlands','Kilimani Rd 22',-1.2870,36.7880,70,'low',now()-interval '3 days',4,3,4200,8,'20000000-0000-4000-8000-000000000014','[]',null),
    ('50000000-0000-4000-8000-000000000073','Limuru Duka','Kevin Mwangi','0711 403 014','kiosk','C','prospect','Limuru','Limuru','Limuru Town Rd',-1.1400,36.7200,50,'medium',null,0,0,0,0,'20000000-0000-4000-8000-000000000019','[]',null),
    ('50000000-0000-4000-8000-000000000074','Kiambu Mart','Grace Njeri','0711 403 015','supermarket','B','active','Kiambu Town','Kiambu','Kiambu Rd 30',-1.1700,36.8300,78,'low',now()-interval '2 days',5,4,7200,15,'20000000-0000-4000-8000-000000000019','[]',null),
    ('50000000-0000-4000-8000-000000000075','Thika Road Kiosk','Collins Wekesa','0711 403 016','kiosk','C','active','Kasarani','Kasarani','Thika Rd 120',-1.2200,36.8900,52,'medium',now()-interval '7 days',1,1,2000,-12,'20000000-0000-4000-8000-000000000019','[]',null),
    ('50000000-0000-4000-8000-000000000076','Kawangware Store','Brian Kamau','0711 403 017','duka','C','churned','Kawangware','Westlands','Kawangware Rd 40',-1.2875,36.7630,28,'high',now()-interval '50 days',0,0,0,-38,'20000000-0000-4000-8000-000000000011','[{"brand":"Unga Ltd","proximity":"same-street"}]','No Nice stock — competitor dominant'),
    ('50000000-0000-4000-8000-000000000077','Ngong Town Mart','Sarah Kiprop','0711 403 018','duka','B','active','Ngong','Kajiado North','Ngong Rd 55',-1.3620,36.6560,68,'low',now()-interval '3 days',3,2,3800,5,'20000000-0000-4000-8000-000000000016','[]',null)
  ) AS v(id, name, owner, phone, type, tier, status, ward, const, addr, lat, lng, hs, churn, last, vis, ord, avg, trend, rep, comp, shelf)
  ON CONFLICT (id) DO NOTHING;

  -- Eastern zone: 18 retailers
  INSERT INTO public.retailers (id, name, owner_name, phone, business_type, tier, status, ward, constituency, zone, address, lat, lng, health_score, churn_risk, last_visit_at, visits30d, orders30d, avg_order_value, order_trend_pct, rep_id, territory_id, created_by, competitor_presence, shelf_note)
  SELECT v.id::uuid, v.name, v.owner, v.phone, v.type::public.outlet_type, v.tier::public.retailer_tier, v.status::public.retailer_status, v.ward, v.const, 'Eastern', v.addr, v.lat::double precision, v.lng::double precision, v.hs::int, v.churn::public.churn_risk, v.last::timestamptz, v.vis::int, v.ord::int, v.avg::numeric, v.trend::int, v.rep::uuid, v_zone_eastern, v_manager_id, v.comp::jsonb, v.shelf
  FROM (VALUES
    ('50000000-0000-4000-8000-000000000080','Bright Mart','Ali Mohammed','0711 404 001','supermarket','A','active','Embakasi','Embakasi','Kimathi St 4',-1.3150,36.8990,79,'low',now()-interval '1 day',6,5,8900,15,'20000000-0000-4000-8000-000000000015','[]',null),
    ('50000000-0000-4000-8000-000000000081','Market Traders','Rose Akinyi','0711 404 002','duka','B','active','Kayole','Embakasi','Moi Ave 19',-1.2730,36.9050,64,'low',now()-interval '6 days',3,2,4100,-5,'20000000-0000-4000-8000-000000000015','[]',null),
    ('50000000-0000-4000-8000-000000000082','Top Kiosk','Patrick Omondi','0711 404 003','kiosk','C','churned','Dandora','Embakasi North','Jogoo Rd 27',-1.2515,36.8910,24,'high',now()-interval '45 days',0,0,0,-40,'20000000-0000-4000-8000-000000000015','[{"brand":"Pembe Flour","proximity":"same-street"}]','No Nice stock'),
    ('50000000-0000-4000-8000-000000000083','Buruburu Mart','Jane Muthoni','0711 404 004','supermarket','B','active','Buruburu','Makadara','Buruburu Phase 3',-1.2920,36.8750,73,'low',now()-interval '2 days',5,4,6200,12,'20000000-0000-4000-8000-000000000015','[]',null),
    ('50000000-0000-4000-8000-000000000084','Umoja Store','Mohammed Yusuf','0711 404 005','duka','B','active','Umoja','Embakasi','Umoja Inner Rd',-1.2800,36.9000,68,'low',now()-interval '3 days',4,3,4400,8,'20000000-0000-4000-8000-000000000015','[]',null),
    ('50000000-0000-4000-8000-000000000085','Kayole Duka','Joseph Karanja','0711 404 006','duka','C','active','Kayole','Embakasi','Kayole Spine Rd',-1.2750,36.9150,56,'medium',now()-interval '5 days',2,1,2600,-8,'20000000-0000-4000-8000-000000000015','[]',null),
    ('50000000-0000-4000-8000-000000000086','Donholm Mart','Teresa Nduta','0711 404 007','supermarket','B','active','Donholm','Embakasi','Donholm Rd 15',-1.2900,36.9150,72,'low',now()-interval '2 days',5,4,5800,10,'20000000-0000-4000-8000-000000000015','[]',null),
    ('50000000-0000-4000-8000-000000000087','Pipeline Store','Michael Otieno','0711 404 008','duka','C','active','Pipeline','Embakasi','Pipeline Rd 8',-1.3000,36.9200,60,'low',now()-interval '4 days',3,2,3200,5,'20000000-0000-4000-8000-000000000015','[]',null),
    ('50000000-0000-4000-8000-000000000088','Komarock Duka','Elizabeth Wafula','0711 404 009','kiosk','C','active','Komarock','Embakasi North','Komarock Rd 20',-1.2850,36.9250,52,'medium',now()-interval '7 days',1,1,2000,-10,'20000000-0000-4000-8000-000000000015','[{"brand":"Unga Ltd","proximity":"nearby"}]',null),
    ('50000000-0000-4000-8000-000000000089','Maili Saba Mart','Kevin Mwangi','0711 404 010','duka','C','active','Maili Saba','Embakasi North','Maili Saba Rd',-1.2750,36.9150,48,'medium',now()-interval '6 days',2,1,1800,-15,'20000000-0000-4000-8000-000000000015','[]',null),
    ('50000000-0000-4000-8000-000000000090','Utawala Store','Grace Njeri','0711 404 011','supermarket','A','active','Utawala','Embakasi','Utawala Rd 5',-1.2700,36.9500,82,'low',now()-interval '1 day',7,6,13200,20,'20000000-0000-4000-8000-000000000015','[]',null),
    ('50000000-0000-4000-8000-000000000091','Mihango Duka','Collins Wekesa','0711 404 012','kiosk','C','active','Mihango','Embakasi','Mihango Rd 3',-1.2800,36.9700,45,'high',now()-interval '10 days',1,0,0,-20,'20000000-0000-4000-8000-000000000015','[{"brand":"Pembe Flour","proximity":"same-street"}]','Low Nice stock'),
    ('50000000-0000-4000-8000-000000000092','Jogoo Road Mart','Brian Kamau','0711 404 013','supermarket','B','active','Jogoo Road','Makadara','Jogoo Rd 55',-1.2950,36.8550,76,'low',now()-interval '2 days',5,4,6800,14,'20000000-0000-4000-8000-000000000011','[]',null),
    ('50000000-0000-4000-8000-000000000093','Hamza Store','Lucy Mwangi','0711 404 014','duka','C','active','Hamza','Makadara','Hamza Rd 7',-1.2900,36.8800,58,'medium',now()-interval '4 days',3,2,2800,-5,'20000000-0000-4000-8000-000000000010','[]',null),
    ('50000000-0000-4000-8000-000000000094','Harambee Duka','Daniel Otieno','0711 404 015','kiosk','C','active','Harambee','Makadara','Harambee Ave 12',-1.2950,36.8850,50,'medium',now()-interval '5 days',2,1,2200,-8,'20000000-0000-4000-8000-000000000013','[]',null),
    ('50000000-0000-4000-8000-000000000095','Yandani Mart','Amina Wanjiku','0711 404 016','duka','C','prospect','Yandani','Embakasi','Yandani Rd 2',-1.3000,36.8900,50,'medium',null,0,0,0,0,'20000000-0000-4000-8000-000000000012','[]',null),
    ('50000000-0000-4000-8000-000000000096','Embakasi Store','Peter Njoroge','0711 404 017','wholesaler','A','active','Embakasi','Embakasi','Embakasi Rd 10',-1.3150,36.8990,87,'low',now()-interval '1 day',7,6,14800,25,'20000000-0000-4000-8000-000000000015','[]',null),
    ('50000000-0000-4000-8000-000000000097','Dandora Kiosk','Faith Mutua','0711 404 018','kiosk','C','at-risk','Dandora','Embakasi North','Dandora Phase 4',-1.2550,36.9050,38,'high',now()-interval '24 days',1,1,1500,-28,'20000000-0000-4000-8000-000000000018','[{"brand":"Unga Ltd","proximity":"same-street"}]','Low Nice stock')
  ) AS v(id, name, owner, phone, type, tier, status, ward, const, addr, lat, lng, hs, churn, last, vis, ord, avg, trend, rep, comp, shelf)
  ON CONFLICT (id) DO NOTHING;

  -- Kajiado zone: 16 retailers
  INSERT INTO public.retailers (id, name, owner_name, phone, business_type, tier, status, ward, constituency, zone, address, lat, lng, health_score, churn_risk, last_visit_at, visits30d, orders30d, avg_order_value, order_trend_pct, rep_id, territory_id, created_by, competitor_presence, shelf_note)
  SELECT v.id::uuid, v.name, v.owner, v.phone, v.type::public.outlet_type, v.tier::public.retailer_tier, v.status::public.retailer_status, v.ward, v.const, 'Kajiado', v.addr, v.lat::double precision, v.lng::double precision, v.hs::int, v.churn::public.churn_risk, v.last::timestamptz, v.vis::int, v.ord::int, v.avg::numeric, v.trend::int, v.rep::uuid, v_zone_kajiado, v_manager_id, v.comp::jsonb, v.shelf
  FROM (VALUES
    ('50000000-0000-4000-8000-000000000100','Blessed General','Jane Muthoni','0711 405 001','duka','B','active','Kibera','Langata','Kenyatta Ave 8',-1.3150,36.7870,70,'low',now()-interval '2 days',4,3,3800,10,'20000000-0000-4000-8000-000000000016','[]',null),
    ('50000000-0000-4000-8000-000000000101','Royal Wholesale','Mohammed Yusuf','0711 405 002','wholesaler','A','active','Langata','Langata','Koinange St 3',-1.3490,36.7460,86,'low',now()-interval '1 day',6,5,13500,22,'20000000-0000-4000-8000-000000000016','[{"brand":"Bidco Millers","proximity":"same-street"}]',null),
    ('50000000-0000-4000-8000-000000000102','Quick Corner','Agnes Wambui','0711 405 003','kiosk','C','prospect','Karen','Langata','Kipande Rd 22',-1.3250,36.7200,52,'medium',null,0,0,0,0,'20000000-0000-4000-8000-000000000016','[{"brand":"Mombasa Maize Millers","proximity":"nearby"}]',null),
    ('50000000-0000-4000-8000-000000000103','Kitengela Mart','Joseph Karanja','0711 405 004','supermarket','B','active','Kitengela','Kajiado East','Kitengela Rd 15',-1.4560,36.9650,74,'low',now()-interval '3 days',4,3,5200,8,'20000000-0000-4000-8000-000000000016','[]',null),
    ('50000000-0000-4000-8000-000000000104','Ongata Rongai Store','Teresa Nduta','0711 405 005','duka','B','active','Ongata Rongai','Kajiado North','Ongata Rongai Rd 8',-1.3900,36.7550,72,'low',now()-interval '2 days',5,4,4800,12,'20000000-0000-4000-8000-000000000016','[]',null),
    ('50000000-0000-4000-8000-000000000105','Ngong Duka','Michael Otieno','0711 405 006','duka','C','active','Ngong','Kajiado North','Ngong Rd 55',-1.3620,36.6560,58,'medium',now()-interval '5 days',2,1,2600,-5,'20000000-0000-4000-8000-000000000016','[]',null),
    ('50000000-0000-4000-8000-000000000106','Kiserian Mart','Elizabeth Wafula','0711 405 007','kiosk','C','active','Kiserian','Kajiado West','Kiserian Rd 4',-1.4220,36.6520,55,'medium',now()-interval '6 days',2,1,2200,-8,'20000000-0000-4000-8000-000000000016','[]',null),
    ('50000000-0000-4000-8000-000000000107','Karen Store','Kevin Mwangi','0711 405 008','supermarket','A','active','Karen','Kajiado North','Karen Rd 20',-1.3190,36.7110,88,'low',now()-interval '1 day',7,6,15600,28,'20000000-0000-4000-8000-000000000016','[]',null),
    ('50000000-0000-4000-8000-000000000108','Langata Duka','Grace Njeri','0711 405 009','duka','B','active','Langata','Langata','Langata South Rd',-1.3450,36.7400,70,'low',now()-interval '3 days',4,3,4200,8,'20000000-0000-4000-8000-000000000016','[]',null),
    ('50000000-0000-4000-8000-000000000109','Kibera Store','Collins Wekesa','0711 405 010','duka','C','active','Kibera','Langata','Kibera Rd 12',-1.3150,36.7870,52,'medium',now()-interval '7 days',2,1,2400,-10,'20000000-0000-4000-8000-000000000019','[]',null),
    ('50000000-0000-4000-8000-000000000110','Rongai Mart','Amina Wanjiku','0711 405 011','supermarket','B','active','Ongata Rongai','Kajiado North','Ongata Rongai Main',-1.3900,36.7550,76,'low',now()-interval '2 days',5,4,6400,14,'20000000-0000-4000-8000-000000000012','[]',null),
    ('50000000-0000-4000-8000-000000000111','Kitengela Store','Daniel Otieno','0711 405 012','duka','C','active','Kitengela','Kajiado East','Kitengela Town',-1.4560,36.9650,56,'medium',now()-interval '4 days',3,2,2800,-5,'20000000-0000-4000-8000-000000000013','[]',null),
    ('50000000-0000-4000-8000-000000000112','Karen Kiosk','Peter Njoroge','0711 405 013','kiosk','C','active','Karen','Kajiado North','Karen Cross Rd',-1.3190,36.7110,62,'low',now()-interval '5 days',2,1,2600,0,'20000000-0000-4000-8000-000000000015','[]',null),
    ('50000000-0000-4000-8000-000000000113','Ngong Town Mart','John Odhiambo','0711 405 014','duka','C','prospect','Ngong','Kajiado North','Ngong Town Centre',-1.3620,36.6560,50,'medium',null,0,0,0,0,'20000000-0000-4000-8000-000000000017','[]',null),
    ('50000000-0000-4000-8000-000000000114','Kajiado Town Store','Faith Mutua','0711 405 015','supermarket','B','churned','Kajiado Town','Kajiado North','Kajiado Rd 8',-1.3800,36.7000,32,'high',now()-interval '40 days',0,0,0,-35,'20000000-0000-4000-8000-000000000018','[{"brand":"Unga Ltd","proximity":"same-street"},{"brand":"Pembe Flour","proximity":"nearby"}]','No Nice stock — competitor dominant'),
    ('50000000-0000-4000-8000-000000000115','Isinya Mart','Sarah Kiprop','0711 405 016','kiosk','C','active','Isinya','Kajiado East','Isinya Rd 3',-1.5000,36.8500,46,'high',now()-interval '9 days',1,0,0,-22,'20000000-0000-4000-8000-000000000016','[{"brand":"Pembe Flour","proximity":"same-street"}]','Low Nice stock')
  ) AS v(id, name, owner, phone, type, tier, status, ward, const, addr, lat, lng, hs, churn, last, vis, ord, avg, trend, rep, comp, shelf)
  ON CONFLICT (id) DO NOTHING;

  -- South-Eastern zone: 18 retailers
  INSERT INTO public.retailers (id, name, owner_name, phone, business_type, tier, status, ward, constituency, zone, address, lat, lng, health_score, churn_risk, last_visit_at, visits30d, orders30d, avg_order_value, order_trend_pct, rep_id, territory_id, created_by, competitor_presence, shelf_note)
  SELECT v.id::uuid, v.name, v.owner, v.phone, v.type::public.outlet_type, v.tier::public.retailer_tier, v.status::public.retailer_status, v.ward, v.const, 'South-Eastern', v.addr, v.lat::double precision, v.lng::double precision, v.hs::int, v.churn::public.churn_risk, v.last::timestamptz, v.vis::int, v.ord::int, v.avg::numeric, v.trend::int, v.rep::uuid, v_zone_se, v_manager_id, v.comp::jsonb, v.shelf
  FROM (VALUES
    ('50000000-0000-4000-8000-000000000120','Evergreen Store','Joseph Karanja','0711 406 001','duka','B','active','Imara Daima','Makadara','Tom Mboya St 6',-1.3030,36.8720,73,'low',now()-interval '2 days',4,3,3600,8,'20000000-0000-4000-8000-000000000017','[]',null),
    ('50000000-0000-4000-8000-000000000121','Central Depot','Teresa Nduta','0711 406 002','wholesaler','A','active','Pipeline','Makadara','Ngong Rd 14',-1.3210,36.8940,81,'low',now()-interval '1 day',7,6,12800,19,'20000000-0000-4000-8000-000000000017','[]',null),
    ('50000000-0000-4000-8000-000000000122','Kilimani Mart','Michael Otieno','0711 406 003','supermarket','A','active','Viwandani','Makadara','Moi Ave 11',-1.3100,36.8860,77,'low',now()-interval '3 days',5,4,7600,14,'20000000-0000-4000-8000-000000000017','[]',null),
    ('50000000-0000-4000-8000-000000000123','Metro Kiosk','Elizabeth Wafula','0711 406 004','kiosk','C','at-risk','Mukuru kwa Njenga','Makadara','Jogoo Rd 31',-1.3120,36.9050,38,'high',now()-interval '24 days',2,1,1500,-28,'20000000-0000-4000-8000-000000000017','[{"brand":"Unga Ltd","proximity":"same-street"}]','Low Nice stock'),
    ('50000000-0000-4000-8000-000000000124','Imara Mart','Kevin Mwangi','0711 406 005','supermarket','B','active','Imara Daima','Makadara','Imara Daima Rd 20',-1.3030,36.8720,75,'low',now()-interval '2 days',5,4,6200,12,'20000000-0000-4000-8000-000000000017','[]',null),
    ('50000000-0000-4000-8000-000000000125','Pipeline Duka','Grace Njeri','0711 406 006','duka','C','active','Pipeline','Makadara','Pipeline Rd 25',-1.3210,36.8940,56,'medium',now()-interval '5 days',2,1,2400,-8,'20000000-0000-4000-8000-000000000017','[]',null),
    ('50000000-0000-4000-8000-000000000126','Viwandani Store','Collins Wekesa','0711 406 007','duka','B','active','Viwandani','Makadara','Viwandani Rd 8',-1.3100,36.8860,68,'low',now()-interval '3 days',4,3,4100,8,'20000000-0000-4000-8000-000000000019','[]',null),
    ('50000000-0000-4000-8000-000000000127','Mukuru Mart','Amina Wanjiku','0711 406 008','kiosk','C','active','Mukuru kwa Njenga','Makadara','Mukuru Rd 15',-1.3120,36.9050,48,'medium',now()-interval '6 days',2,1,2000,-12,'20000000-0000-4000-8000-000000000012','[]',null),
    ('50000000-0000-4000-8000-000000000128','South B Store','Daniel Otieno','0711 406 009','supermarket','B','active','South B','Makadara','South B Rd 10',-1.3100,36.8500,72,'low',now()-interval '2 days',5,4,5800,10,'20000000-0000-4000-8000-000000000013','[]',null),
    ('50000000-0000-4000-8000-000000000129','South C Duka','Peter Njoroge','0711 406 010','duka','C','active','South C','Makadara','South C Rd 22',-1.3150,36.8500,60,'low',now()-interval '4 days',3,2,3200,5,'20000000-0000-4000-8000-000000000015','[]',null),
    ('50000000-0000-4000-8000-000000000130','Donholm Store','John Odhiambo','0711 406 011','duka','B','active','Donholm','Embakasi','Donholm Rd 30',-1.2900,36.9150,70,'low',now()-interval '3 days',4,3,4400,8,'20000000-0000-4000-8000-000000000017','[]',null),
    ('50000000-0000-4000-8000-000000000131','Umoja Mart','Faith Mutua','0711 406 012','supermarket','A','active','Umoja','Embakasi','Umoja Rd 5',-1.2800,36.9000,84,'low',now()-interval '1 day',7,6,13200,22,'20000000-0000-4000-8000-000000000018','[]',null),
    ('50000000-0000-4000-8000-000000000132','Kayole Kiosk','Sarah Kiprop','0711 406 013','kiosk','C','active','Kayole','Embakasi','Kayole Rd 18',-1.2750,36.9150,52,'medium',now()-interval '7 days',1,1,2000,-10,'20000000-0000-4000-8000-000000000016','[]',null),
    ('50000000-0000-4000-8000-000000000133','Embakasi Mart','Brian Kamau','0711 406 014','supermarket','B','active','Embakasi','Embakasi','Embakasi Rd 25',-1.3150,36.8990,76,'low',now()-interval '2 days',5,4,6800,14,'20000000-0000-4000-8000-000000000011','[]',null),
    ('50000000-0000-4000-8000-000000000134','Makadara Store','Lucy Mwangi','0711 406 015','duka','C','active','Makadara','Makadara','Lungga Lungga Rd',-1.2900,36.8800,58,'medium',now()-interval '4 days',3,2,2800,-5,'20000000-0000-4000-8000-000000000010','[]',null),
    ('50000000-0000-4000-8000-000000000135','Buruburu Kiosk','Kevin Otieno','0711 406 016','kiosk','C','churned','Buruburu','Makadara','Buruburu Phase 1',-1.2920,36.8750,28,'high',now()-interval '42 days',0,0,0,-42,'20000000-0000-4000-8000-000000000001','[{"brand":"Pembe Flour","proximity":"same-street"}]','No Nice stock — competitor dominant'),
    ('50000000-0000-4000-8000-000000000136','Hamza Mart','Collins Wekesa','0711 406 017','duka','B','active','Hamza','Makadara','Hamza Rd 12',-1.2900,36.8800,66,'low',now()-interval '3 days',3,2,3600,5,'20000000-0000-4000-8000-000000000019','[]',null),
    ('50000000-0000-4000-8000-000000000137','Airport Duka','Faith Mutua','0711 406 018','kiosk','C','prospect','Embakasi','Embakasi','Airport Rd 5',-1.3150,36.9200,50,'medium',null,0,0,0,0,'20000000-0000-4000-8000-000000000018','[]',null)
  ) AS v(id, name, owner, phone, type, tier, status, ward, const, addr, lat, lng, hs, churn, last, vis, ord, avg, trend, rep, comp, shelf)
  ON CONFLICT (id) DO NOTHING;

  -- =====================================================================
  -- 3. SKU CATALOG
  -- =====================================================================

  INSERT INTO public.sku_catalog (sku, name, category, default_price_kes, unit, pack_size, active)
  VALUES
    ('NG-2',  'Nice Ugali 2kg',  'ugali', 205.00, 'kg', '2kg',  true),
    ('NG-5',  'Nice Ugali 5kg',  'ugali', 490.00, 'kg', '5kg',  true),
    ('NG-10', 'Nice Ugali 10kg', 'ugali', 950.00, 'kg', '10kg', true),
    ('WM-2',  'Nice Wimbi 2kg',  'wimbi', 235.00, 'kg', '2kg',  true),
    ('JR-2',  'Nice Jogoo 2kg',  'jogoo', 220.00, 'kg', '2kg',  true),
    ('MC-5',  'Nice Mchele 5kg', 'mchele', 620.00, 'kg', '5kg',  true)
  ON CONFLICT (sku) DO NOTHING;

  -- =====================================================================
  -- 4. COMPETITOR BRANDS
  -- =====================================================================

  INSERT INTO public.competitor_brands (name, segment, active)
  VALUES
    ('Unga Ltd',                  'flour', true),
    ('Pembe Flour',               'flour', true),
    ('Mombasa Maize Millers',     'flour', true),
    ('Kitui Flour',               'flour', true),
    ('Bidco Millers',             'flour', true)
  ON CONFLICT (name) DO NOTHING;

  -- =====================================================================
  -- 5. ROUTES + VISITS (7 days, all active reps)
  -- =====================================================================

  FOR v_day IN -6..0 LOOP
    FOR v_rec IN SELECT id, zone, wards FROM public.reps WHERE status = 'active' LOOP
      -- Not every rep runs every day (~80% chance)
      IF random() > 0.80 THEN CONTINUE; END IF;

      -- Pick 6-10 random retailers from this rep's zone
      SELECT array_agg(id) INTO v_retailer_ids
      FROM (
        SELECT id FROM public.retailers
        WHERE zone = v_rec.zone AND status != 'churned' AND rep_id = v_rec.id
        ORDER BY random()
        LIMIT 8
      ) sub;

      IF v_retailer_ids IS NULL OR array_length(v_retailer_ids, 1) < 3 THEN
        CONTINUE;
      END IF;

      v_stop_count := array_length(v_retailer_ids, 1);
      v_route_id := gen_random_uuid();
      v_start_min := 8 * 60 + (random() * 90)::int;
      v_acc_km := 0;
      v_acc_min := 0;

      -- Create route
      INSERT INTO public.routes (id, date, rep_id, zone, status, total_km, total_travel_min, start_time, end_time, created_by)
      VALUES (
        v_route_id,
        (current_date + v_day * interval '1 day')::date,
        v_rec.id,
        v_rec.zone,
        CASE WHEN v_day < 0 THEN 'completed'
             WHEN v_day = 0 THEN (CASE WHEN random() < 0.5 THEN 'in-progress' ELSE 'approved' END)::public.route_status
             ELSE 'draft' END,
        0, 0,
        make_time(v_start_min / 60, v_start_min % 60, 0),
        make_time((v_start_min + v_stop_count * 30) / 60, (v_start_min + v_stop_count * 30) % 60, 0),
        v_manager_id
      );

      -- Create route stops + visits
      FOR v_i IN 1..v_stop_count LOOP
        v_retailer_id := v_retailer_ids[v_i];
        v_km := CASE WHEN v_i = 1 THEN 1 + random() * 2
                     ELSE (random() * 3 + 0.5) END;
        v_min := greatest(5, round(v_km * 2.4)::int);
        v_acc_km := v_acc_km + v_km;
        v_acc_min := v_acc_min + v_min;

        v_h := (v_start_min + v_acc_min) / 60;
        v_m := (v_start_min + v_acc_min) % 60;

        INSERT INTO public.route_stops (route_id, retailer_id, position, planned_start, planned_end, visit_type, km_from_prev, minutes_from_prev, visited, visited_at)
        VALUES (
          v_route_id, v_retailer_id, v_i,
          make_time(v_h, v_m, 0),
          (make_time(v_h, v_m, 0) + interval '26 minutes')::time,
          CASE WHEN random() < 0.7 THEN 'retail' ELSE 'stock-check' END::public.visit_type,
          round(v_km * 10) / 10, v_min,
          v_day <= 0,
          CASE WHEN v_day <= 0 THEN (current_date + v_day * interval '1 day' + make_interval(hours := v_h, mins := v_m))::timestamptz ELSE null END
        );

        v_acc_min := v_acc_min + 26; -- visit duration

        -- Create visit for completed/in-progress routes
        IF v_day <= 0 AND random() > 0.12 THEN
          v_visit_id := gen_random_uuid();
          v_status := (CASE WHEN random() < 0.72 THEN 'completed'
                            WHEN random() < 0.5 THEN 'no-stock'
                            WHEN random() < 0.5 THEN 'closed'
                            ELSE 'cancelled' END);
          v_at := (current_date + v_day * interval '1 day' + make_interval(hours := v_h, mins := v_m))::timestamptz;

          INSERT INTO public.visits (id, retailer_id, rep_id, route_id, check_in_at, gps_lat, gps_lng, gps_accuracy, gps_verified, radius_m, status, duration_min, stock_captured, photo_count, order_placed, order_value, outcome, notes)
          SELECT v_visit_id, v_retailer_id, v_rec.id, v_route_id, v_at,
                 r.lat + (random() - 0.5) * 0.001,
                 r.lng + (random() - 0.5) * 0.001,
                 CASE WHEN v_status = 'completed' THEN 5 + random() * 15 ELSE 50 + random() * 200 END,
                 v_status = 'completed',
                 CASE WHEN v_status = 'completed' THEN (5 + random() * 15)::int ELSE (50 + random() * 200)::int END,
                 v_status::public.visit_status,
                 16 + (random() * 26)::int,
                 v_status = 'completed',
                 CASE WHEN v_status = 'completed' THEN (2 + random() * 4)::int ELSE 0 END,
                 v_status = 'completed' AND random() < 0.6,
                 CASE WHEN v_status = 'completed' AND random() < 0.6 THEN
                   (SELECT COALESCE(sum(sc.default_price_kes), 0) FROM unnest(ARRAY['NG-2','NG-5','WM-2']) AS u(sku)
                    JOIN public.sku_catalog sc ON sc.sku = u.sku
                    WHERE random() < 0.6) * (1 + random() * 2)::int
                 ELSE null END,
                 v_status::public.visit_status,
                 CASE WHEN v_status = 'no-stock' THEN 'No Nice stock — noted for replenishment.'
                      WHEN v_status = 'closed' THEN 'Outlet closed during visit window.'
                      ELSE null END
          FROM public.retailers r WHERE r.id = v_retailer_id;

          -- Visit items (for completed visits with stock)
          IF v_status = 'completed' AND random() < 0.7 THEN
            FOR v_sku, v_sku_name, v_sku_price IN
              SELECT sc.sku, sc.name, sc.default_price_kes
              FROM public.sku_catalog sc
              WHERE sc.active = true AND random() < 0.6
            LOOP
              v_shelf := CASE WHEN random() < 0.45 THEN 'full'
                              WHEN random() < 0.8 THEN 'low'
                              ELSE 'out' END;
              v_qty := CASE WHEN v_shelf = 'full' THEN (8 + random() * 32)::int
                            WHEN v_shelf = 'low' THEN (1 + random() * 6)::int
                            ELSE 0 END;

              INSERT INTO public.visit_items (visit_id, sku, name, qty, shelf, price)
              VALUES (v_visit_id, v_sku, v_sku_name, v_qty, v_shelf::public.shelf_level, v_sku_price);
            END LOOP;
          END IF;

          -- Stock observations for completed visits
          IF v_status = 'completed' AND random() < 0.6 THEN
            FOR v_sku, v_sku_name, v_sku_price IN
              SELECT sc.sku, sc.name, sc.default_price_kes FROM public.sku_catalog sc WHERE sc.active = true AND random() < 0.5
            LOOP
              INSERT INTO public.stock_observations (visit_id, retailer_id, rep_id, sku, name, qty, shelf, price, captured_at, created_by)
              VALUES (v_visit_id, v_retailer_id, v_rec.id, v_sku, v_sku_name,
                      CASE WHEN random() < 0.4 THEN (10 + random() * 30)::int
                           WHEN random() < 0.7 THEN (1 + random() * 8)::int ELSE 0 END,
                      CASE WHEN random() < 0.45 THEN 'full' WHEN random() < 0.8 THEN 'low' ELSE 'out' END::public.shelf_level,
                      v_sku_price, v_at, v_rec.id);
            END LOOP;
          END IF;

          -- Order intent (for completed visits with ~50% chance)
          IF v_status = 'completed' AND random() < 0.5 THEN
            v_order_id := gen_random_uuid();
            v_seq := v_seq + 1;

            INSERT INTO public.order_intents (id, retailer_id, rep_id, created_by, total, forward_status, created_at)
            SELECT v_order_id, v_retailer_id, v_rec.id, v_rec.id,
                   (SELECT COALESCE(sum(sc.default_price_kes), 0) FROM unnest(ARRAY['NG-2','NG-5']) AS u(sku)
                    JOIN public.sku_catalog sc ON sc.sku = u.sku WHERE random() < 0.6) * (1 + random() * 3)::int,
                   (CASE WHEN random() < 0.4 THEN 'sent' WHEN random() < 0.6 THEN 'acknowledged'
                         WHEN random() < 0.8 THEN 'pending' ELSE 'failed' END)::public.order_forward_status,
                   v_at;

            FOR v_sku, v_sku_name, v_sku_price IN
              SELECT sc.sku, sc.name, sc.default_price_kes FROM public.sku_catalog sc WHERE sc.active = true AND random() < 0.5
            LOOP
              INSERT INTO public.order_intent_items (order_intent_id, sku, name, quantity, price)
              VALUES (v_order_id, v_sku, v_sku_name, (2 + random() * 28)::int, v_sku_price);
            END LOOP;
          END IF;

          -- Competitor observation (~30% of completed visits)
          IF v_status = 'completed' AND random() < 0.3 THEN
            INSERT INTO public.competitor_observations (retailer_id, rep_id, visit_id, brand, activity, note, at)
            SELECT v_retailer_id, v_rec.id, v_visit_id,
                   (ARRAY['Unga Ltd','Pembe Flour','Mombasa Maize Millers','Bidco Millers'])[1 + (random() * 3)::int],
                   (ARRAY['price-drop','promo','new-listing','stockout','shelf-share'])[1 + (random() * 4)::int]::public.competitor_activity,
                   (ARRAY['Running 2kg @ KES 185 promotion.','Competitor restocked shelf.','New display at counter.','Retailer reported lower demand.'])[1 + (random() * 3)::int],
                   v_at;
          END IF;
        END IF;
      END LOOP;

      -- Update route totals
      UPDATE public.routes
      SET total_km = v_acc_km,
          total_travel_min = v_acc_min,
          end_time = make_time((v_start_min + v_acc_min) / 60, (v_start_min + v_acc_min) % 60, 0)
      WHERE id = v_route_id;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Expanded seed complete: ~120 retailers, 10 reps, 7 days of routes + visits.';
END $$;
