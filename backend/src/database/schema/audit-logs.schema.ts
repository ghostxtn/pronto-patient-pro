import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import {
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { clinics } from './clinics.schema';
import { users } from './users.schema';

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  clinic_id: uuid('clinic_id').notNull().references(() => clinics.id),
  user_id: uuid('user_id').references(() => users.id),
  user_role: varchar('user_role', { length: 20 }),
  action: varchar('action', { length: 50 }).notNull(),
  entity: varchar('entity', { length: 50 }).notNull(),
  entity_id: uuid('entity_id'),
  metadata: jsonb('metadata'),
  ip_address: varchar('ip_address', { length: 45 }),
  request_id: uuid('request_id'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export type AuditLog = InferSelectModel<typeof auditLogs>;
export type NewAuditLog = InferInsertModel<typeof auditLogs>;
