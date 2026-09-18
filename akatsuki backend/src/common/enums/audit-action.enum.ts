/**
 * ===== audit-action.enum.ts =====
 *
 * WHAT: The types of actions we log in the audit trail.
 *
 * PURPOSE: Every important action in SafeTrack gets logged so admins
 * can see who did what and when. This enum lists all tracked actions.
 *
 * TO MODIFY: When you add a new important action to the system,
 * add a new entry here and call auditService.log() in the relevant service.
 */

export enum AuditAction {
  INSPECTION_CREATED = 'INSPECTION_CREATED',
  INSPECTION_COMPLETED = 'INSPECTION_COMPLETED',
  FINDING_CREATED = 'FINDING_CREATED',
  FINDING_UPDATED = 'FINDING_UPDATED',
  EVIDENCE_UPLOADED = 'EVIDENCE_UPLOADED',
  EVIDENCE_DELETED = 'EVIDENCE_DELETED',
  ACTION_CREATED = 'ACTION_CREATED',
  ACTION_ASSIGNED = 'ACTION_ASSIGNED',
  ACTION_COMPLETED = 'ACTION_COMPLETED',
  ACTION_VERIFIED = 'ACTION_VERIFIED',
  ACTION_REOPENED = 'ACTION_REOPENED',
}
