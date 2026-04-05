import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import {
  date,
  pgTable,
  time,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { clinics } from './clinics.schema';
import { doctors } from './doctors.schema';

export const doctorAvailabilityOverrides = pgTable(
  'doctor_availability_overrides',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    clinic_id: uuid('clinic_id')
      .notNull()
      .references(() => clinics.id, { onDelete: 'cascade' }),
    doctor_id: uuid('doctor_id')
      .notNull()
      .references(() => doctors.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    type: varchar('type', { length: 20 }).notNull(),
    start_time: time('start_time'),
    end_time: time('end_time'),
    reason: varchar('reason', { length: 255 }),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    doctorDateTypeUnique: unique(
      'doctor_availability_overrides_doctor_date_type_unique',
    ).on(table.doctor_id, table.date, table.type),
  }),
);

export type DoctorAvailabilityOverride = InferSelectModel<
  typeof doctorAvailabilityOverrides
>;
export type NewDoctorAvailabilityOverride = InferInsertModel<
  typeof doctorAvailabilityOverrides
>;
