/**
 * ===== inspection-status.enum.ts =====
 *
 * WHAT: The lifecycle states of an inspection.
 *
 * FLOW: DRAFT → IN_PROGRESS → COMPLETED
 *
 * An inspection starts as DRAFT when created.
 * It moves to IN_PROGRESS when the inspector starts filling responses.
 * It becomes COMPLETED when all responses are submitted and the inspector
 * hits the "complete" endpoint.
 */

export enum InspectionStatus {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}
