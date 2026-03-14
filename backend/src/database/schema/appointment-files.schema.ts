import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import {
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { appointments } from './appointments.schema';
import { clinics } from './clinics.schema';
import { users } from './users.schema';

export const appointmentFiles = pgTable('appointment_files', {
  id: uuid('id').defaultRandom().primaryKey(),
  appointment_id: uuid('appointment_id')
    .notNull()
    .references(() => appointments.id),
  clinic_id: uuid('clinic_id')
    .notNull()
    .references(() => clinics.id),
  uploaded_by: uuid('uploaded_by')
    .notNull()
    .references(() => users.id),
  file_name: varchar('file_name', { length: 255 }).notNull(),
  file_path: varchar('file_path', { length: 500 }).notNull(),
  file_size: integer('file_size').notNull(),
  mime_type: varchar('mime_type', { length: 100 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export type AppointmentFile = InferSelectModel<typeof appointmentFiles>;
export type NewAppointmentFile = InferInsertModel<typeof appointmentFiles>;
