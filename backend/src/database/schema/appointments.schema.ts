import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import {
  date,
  pgTable,
  text,
  time,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { clinics } from './clinics.schema';
import { doctors } from './doctors.schema';
import { patients } from './patients.schema';

export const appointments = pgTable('appointments', {
  id: uuid('id').defaultRandom().primaryKey(),
  clinic_id: uuid('clinic_id')
    .notNull()
    .references(() => clinics.id),
  doctor_id: uuid('doctor_id')
    .notNull()
    .references(() => doctors.id),
  patient_id: uuid('patient_id')
    .notNull()
    .references(() => patients.id),
  appointment_date: date('appointment_date').notNull(),
  start_time: time('start_time').notNull(),
  end_time: time('end_time').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  type: varchar('type', { length: 50 }),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export type Appointment = InferSelectModel<typeof appointments>;
export type NewAppointment = InferInsertModel<typeof appointments>;
