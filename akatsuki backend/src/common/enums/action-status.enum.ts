/**
 * ===== action-status.enum.ts =====
 *
 * WHAT: Lifecycle states for a corrective action.
 *
 * FLOW: OPEN → ASSIGNED → IN_PROGRESS → PENDING_VERIFICATION → CLOSED
 *
 * OPEN                  — action created but not yet assigned
 * ASSIGNED              — assigned to a responsible person
 * IN_PROGRESS           — responsible person is working on it
 * PENDING_VERIFICATION  — submitted for safety officer review
 * CLOSED                — verified and closed
 *
 * A safety officer can REJECT a verification, which reopens the action
 * back to IN_PROGRESS.
 */

export enum ActionStatus {
  OPEN = 'OPEN',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  CLOSED = 'CLOSED',
}
