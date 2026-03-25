import * as dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(__dirname, '../../.env') });

if (!process.env.ENCRYPTION_MASTER_KEY) {
  dotenv.config({ path: resolve(__dirname, '../../../.env') });
}

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import * as crypto from 'crypto';
import {
  patients,
  patientClinicalNotes,
  appointmentNotes,
  clinicEncryptionKeys,
} from '../database/schema';

const MASTER_KEY = Buffer.from(process.env.ENCRYPTION_MASTER_KEY!, 'hex');

function encryptWithMaster(data: Buffer): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', MASTER_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted.toString('hex');
}

function decryptWithMaster(encryptedStr: string): Buffer {
  const [ivHex, authTagHex, dataHex] = encryptedStr.split(':');
  const decipher = crypto.createDecipheriv('aes-256-gcm', MASTER_KEY, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]);
}

const dekCache = new Map<string, { dek: Buffer; version: number }>();

async function getDek(db: any, clinicId: string): Promise<{ dek: Buffer; version: number }> {
  const cached = dekCache.get(clinicId);
  if (cached) return cached;

  const [row] = await db
    .select()
    .from(clinicEncryptionKeys)
    .where(eq(clinicEncryptionKeys.clinic_id, clinicId))
    .limit(1);

  if (row) {
    const dek = decryptWithMaster(row.encrypted_dek);
    const entry = { dek, version: row.dek_version };
    dekCache.set(clinicId, entry);
    return entry;
  }

  const newDek = crypto.randomBytes(32);
  const encryptedDek = encryptWithMaster(newDek);
  await db.insert(clinicEncryptionKeys).values({
    clinic_id: clinicId,
    encrypted_dek: encryptedDek,
    dek_version: 1,
    is_active: true,
  });
  const entry = { dek: newDek, version: 1 };
  dekCache.set(clinicId, entry);
  return entry;
}

function encrypt(plaintext: string, dek: Buffer, version: number): string {
  if (!plaintext) return plaintext;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', dek, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `v${version}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

function hmac(value: string, dek: Buffer): string {
  if (!value) return value;
  return crypto.createHmac('sha256', dek).update(value).digest('hex');
}

function isAlreadyEncrypted(value: string | null): boolean {
  if (!value) return false;
  return /^v\d+:[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/.test(value);
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  console.log('Starting encryption migration...');

  const PATIENT_FIELDS = ['first_name', 'last_name', 'tc_no', 'phone', 'email', 'address'];
  const allPatients = await db.select().from(patients);
  console.log(`Found ${allPatients.length} patients`);

  for (const patient of allPatients) {
    if (isAlreadyEncrypted(patient.first_name)) {
      console.log(`  Patient ${patient.id} already encrypted, skipping`);
      continue;
    }

    const { dek, version } = await getDek(db, patient.clinic_id);
    const updateData: Record<string, any> = {};

    for (const field of PATIENT_FIELDS) {
      const value = (patient as any)[field];
      if (value) {
        updateData[field] = encrypt(value, dek, version);
      }
    }

    if (patient.tc_no) {
      updateData.tc_no_hash = hmac(patient.tc_no, dek);
    }

    if (Object.keys(updateData).length > 0) {
      await db.update(patients).set(updateData).where(eq(patients.id, patient.id));
      console.log(`  Encrypted patient ${patient.id}`);
    }
  }

  const NOTE_FIELDS = ['diagnosis', 'treatment', 'prescription', 'notes'];
  const allNotes = await db.select().from(patientClinicalNotes);
  console.log(`Found ${allNotes.length} clinical notes`);

  for (const note of allNotes) {
    if (
      isAlreadyEncrypted(note.diagnosis) ||
      isAlreadyEncrypted(note.treatment) ||
      isAlreadyEncrypted(note.prescription) ||
      isAlreadyEncrypted(note.notes)
    ) {
      console.log(`  Clinical note ${note.id} already encrypted, skipping`);
      continue;
    }

    const { dek, version } = await getDek(db, note.clinic_id);
    const updateData: Record<string, any> = {};

    for (const field of NOTE_FIELDS) {
      const value = (note as any)[field];
      if (value) {
        updateData[field] = encrypt(value, dek, version);
      }
    }

    if (Object.keys(updateData).length > 0) {
      await db
        .update(patientClinicalNotes)
        .set(updateData)
        .where(eq(patientClinicalNotes.id, note.id));
      console.log(`  Encrypted clinical note ${note.id}`);
    }
  }

  const allAppNotes = await db.select().from(appointmentNotes);
  console.log(`Found ${allAppNotes.length} appointment notes`);

  for (const note of allAppNotes) {
    if (
      isAlreadyEncrypted(note.diagnosis) ||
      isAlreadyEncrypted(note.treatment) ||
      isAlreadyEncrypted(note.prescription) ||
      isAlreadyEncrypted(note.notes)
    ) {
      console.log(`  Appointment note ${note.id} already encrypted, skipping`);
      continue;
    }

    const { dek, version } = await getDek(db, note.clinic_id);
    const updateData: Record<string, any> = {};

    for (const field of NOTE_FIELDS) {
      const value = (note as any)[field];
      if (value) {
        updateData[field] = encrypt(value, dek, version);
      }
    }

    if (Object.keys(updateData).length > 0) {
      await db
        .update(appointmentNotes)
        .set(updateData)
        .where(eq(appointmentNotes.id, note.id));
      console.log(`  Encrypted appointment note ${note.id}`);
    }
  }

  console.log('Encryption migration complete!');
  await pool.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
