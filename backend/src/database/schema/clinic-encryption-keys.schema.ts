import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { clinics } from './clinics.schema';

export const clinicEncryptionKeys = pgTable('clinic_encryption_keys', {
  id: uuid('id').defaultRandom().primaryKey(),
  clinic_id: uuid('clinic_id').notNull().references(() => clinics.id).unique(),
  encrypted_dek: text('encrypted_dek').notNull(),
  dek_version: integer('dek_version').notNull().default(1),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  rotated_at: timestamp('rotated_at'),
});

export type ClinicEncryptionKey = InferSelectModel<typeof clinicEncryptionKeys>;
export type NewClinicEncryptionKey = InferInsertModel<typeof clinicEncryptionKeys>;
