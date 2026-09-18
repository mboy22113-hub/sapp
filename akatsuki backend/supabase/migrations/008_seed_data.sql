-- ============================================================
-- 008_seed_data.sql
-- ============================================================
--
-- WHAT THIS FILE DOES:
-- Inserts sample development data so you can test the API
-- and see the dashboard in action.
--
-- ⚠️  IMPORTANT:
-- This seed data uses FIXED UUIDs so references work.
-- In production, UUIDs are auto-generated.
-- Do NOT run this in production.
--
-- This script assumes you have ALREADY created 4 users in
-- Supabase Auth (via the dashboard or API) and have their UUIDs.
--
-- INSTRUCTIONS:
-- 1. Create 4 users in Supabase Auth Dashboard → Authentication → Users
-- 2. Replace the placeholder UUIDs below with the actual auth user IDs
-- 3. Run this script in the SQL Editor
-- ============================================================

-- ============================================================
-- STEP 1: Replace these with your actual Supabase Auth user IDs
-- ============================================================
-- After creating users in Supabase Auth, paste their IDs here:

-- User 1: Admin (e.g., admin@safetrack.dev)
-- User 2: Inspector (e.g., inspector@safetrack.dev)
-- User 3: Safety Officer (e.g., safety@safetrack.dev)
-- User 4: Responsible Person (e.g., responsible@safetrack.dev)

-- UNCOMMENT AND EDIT the block below after creating auth users:

