-- ============================================================
-- 006_corrective_actions.sql
-- ============================================================
--
-- WHAT THIS FILE DOES:
-- Creates two tables:
--   1. "corrective_actions" — tasks assigned to fix findings
--   2. "verifications"      — safety officer review records
--
-- WORKFLOW:
--   OPEN → ASSIGNED → IN_PROGRESS → PENDING_VERIFICATION → CLOSED
--
--   If verification is REJECTED → status goes back to IN_PROGRESS
--
-- RELATIONSHIPS:
--   Finding (1) ──► (many) Corrective Actions
--   Corrective Action (1) ──► (many) Verifications
--   Profile (assigned_to) ──► Corrective Actions
--
-- WHERE TO MODIFY LATER:
-- - Add "priority" field (e.g., HIGH, MEDIUM, LOW)
-- - Add "estimated_hours" for time tracking
-- - Add "attachments" for completion evidence
-- ============================================================

-- Custom type for corrective action status
CREATE TYPE public.action_status AS ENUM (
  'OPEN',
  'ASSIGNED',
  'IN_PROGRESS',
  'PENDING_VERIFICATION',
  'CLOSED'
);

-- Custom type for verification result
CREATE TYPE public.verification_result AS ENUM (
  'APPROVED',
  'REJECTED'
);

CREATE TABLE public.corrective_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Which finding this action addresses
  finding_id UUID NOT NULL REFERENCES public.findings(id),

  title TEXT NOT NULL,               -- e.g., "Clear emergency exit pathway"
  description TEXT,                   -- Detailed instructions

  -- Who is responsible for completing this action
  -- NULL when status is OPEN (not yet assigned)
  assigned_to UUID REFERENCES public.profiles(id),

  due_date DATE,                     -- When this should be completed by
  status public.action_status NOT NULL DEFAULT 'OPEN',
  completed_at TIMESTAMPTZ,          -- When the responsible person finished

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_actions_finding ON public.corrective_actions(finding_id);
CREATE INDEX idx_actions_assigned_to ON public.corrective_actions(assigned_to);
CREATE INDEX idx_actions_status ON public.corrective_actions(status);
CREATE INDEX idx_actions_due_date ON public.corrective_actions(due_date);

-- Auto-update updated_at
CREATE TRIGGER actions_updated_at
  BEFORE UPDATE ON public.corrective_actions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================================

CREATE TABLE public.verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Which corrective action was verified
  corrective_action_id UUID NOT NULL REFERENCES public.corrective_actions(id),

  -- Who performed the verification (must be a Safety Officer)
  verified_by UUID NOT NULL REFERENCES public.profiles(id),

  result public.verification_result NOT NULL,  -- APPROVED or REJECTED
  comments TEXT,                                -- Verification notes

  verified_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index: find all verifications for an action
CREATE INDEX idx_verifications_action ON public.verifications(corrective_action_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.corrective_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;

-- Admins and Safety Officers can read all corrective actions
CREATE POLICY "Admins and Safety Officers can read all actions"
  ON public.corrective_actions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'SAFETY_OFFICER')
    )
  );

-- Inspectors can read actions for their own findings
CREATE POLICY "Inspectors can read actions for own findings"
  ON public.corrective_actions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.findings f
      WHERE f.id = finding_id AND f.created_by = auth.uid()
    )
  );

-- Responsible persons can read their assigned actions
CREATE POLICY "Responsible persons can read assigned actions"
  ON public.corrective_actions FOR SELECT
  USING (assigned_to = auth.uid());

-- Inspectors and Safety Officers can create actions
CREATE POLICY "Inspectors and Safety Officers can create actions"
  ON public.corrective_actions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('INSPECTOR', 'SAFETY_OFFICER', 'ADMIN')
    )
  );

-- Responsible persons can update their assigned actions
CREATE POLICY "Responsible persons can update assigned actions"
  ON public.corrective_actions FOR UPDATE
  USING (assigned_to = auth.uid());

-- Admins and Safety Officers can update any action
CREATE POLICY "Admins and Safety Officers can update any action"
  ON public.corrective_actions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'SAFETY_OFFICER')
    )
  );

-- Verifications: readable by involved parties
CREATE POLICY "Users can read verifications for accessible actions"
  ON public.verifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.corrective_actions ca
      WHERE ca.id = corrective_action_id AND (
        ca.assigned_to = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND role IN ('ADMIN', 'SAFETY_OFFICER')
        )
      )
    )
  );

-- Only Safety Officers can create verifications
CREATE POLICY "Safety Officers can create verifications"
  ON public.verifications FOR INSERT
  WITH CHECK (
    verified_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'SAFETY_OFFICER'
    )
  );
