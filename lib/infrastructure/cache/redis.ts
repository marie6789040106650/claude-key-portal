import { Redis } from '@upstash/redis'

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
}

// 使用Upstash REST API
export const redis =
  globalForRedis.redis ??
  new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis
