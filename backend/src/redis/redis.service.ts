import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    this.client = new Redis(redisUrl ?? '');
  }

  async setRefreshToken(
    userId: string,
    token: string,
    ttlSeconds: number,
  ): Promise<void> {
    await this.client.set(
      `refresh:${userId}`,
      this.hashToken(token),
      'EX',
      ttlSeconds,
    );
  }

  async compareRefreshToken(userId: string, token: string): Promise<boolean> {
    const stored = await this.client.get(`refresh:${userId}`);
    if (!stored) return false;
    return stored === this.hashToken(token);
  }

  async deleteRefreshToken(userId: string): Promise<void> {
    await this.client.del(`refresh:${userId}`);
  }

  async setValue(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.client.set(key, value, 'EX', ttlSeconds);
  }

  async getValue(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async deleteValue(key: string): Promise<void> {
    await this.client.del(key);
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async onModuleDestroy(): Promise<void> {
    this.client.disconnect();
  }
}
