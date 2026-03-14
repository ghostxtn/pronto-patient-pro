import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import {
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { appointments } from './appointments.schema';
import { clinics } from './clinics.schema';
import { doctors } from './doctors.schema';

export const appointmentNotes = pgTable('appointment_notes', {
  id: uuid('id').defaultRandom().primaryKey(),
  appointment_id: uuid('appointment_id')
    .notNull()
    .references(() => appointments.id),
  clinic_id: uuid('clinic_id')
    .notNull()
    .references(() => clinics.id),
  doctor_id: uuid('doctor_id')
    .notNull()
    .references(() => doctors.id),
  diagnosis: text('diagnosis'),
  treatment: text('treatment'),
  prescription: text('prescription'),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export type AppointmentNote = InferSelectModel<typeof appointmentNotes>;
export type NewAppointmentNote = InferInsertModel<typeof appointmentNotes>;
