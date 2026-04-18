import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import {
  boolean,
  date,
  integer,
  pgTable,
  time,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { clinics } from './clinics.schema';
import { doctors } from './doctors.schema';

export const doctorAvailability = pgTable('doctor_availability', {
  id: uuid('id').defaultRandom().primaryKey(),
  doctor_id: uuid('doctor_id')
    .notNull()
    .references(() => doctors.id),
  clinic_id: uuid('clinic_id')
    .notNull()
    .references(() => clinics.id),
  day_of_week: integer('day_of_week'),
  specific_date: date('specific_date'),
  start_time: time('start_time').notNull(),
  end_time: time('end_time').notNull(),
  slot_duration: integer('slot_duration').notNull().default(30),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export type DoctorAvailability = InferSelectModel<typeof doctorAvailability>;
export type NewDoctorAvailability = InferInsertModel<typeof doctorAvailability>;
