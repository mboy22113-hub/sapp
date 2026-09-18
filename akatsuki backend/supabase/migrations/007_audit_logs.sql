-- ============================================================
-- 007_audit_logs.sql
-- ============================================================
--
-- WHAT THIS FILE DOES:
-- Creates the "audit_logs" table that records important actions.
-- This is a write-only table — rows are never updated or deleted.
--
-- WHAT GETS LOGGED:
--   INSPECTION_CREATED, INSPECTION_COMPLETED,
--   FINDING_CREATED, FINDING_UPDATED,
--   EVIDENCE_UPLOADED, EVIDENCE_DELETED,
--   ACTION_CREATED, ACTION_ASSIGNED, ACTION_COMPLETED,
--   ACTION_VERIFIED, ACTION_REOPENED
--
-- IMPORTANT:
--   Never log passwords, tokens, or secrets in the metadata column.
--
-- WHERE TO MODIFY LATER:
-- - Add "ip_address" column for security auditing
-- - Add partitioning by date for large-scale deployments
-- - Add retention policy to auto-delete old logs
-- ============================================================

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who performed the action
  user_id UUID NOT NULL REFERENCES public.profiles(id),

  -- What action was performed (e.g., "INSPECTION_CREATED")
  action TEXT NOT NULL,

  -- What type of entity was affected (e.g., "inspection", "finding")
  entity_type TEXT NOT NULL,

  -- ID of the affected entity
  entity_id UUID NOT NULL,

  -- Additional context as JSON (e.g., {"old_status": "OPEN", "new_status": "CLOSED"})
  -- NEVER store passwords or tokens here
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for querying audit logs
CREATE INDEX idx_audit_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_action ON public.audit_logs(action);
CREATE INDEX idx_audit_created_at ON public.audit_logs(created_at);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Admins can read audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- The backend (service role) inserts audit logs — no user-facing insert policy needed.
-- The service role bypasses RLS, so audit logging always works from the backend.
