/**
 * Server-side audit logging.
 * ponytail: append to a DB table; future: stream to external audit service.
 */
export type AuditAction =
  | "auth.sign_in"
  | "auth.sign_up"
  | "auth.sign_out"
  | "user.verify"
  | "user.reject"
  | "appointment.create"
  | "appointment.cancel"
  | "prescription.create"
  | "prescription.dispense"
  | "ptv.approve"
  | "ptv.flag"
  | "ptv.reject"
  | "order.create"
  | "order.update_status"
  | "record.create"
  | "equipment.update"
  | "ward.update"
  | "medicine.create";

export interface AuditEntry {
  action: AuditAction;
  userId?: string;
  targetId?: string;
  details?: Record<string, unknown>;
  ip?: string;
}

/**
 * Write an audit event to the database.
 * ponytail: fire-and-forget; callers should not await in hot paths.
 */
export async function auditLog(entry: AuditEntry): Promise<void> {
  try {
    // ponytail: no AuditLog table yet — use console.log until schema is added.
    // When ready, uncomment: await db.auditLog.create({ data: { ...entry, createdAt: new Date() } });
    console.log("[audit]", JSON.stringify(entry));
  } catch {
    // Never let audit failures break the request path
  }
}

/**
 * Get audit logs (admin only). ponytail: no pagination yet.
 */
export async function getAuditLogs(limit = 100) {
  // ponytail: return empty until AuditLog model is added to schema
  return [];
}
