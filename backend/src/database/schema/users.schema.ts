import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import {
  boolean,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { clinics } from './clinics.schema';

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull(),
    password_hash: varchar('password_hash', { length: 255 }),
    first_name: varchar('first_name', { length: 100 }).notNull(),
    last_name: varchar('last_name', { length: 100 }).notNull(),
    role: varchar('role', { length: 20 }).notNull().default('staff'),
    clinic_id: uuid('clinic_id')
      .notNull()
      .references(() => clinics.id),
    is_active: boolean('is_active').default(true),
    google_id: varchar('google_id', { length: 255 }).unique(),
    avatar_url: varchar('avatar_url', { length: 500 }),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    usersEmailClinicUnique: unique('users_email_clinic_id_unique').on(
      table.email,
      table.clinic_id,
    ),
  }),
);

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
