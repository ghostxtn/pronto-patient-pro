import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import {
  boolean,
  date,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { clinics } from './clinics.schema';
import { users } from './users.schema';

export const patients = pgTable('patients', {
  id: uuid('id').defaultRandom().primaryKey(),
  clinic_id: uuid('clinic_id')
    .notNull()
    .references(() => clinics.id),
  user_id: uuid('user_id').references(() => users.id),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  tc_no: text('tc_no'),
  tc_no_hash: text('tc_no_hash'),
  birth_date: date('birth_date'),
  gender: varchar('gender', { length: 10 }),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  notes: text('notes'),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export type Patient = InferSelectModel<typeof patients>;
export type NewPatient = InferInsertModel<typeof patients>;
