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

export const specializations = pgTable('specializations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  imageUrl: varchar('image_url', { length: 500 }),
  clinic_id: uuid('clinic_id')
    .notNull()
    .references(() => clinics.id),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export type Specialization = InferSelectModel<typeof specializations>;
export type NewSpecialization = InferInsertModel<typeof specializations>;
