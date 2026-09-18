/**
 * ===== finding-status.enum.ts =====
 *
 * WHAT: Lifecycle states for a finding (a safety issue discovered during inspection).
 *
 * FLOW: OPEN → IN_PROGRESS → RESOLVED → CLOSED
 *
 * OPEN         — newly created finding
 * IN_PROGRESS  — corrective action is being worked on
 * RESOLVED     — corrective action completed, awaiting verification
 * CLOSED       — verified and closed by safety officer
 */

export enum FindingStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}
