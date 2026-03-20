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
import { patients } from './patients.schema';

export const patientClinicalNotes = pgTable('patient_clinical_notes', {
  id: uuid('id').defaultRandom().primaryKey(),
  clinic_id: uuid('clinic_id')
    .notNull()
    .references(() => clinics.id),
  patient_id: uuid('patient_id')
    .notNull()
    .references(() => patients.id, { onDelete: 'cascade' }),
  doctor_id: uuid('doctor_id')
    .notNull()
    .references(() => doctors.id, { onDelete: 'cascade' }),
  appointment_id: uuid('appointment_id').references(() => appointments.id, {
    onDelete: 'set null',
  }),
  diagnosis: text('diagnosis'),
  treatment: text('treatment'),
  prescription: text('prescription'),
  notes: text('notes'),
  expires_at: timestamp('expires_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export type PatientClinicalNote = InferSelectModel<typeof patientClinicalNotes>;
export type NewPatientClinicalNote = InferInsertModel<typeof patientClinicalNotes>;
