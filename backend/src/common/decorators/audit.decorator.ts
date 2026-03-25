import { SetMetadata } from '@nestjs/common';

export interface AuditMetadata {
  action: string;
  entity: string;
}

export const AUDIT_KEY = 'audit_metadata';
export const Audit = (action: string, entity: string) =>
  SetMetadata(AUDIT_KEY, { action, entity } as AuditMetadata);

export const NO_AUDIT_KEY = 'no_audit';
export const NoAudit = () => SetMetadata(NO_AUDIT_KEY, true);
