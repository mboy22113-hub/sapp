-- ============================================================
-- 004_findings.sql
-- ============================================================
--
-- WHAT THIS FILE DOES:
-- Creates the "findings" table — safety issues discovered during inspections.
--
-- RISK CALCULATION:
--   risk_score = likelihood × severity
--
--   Both are integers from 1–5.
--   The backend calculates risk_score (never trust the frontend).
--
--   risk_level is derived from risk_score:
--     1–4   → LOW
--     5–9   → MEDIUM
--     10–16 → HIGH
--     17–25 → CRITICAL
--
-- RELATIONSHIPS:
--   Inspection (1) ──► (many) Findings
--   User (creator) (1) ──► (many) Findings
--
-- WHERE TO MODIFY LATER:
-- - Add "location_in_site" for pinpointing where the issue was found
-- - Add "category" for grouping findings (e.g., "Electrical", "Fire")
-- - Add "photos" array for quick inline photos
-- ============================================================

-- Custom type for finding status
CREATE TYPE public.finding_status AS ENUM (
  'OPEN',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED'
);

-- Custom type for risk level
CREATE TYPE public.risk_level AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL'
);

CREATE TABLE public.findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Which inspection produced this finding
  inspection_id UUID NOT NULL REFERENCES public.inspections(id),

  title TEXT NOT NULL,              -- e.g., "Emergency exit blocked"
  description TEXT,                  -- Detailed description

  -- Risk assessment (1–5 scale each)
  likelihood INTEGER NOT NULL CHECK (likelihood BETWEEN 1 AND 5),
  severity INTEGER NOT NULL CHECK (severity BETWEEN 1 AND 5),

  -- Computed by backend: likelihood × severity
  risk_score INTEGER NOT NULL CHECK (risk_score BETWEEN 1 AND 25),

  -- Derived from risk_score using threshold table
  risk_level public.risk_level NOT NULL,

  status public.finding_status NOT NULL DEFAULT 'OPEN',

  -- Who created this finding
  created_by UUID NOT NULL REFERENCES public.profiles(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_findings_inspection ON public.findings(inspection_id);
CREATE INDEX idx_findings_status ON public.findings(status);
CREATE INDEX idx_findings_risk_level ON public.findings(risk_level);
CREATE INDEX idx_findings_created_by ON public.findings(created_by);

-- For recurring findings detection: search by normalized title + site
CREATE INDEX idx_findings_title ON public.findings(LOWER(title));

-- Auto-update updated_at
CREATE TRIGGER findings_updated_at
  BEFORE UPDATE ON public.findings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.findings ENABLE ROW LEVEL SECURITY;

-- Inspectors can read findings they created
CREATE POLICY "Inspectors can read own findings"
  ON public.findings FOR SELECT
  USING (created_by = auth.uid());

-- Admins and Safety Officers can read all findings
CREATE POLICY "Admins and Safety Officers can read all findings"
  ON public.findings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'SAFETY_OFFICER')
    )
  );

-- Inspectors can create findings
CREATE POLICY "Inspectors can create findings"
  ON public.findings FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'INSPECTOR'
    )
  );

-- Inspectors can update their own findings; admins/safety officers can update any
CREATE POLICY "Inspectors can update own findings"
  ON public.findings FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Admins and Safety Officers can update findings"
  ON public.findings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'SAFETY_OFFICER')
    )
  );
