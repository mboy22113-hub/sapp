/**
 * ===== risk-level.enum.ts =====
 *
 * WHAT: Risk categories calculated from likelihood × severity.
 *
 * THRESHOLDS (configurable for this MVP):
 *   1–4    → LOW
 *   5–9    → MEDIUM
 *   10–16  → HIGH
 *   17–25  → CRITICAL
 *
 * These are MVP defaults — NOT universal legal standards.
 */

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}
