-- ============================================================
-- 005_evidence.sql
-- ============================================================
--
-- WHAT THIS FILE DOES:
-- Creates the "evidence" table that stores METADATA about uploaded files.
-- The actual files (images, PDFs) are stored in Supabase Storage.
-- This table only stores: file name, type, size, and the storage path.
--
-- FILE UPLOAD FLOW:
--   1. Frontend requests a signed upload URL from the backend
--   2. Backend generates the URL via Supabase Storage
--   3. Frontend uploads the file directly to Supabase Storage
--   4. Frontend sends the storage path to the backend
--   5. Backend saves this metadata row in PostgreSQL
--
-- SUPPORTED FILE TYPES:
--   JPEG, PNG, WEBP, PDF
--
-- STORAGE PATH FORMAT:
--   inspections/{inspectionId}/findings/{findingId}/{uniqueFileName}
--
-- WHERE TO MODIFY LATER:
-- - Add "thumbnail_path" for image previews
-- - Add "description" or "caption" field
-- - Add virus scan status column
-- ============================================================

CREATE TABLE public.evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Which finding this evidence belongs to
  finding_id UUID NOT NULL REFERENCES public.findings(id) ON DELETE CASCADE,

  file_name TEXT NOT NULL,          -- Original file name (e.g., "crack_photo.jpg")
  file_type TEXT NOT NULL,          -- MIME type (e.g., "image/jpeg", "application/pdf")
  file_size INTEGER NOT NULL,       -- Size in bytes
  storage_path TEXT NOT NULL,       -- Path in Supabase Storage bucket

  -- Who uploaded this file
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index: quickly find all evidence for a finding
CREATE INDEX idx_evidence_finding ON public.evidence(finding_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;

-- Users can read evidence for findings they can access
CREATE POLICY "Users can read evidence for accessible findings"
  ON public.evidence FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.findings f
      WHERE f.id = finding_id AND (
        f.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND role IN ('ADMIN', 'SAFETY_OFFICER')
        )
      )
    )
  );

-- Inspectors can upload evidence for their own findings
CREATE POLICY "Inspectors can upload evidence"
  ON public.evidence FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.findings f
      WHERE f.id = finding_id AND f.created_by = auth.uid()
    )
  );

-- Inspectors can delete their own evidence
CREATE POLICY "Inspectors can delete own evidence"
  ON public.evidence FOR DELETE
  USING (uploaded_by = auth.uid());

-- Admins can delete any evidence
CREATE POLICY "Admins can delete any evidence"
  ON public.evidence FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );
