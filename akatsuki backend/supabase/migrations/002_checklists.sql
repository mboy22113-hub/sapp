-- ============================================================
-- 002_checklists.sql
-- ============================================================
--
-- WHAT THIS FILE DOES:
-- Creates two tables:
--   1. "checklists"      — a named checklist (e.g., "Fire Safety Inspection")
--   2. "checklist_items"  — individual questions within a checklist
--
-- RELATIONSHIP:
--   Checklist (1) ──► (many) Checklist Items
--
-- DATA FLOW:
--   Admin creates a checklist → adds items to it →
--   Inspector selects this checklist when starting an inspection
--
-- WHERE TO MODIFY LATER:
-- - Add "is_active" boolean to soft-delete checklists
-- - Add "version" column to track checklist revisions
-- - Add "category" to checklists for grouping
-- ============================================================

CREATE TABLE public.checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,

  -- Who created this checklist (references profiles)
  created_by UUID NOT NULL REFERENCES public.profiles(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger to auto-update updated_at
CREATE TRIGGER checklists_updated_at
  BEFORE UPDATE ON public.checklists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================================

CREATE TABLE public.checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Which checklist this item belongs to.
  -- ON DELETE CASCADE: if the checklist is deleted, its items are too.
  checklist_id UUID NOT NULL REFERENCES public.checklists(id) ON DELETE CASCADE,

  question TEXT NOT NULL,          -- e.g., "Is the emergency exit accessible?"
  description TEXT,                -- Optional extra detail about the question
  category TEXT,                   -- e.g., "Fire Safety", "Electrical"
  sort_order INTEGER NOT NULL DEFAULT 0,  -- Controls display order

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index: quickly find all items for a checklist, sorted
CREATE INDEX idx_checklist_items_checklist
  ON public.checklist_items(checklist_id, sort_order);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read checklists
CREATE POLICY "Authenticated users can read checklists"
  ON public.checklists FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can read checklist items"
  ON public.checklist_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only admins can create/update/delete checklists
CREATE POLICY "Admins can insert checklists"
  ON public.checklists FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can update checklists"
  ON public.checklists FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can delete checklists"
  ON public.checklists FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Only admins can manage checklist items
CREATE POLICY "Admins can insert checklist items"
  ON public.checklist_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can update checklist items"
  ON public.checklist_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can delete checklist items"
  ON public.checklist_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );
