import { Request } from 'express';
import { Clinic } from '../../database/schema/clinics.schema';

export interface TenantRequest extends Request {
  tenant?: {
    clinicId: string;
    clinic: Clinic;
  };
  tenantId?: string;
  user?: {
    clinicId?: string;
    role?: string;
  };
}
