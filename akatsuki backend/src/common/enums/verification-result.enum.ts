/**
 * ===== verification-result.enum.ts =====
 *
 * WHAT: The result of a safety officer's verification of a corrective action.
 *
 * APPROVED — the corrective action is satisfactory → action moves to CLOSED
 * REJECTED — the corrective action is NOT satisfactory → action reopens to IN_PROGRESS
 */

export enum VerificationResult {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}
