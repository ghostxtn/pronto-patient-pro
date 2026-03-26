import { Inject, Injectable } from '@nestjs/common';
import { auditLogs } from '../database/schema';

export interface AuditEntry {
  clinicId: string;
  userId?: string;
  userRole?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  requestId?: string;
}

@Injectable()
export class AuditService {
  constructor(@Inject('DRIZZLE') private readonly db: any) {}

  async log(entry: AuditEntry): Promise<void> {
    try {
      await this.db.insert(auditLogs).values({
        clinic_id: entry.clinicId,
        user_id: entry.userId || null,
        user_role: entry.userRole || null,
        action: entry.action,
        entity: entry.entity,
        entity_id: entry.entityId || null,
        metadata: entry.metadata || null,
        ip_address: entry.ipAddress || null,
        request_id: entry.requestId || null,
      });
    } catch (error) {
      console.error('[AuditService] Failed to write audit log:', error);
    }
  }

  async logBatch(entries: AuditEntry[]): Promise<void> {
    try {
      await this.db.insert(auditLogs).values(
        entries.map((entry) => ({
          clinic_id: entry.clinicId,
          user_id: entry.userId || null,
          user_role: entry.userRole || null,
          action: entry.action,
          entity: entry.entity,
          entity_id: entry.entityId || null,
          metadata: entry.metadata || null,
          ip_address: entry.ipAddress || null,
          request_id: entry.requestId || null,
        })),
      );
    } catch (error) {
      console.error('[AuditService] Failed to write batch audit logs:', error);
    }
  }
}
