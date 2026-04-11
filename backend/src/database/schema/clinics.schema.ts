import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const clinics = pgTable('clinics', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  domain: varchar('domain', { length: 255 }).notNull().unique(),
  logo_url: varchar('logo_url', { length: 500 }),
  default_appointment_duration: integer('default_appointment_duration')
    .default(30)
    .notNull(),
  appointment_approval_mode: varchar('appointment_approval_mode', { length: 20 })
    .default('manual')
    .notNull(),
  max_booking_days_ahead: integer('max_booking_days_ahead').default(60).notNull(),
  cancellation_hours_before: integer('cancellation_hours_before').default(24).notNull(),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  address: text('address'),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export type Clinic = InferSelectModel<typeof clinics>;
export type NewClinic = InferInsertModel<typeof clinics>;
