import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
    await this.client.set(`refresh:${userId}`, token, 'EX', ttlSeconds);
  }

  async getRefreshToken(userId: string): Promise<string | null> {
    return this.client.get(`refresh:${userId}`);
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

  async onModuleDestroy(): Promise<void> {
    this.client.disconnect();
  }
}
