import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import {
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { clinics } from './clinics.schema';
import { users } from './users.schema';

export const trustedDevices = pgTable(
  'trusted_devices',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id')
      .notNull()
      .references(() => users.id),
    clinic_id: uuid('clinic_id')
      .notNull()
      .references(() => clinics.id),
    token_hash: varchar('token_hash', { length: 255 }).notNull(),
    user_agent_hash: varchar('user_agent_hash', { length: 255 }),
    expires_at: timestamp('expires_at').notNull(),
    last_used_at: timestamp('last_used_at').defaultNow().notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    trustedDevicesTokenHashUnique: uniqueIndex('trusted_devices_token_hash_unique').on(
      table.token_hash,
    ),
    trustedDevicesUserIdIdx: index('trusted_devices_user_id_idx').on(table.user_id),
    trustedDevicesClinicIdIdx: index('trusted_devices_clinic_id_idx').on(table.clinic_id),
  }),
);

export type TrustedDevice = InferSelectModel<typeof trustedDevices>;
export type NewTrustedDevice = InferInsertModel<typeof trustedDevices>;
