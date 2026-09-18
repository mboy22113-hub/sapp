/**
 * ===== role.enum.ts =====
 *
 * WHAT: Defines the 4 user roles in SafeTrack.
 *
 * WHERE USED: Auth guards check this to decide if a user can access an endpoint.
 *
 * TO MODIFY: Add a new role here (e.g., VIEWER) and update the guards/controllers
 * that reference roles.
 */

export enum Role {
  /** Full system access — manage users, checklists, view everything */
  ADMIN = 'ADMIN',

  /** Creates inspections, submits responses, creates findings */
  INSPECTOR = 'INSPECTOR',

  /** Verifies corrective actions, views compliance dashboard */
  SAFETY_OFFICER = 'SAFETY_OFFICER',

  /** Views and updates assigned corrective actions */
  RESPONSIBLE_PERSON = 'RESPONSIBLE_PERSON',
}
