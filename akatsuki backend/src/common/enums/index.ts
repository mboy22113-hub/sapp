/**
 * ===== index.ts =====
 *
 * Barrel file — re-exports all enums from one place.
 * This lets other files do:
 *   import { Role, RiskLevel } from '../common/enums';
 * instead of importing from each individual file.
 */

export { Role } from './role.enum';
export { InspectionStatus } from './inspection-status.enum';
export { Answer } from './answer.enum';
export { RiskLevel } from './risk-level.enum';
export { FindingStatus } from './finding-status.enum';
export { ActionStatus } from './action-status.enum';
export { VerificationResult } from './verification-result.enum';
export { AuditAction } from './audit-action.enum';
