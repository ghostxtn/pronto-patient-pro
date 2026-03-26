import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq } from 'drizzle-orm';
import * as crypto from 'crypto';
import { clinicEncryptionKeys } from '../database/schema';

@Injectable()
export class EncryptionService implements OnModuleInit {
  private masterKey: Buffer;
  private dekCache: Map<string, { dek: Buffer; version: number }> = new Map();

  constructor(
    @Inject('DRIZZLE') private readonly db: any,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    const masterKeyHex = this.configService.getOrThrow<string>('ENCRYPTION_MASTER_KEY');
    if (masterKeyHex.length !== 64) {
      throw new Error('ENCRYPTION_MASTER_KEY must be 64 hex characters (32 bytes)');
    }
    this.masterKey = Buffer.from(masterKeyHex, 'hex');
  }

  private encryptDek(dek: Buffer): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.masterKey, iv);
    const encrypted = Buffer.concat([cipher.update(dek), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted.toString('hex');
  }

  private decryptDek(encryptedDek: string): Buffer {
    const [ivHex, authTagHex, dataHex] = encryptedDek.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const data = Buffer.from(dataHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.masterKey, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(data), decipher.final()]);
  }

  async getDek(clinicId: string): Promise<{ dek: Buffer; version: number }> {
    const cached = this.dekCache.get(clinicId);
    if (cached) return cached;

    const [row] = await this.db
      .select()
      .from(clinicEncryptionKeys)
      .where(eq(clinicEncryptionKeys.clinic_id, clinicId))
      .limit(1);

    if (row) {
      const dek = this.decryptDek(row.encrypted_dek);
      const entry = { dek, version: row.dek_version };
      this.dekCache.set(clinicId, entry);
      return entry;
    }

    const newDek = crypto.randomBytes(32);
    const encryptedDek = this.encryptDek(newDek);

    await this.db.insert(clinicEncryptionKeys).values({
      clinic_id: clinicId,
      encrypted_dek: encryptedDek,
      dek_version: 1,
      is_active: true,
    });

    const entry = { dek: newDek, version: 1 };
    this.dekCache.set(clinicId, entry);
    return entry;
  }

  async encrypt(plaintext: string, clinicId: string): Promise<string> {
    if (!plaintext) return plaintext;
    const { dek, version } = await this.getDek(clinicId);
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', dek, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `v${version}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  async decrypt(encryptedValue: string, clinicId: string): Promise<string> {
    if (!encryptedValue || !encryptedValue.startsWith('v')) return encryptedValue;
    const { dek } = await this.getDek(clinicId);
    const parts = encryptedValue.split(':');
    const iv = Buffer.from(parts[1], 'hex');
    const authTag = Buffer.from(parts[2], 'hex');
    const data = Buffer.from(parts[3], 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', dek, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  }

  async hmac(value: string, clinicId: string): Promise<string> {
    if (!value) return value;
    const { dek } = await this.getDek(clinicId);
    return crypto.createHmac('sha256', dek).update(value).digest('hex');
  }

  async encryptFields(
    data: Record<string, any>,
    fields: string[],
    clinicId: string,
  ): Promise<Record<string, any>> {
    const result = { ...data };
    for (const field of fields) {
      if (result[field] !== undefined && result[field] !== null) {
        result[field] = await this.encrypt(result[field], clinicId);
      }
    }
    return result;
  }

  async decryptFields(
    data: Record<string, any>,
    fields: string[],
    clinicId: string,
  ): Promise<Record<string, any>> {
    const result = { ...data };
    for (const field of fields) {
      if (result[field] !== undefined && result[field] !== null) {
        result[field] = await this.decrypt(result[field], clinicId);
      }
    }
    return result;
  }
}
