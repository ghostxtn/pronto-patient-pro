import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import {
  boolean,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { clinics } from './clinics.schema';
import { specializations } from './specializations.schema';
import { users } from './users.schema';

export const doctors = pgTable('doctors', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id')
    .notNull()
    .references(() => users.id),
  specialization_id: uuid('specialization_id').references(
    () => specializations.id,
  ),
  clinic_id: uuid('clinic_id')
    .notNull()
    .references(() => clinics.id),
  title: varchar('title', { length: 20 }),
  bio: text('bio'),
  phone: varchar('phone', { length: 20 }),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export type Doctor = InferSelectModel<typeof doctors>;
export type NewDoctor = InferInsertModel<typeof doctors>;
