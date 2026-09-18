/**
 * ===== answer.enum.ts =====
 *
 * WHAT: Possible answers for checklist items during an inspection.
 *
 * PASS — the checklist item is satisfied
 * FAIL — the checklist item is NOT satisfied (may generate a finding)
 * NA   — not applicable to this inspection
 */

export enum Answer {
  PASS = 'PASS',
  FAIL = 'FAIL',
  NA = 'NA',
}
