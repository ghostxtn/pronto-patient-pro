import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { clinics } from '../../database/schema/clinics.schema';

@Injectable()
export class TenantResolverService {
  constructor(@Inject('DRIZZLE') private readonly db: any) {}

  async findClinicByDomain(domain: string) {
    const [clinic] = await this.db
      .select()
      .from(clinics)
      .where(eq(clinics.domain, domain))
      .limit(1);

    return clinic;
  }
}
