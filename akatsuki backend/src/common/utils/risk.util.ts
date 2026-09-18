/**
 * ===== risk.util.ts =====
 *
 * WHAT THIS FILE DOES:
 * Contains the pure mathematical functions for risk matrix evaluation:
 *   Risk Score = Likelihood × Severity
 *
 * It maps the computed score to a standardized RiskLevel enum:
 *   1 – 4   → LOW
 *   5 – 9   → MEDIUM
 *   10 – 16 → HIGH
 *   17 – 25 → CRITICAL
 *
 * IMPORTANT FUNCTIONS:
 * - calculateRiskScore(likelihood, severity) → Returns integer between 1 and 25.
 * - calculateRiskLevel(score)                → Returns RiskLevel enum.
 *
 * DATA FLOW:
 * Inspector inputs likelihood (1-5) and severity (1-5)
 *   ↓
 * FindingsService calls calculateRiskScore & calculateRiskLevel
 *   ↓
 * Computed values saved in database
 *
 * WHERE TO MODIFY LATER:
 * - If your safety team changes risk thresholds or moves to a 3x3 or 5x5 matrix,
 *   update the threshold logic in calculateRiskLevel.
 */

import { BadRequestException } from '@nestjs/common';
import { RiskLevel } from '../enums/risk-level.enum';

export function calculateRiskScore(likelihood: number, severity: number): number {
  if (
    !Number.isInteger(likelihood) ||
    likelihood < 1 ||
    likelihood > 5 ||
    !Number.isInteger(severity) ||
    severity < 1 ||
    severity > 5
  ) {
    throw new BadRequestException(
      'Likelihood and Severity must both be integers between 1 and 5.',
    );
  }

  return likelihood * severity;
}

export function calculateRiskLevel(score: number): RiskLevel {
  if (score <= 4) {
    return RiskLevel.LOW;
  }
  if (score <= 9) {
    return RiskLevel.MEDIUM;
  }
  if (score <= 16) {
    return RiskLevel.HIGH;
  }
  return RiskLevel.CRITICAL;
}