/*
-- ============================================================
-- STEP 2: Insert profiles
-- ============================================================

INSERT INTO public.profiles (id, full_name, email, role, department) VALUES
  ('REPLACE-WITH-ADMIN-UUID',        'Alex Admin',      'admin@safetrack.dev',       'ADMIN',              'Management'),
  ('REPLACE-WITH-INSPECTOR-UUID',    'Ian Inspector',   'inspector@safetrack.dev',   'INSPECTOR',          'Operations'),
  ('REPLACE-WITH-SAFETY-UUID',       'Sara Safety',     'safety@safetrack.dev',      'SAFETY_OFFICER',     'Safety'),
  ('REPLACE-WITH-RESPONSIBLE-UUID',  'Riley Repair',    'responsible@safetrack.dev', 'RESPONSIBLE_PERSON', 'Maintenance');

-- ============================================================
-- STEP 3: Insert a sample checklist
-- ============================================================

INSERT INTO public.checklists (id, name, description, created_by) VALUES
  ('a0000000-0000-0000-0000-000000000001',
   'Fire Safety Inspection',
   'Standard fire safety checklist for all facilities',
   'REPLACE-WITH-ADMIN-UUID');

-- ============================================================
-- STEP 4: Insert checklist items
-- ============================================================

INSERT INTO public.checklist_items (id, checklist_id, question, description, category, sort_order) VALUES
  ('b0000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000001',
   'Are emergency exits accessible?',
   'Check that all emergency exits are clear of obstructions',
   'Emergency Exits', 1),

  ('b0000000-0000-0000-0000-000000000002',
   'a0000000-0000-0000-0000-000000000001',
   'Are fire extinguishers available?',
   'Verify fire extinguishers are present in designated locations',
   'Fire Equipment', 2),

  ('b0000000-0000-0000-0000-000000000003',
   'a0000000-0000-0000-0000-000000000001',
   'Are fire extinguishers inspected and current?',
   'Check inspection tags are up to date (within last 12 months)',
   'Fire Equipment', 3),

  ('b0000000-0000-0000-0000-000000000004',
   'a0000000-0000-0000-0000-000000000001',
   'Is emergency signage visible?',
   'Verify exit signs, fire alarm pull stations, and extinguisher signs are visible',
   'Signage', 4),

  ('b0000000-0000-0000-0000-000000000005',
   'a0000000-0000-0000-0000-000000000001',
   'Is the fire alarm system operational?',
   'Test or verify the fire alarm panel shows normal status',
   'Fire Alarm', 5);

-- ============================================================
-- STEP 5: Insert sample inspections
-- ============================================================

INSERT INTO public.inspections (id, site_name, department, checklist_id, inspector_id, status, started_at, completed_at) VALUES
  ('c0000000-0000-0000-0000-000000000001',
   'Factory A', 'Production',
   'a0000000-0000-0000-0000-000000000001',
   'REPLACE-WITH-INSPECTOR-UUID',
   'COMPLETED',
   now() - INTERVAL '30 days',
   now() - INTERVAL '30 days'),

  ('c0000000-0000-0000-0000-000000000002',
   'Factory A', 'Production',
   'a0000000-0000-0000-0000-000000000001',
   'REPLACE-WITH-INSPECTOR-UUID',
   'COMPLETED',
   now() - INTERVAL '15 days',
   now() - INTERVAL '15 days'),

  ('c0000000-0000-0000-0000-000000000003',
   'Warehouse B', 'Logistics',
   'a0000000-0000-0000-0000-000000000001',
   'REPLACE-WITH-INSPECTOR-UUID',
   'IN_PROGRESS',
   now() - INTERVAL '2 days',
   NULL);

-- ============================================================
-- STEP 6: Insert sample responses
-- ============================================================

-- Inspection 1 responses (all items)
INSERT INTO public.inspection_responses (inspection_id, checklist_item_id, answer, observation) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'FAIL', 'Emergency exit blocked by storage boxes'),
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'PASS', NULL),
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'PASS', NULL),
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'PASS', NULL),
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 'PASS', NULL);

-- Inspection 2 responses
INSERT INTO public.inspection_responses (inspection_id, checklist_item_id, answer, observation) VALUES
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'FAIL', 'Same exit still blocked — recurring issue'),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'PASS', NULL),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', 'FAIL', 'Extinguisher tag expired'),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', 'PASS', NULL),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000005', 'NA', 'Alarm system being replaced');

-- ============================================================
-- STEP 7: Insert sample findings
-- ============================================================

INSERT INTO public.findings (id, inspection_id, title, description, likelihood, severity, risk_score, risk_level, status, created_by) VALUES
  -- Finding 1: Emergency exit blocked (HIGH risk, recurring)
  ('d0000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000001',
   'Emergency exit blocked',
   'Emergency exit in Production area is blocked by storage boxes',
   4, 4, 16, 'HIGH', 'OPEN',
   'REPLACE-WITH-INSPECTOR-UUID'),

  -- Finding 2: Same issue found again (recurring)
  ('d0000000-0000-0000-0000-000000000002',
   'c0000000-0000-0000-0000-000000000002',
   'Emergency exit blocked',
   'Same emergency exit still blocked — recurring issue not resolved',
   4, 5, 20, 'CRITICAL', 'OPEN',
   'REPLACE-WITH-INSPECTOR-UUID'),

  -- Finding 3: Expired extinguisher
  ('d0000000-0000-0000-0000-000000000003',
   'c0000000-0000-0000-0000-000000000002',
   'Fire extinguisher inspection expired',
   'Extinguisher in Section B has an expired inspection tag',
   3, 3, 9, 'MEDIUM', 'IN_PROGRESS',
   'REPLACE-WITH-INSPECTOR-UUID');

-- ============================================================
-- STEP 8: Insert sample corrective actions
-- ============================================================

INSERT INTO public.corrective_actions (id, finding_id, title, description, assigned_to, due_date, status) VALUES
  ('e0000000-0000-0000-0000-000000000001',
   'd0000000-0000-0000-0000-000000000001',
   'Clear emergency exit pathway',
   'Remove all storage boxes from emergency exit area and mark with floor tape',
   'REPLACE-WITH-RESPONSIBLE-UUID',
   (CURRENT_DATE - INTERVAL '5 days')::DATE,  -- Overdue!
   'ASSIGNED'),

  ('e0000000-0000-0000-0000-000000000002',
   'd0000000-0000-0000-0000-000000000003',
   'Schedule fire extinguisher inspection',
   'Contact fire safety vendor to inspect and recertify extinguisher',
   'REPLACE-WITH-RESPONSIBLE-UUID',
   (CURRENT_DATE + INTERVAL '7 days')::DATE,
   'IN_PROGRESS');

*/

-- ============================================================
-- HOW TO USE THIS SEED FILE:
-- ============================================================
-- 1. Go to your Supabase Dashboard → Authentication → Users
-- 2. Create 4 users with these emails:
--      admin@safetrack.dev
--      inspector@safetrack.dev
--      safety@safetrack.dev
--      responsible@safetrack.dev
--    (use any password, e.g., "Password123!")
--
-- 3. Copy each user's UUID from the dashboard
--
-- 4. In the SQL block above:
--    - Uncomment everything between /* and */
--    - Replace ALL occurrences of 'REPLACE-WITH-ADMIN-UUID'
--      with the actual UUID of the admin user
--    - Do the same for INSPECTOR, SAFETY, and RESPONSIBLE
--
-- 5. Run the entire file in Supabase SQL Editor
--
-- 6. You should now have:
--    - 4 user profiles
--    - 1 checklist with 5 items
--    - 3 inspections (2 completed, 1 in progress)
--    - Responses for the 2 completed inspections
--    - 3 findings (1 HIGH, 1 CRITICAL, 1 MEDIUM)
--    - 2 corrective actions (1 overdue)
-- ============================================================
