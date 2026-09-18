-- ============================================================
-- 003_inspections.sql
-- ============================================================
--
-- WHAT THIS FILE DOES:
-- Creates two tables:
--   1. "inspections"          — an inspection session at a site
--   2. "inspection_responses" — answers to each checklist item
--
-- RELATIONSHIPS:
--   Checklist (1) ──► (many) Inspections
--   User/Inspector (1) ──► (many) Inspections
--   Inspection (1) ──► (many) Inspection Responses
--   Checklist Item (1) ──► (many) Inspection Responses
--
-- DATA FLOW:
--   Inspector creates inspection (DRAFT)
--     → starts answering checklist items (IN_PROGRESS)
--     → submits all responses
--     → marks inspection complete (COMPLETED)
--
-- WHERE TO MODIFY LATER:
-- - Add "location" or GPS coordinates
-- - Add "weather_conditions" for outdoor inspections
-- - Add "photos" for general site photos (not finding-specific)
-- ============================================================

-- Custom type for inspection status
CREATE TYPE public.inspection_status AS ENUM (
  'DRAFT',
  'IN_PROGRESS',
  'COMPLETED'
);

-- Custom type for checklist item answers
CREATE TYPE public.inspection_answer AS ENUM (
  'PASS',
  'FAIL',
  'NA'
);

CREATE TABLE public.inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  site_name TEXT NOT NULL,           -- e.g., "Factory A"
  department TEXT,                    -- e.g., "Production"

  -- Which checklist was used for this inspection
  checklist_id UUID NOT NULL REFERENCES public.checklists(id),

  -- Who performed the inspection
  inspector_id UUID NOT NULL REFERENCES public.profiles(id),

  status public.inspection_status NOT NULL DEFAULT 'DRAFT',

  started_at TIMESTAMPTZ,            -- When the inspector began
  completed_at TIMESTAMPTZ,          -- When they finished

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_inspections_inspector ON public.inspections(inspector_id);
CREATE INDEX idx_inspections_status ON public.inspections(status);
CREATE INDEX idx_inspections_checklist ON public.inspections(checklist_id);

-- Auto-update updated_at
CREATE TRIGGER inspections_updated_at
  BEFORE UPDATE ON public.inspections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================================

CREATE TABLE public.inspection_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Which inspection this response belongs to
  inspection_id UUID NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,

  -- Which checklist question was answered
  checklist_item_id UUID NOT NULL REFERENCES public.checklist_items(id),

  answer public.inspection_answer NOT NULL,  -- PASS, FAIL, or NA
  observation TEXT,                            -- Optional notes (e.g., "Exit blocked by boxes")

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Each checklist item should only be answered once per inspection
  UNIQUE(inspection_id, checklist_item_id)
);

-- Index: quickly find all responses for an inspection
CREATE INDEX idx_responses_inspection ON public.inspection_responses(inspection_id);

-- Auto-update updated_at
CREATE TRIGGER responses_updated_at
  BEFORE UPDATE ON public.inspection_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_responses ENABLE ROW LEVEL SECURITY;

-- Inspectors can read their own inspections
CREATE POLICY "Inspectors can read own inspections"
  ON public.inspections FOR SELECT
  USING (inspector_id = auth.uid());

-- Admins and Safety Officers can read all inspections
CREATE POLICY "Admins and Safety Officers can read all inspections"
  ON public.inspections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'SAFETY_OFFICER')
    )
  );

-- Inspectors can create inspections (as themselves)
CREATE POLICY "Inspectors can create inspections"
  ON public.inspections FOR INSERT
  WITH CHECK (
    inspector_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'INSPECTOR'
    )
  );

-- Inspectors can update their own inspections
CREATE POLICY "Inspectors can update own inspections"
  ON public.inspections FOR UPDATE
  USING (inspector_id = auth.uid());

-- Responses: same pattern — inspectors manage their own
CREATE POLICY "Users can read responses for accessible inspections"
  ON public.inspection_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.inspections
      WHERE id = inspection_id AND (
        inspector_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND role IN ('ADMIN', 'SAFETY_OFFICER')
        )
      )
    )
  );

CREATE POLICY "Inspectors can insert responses for own inspections"
  ON public.inspection_responses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.inspections
      WHERE id = inspection_id AND inspector_id = auth.uid()
    )
  );

CREATE POLICY "Inspectors can update responses for own inspections"
  ON public.inspection_responses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.inspections
      WHERE id = inspection_id AND inspector_id = auth.uid()
    )
  );
