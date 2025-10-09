/**
 * Redis缓存测试
 *
 * 测试内容：
 * 1. 缓存设置和获取
 * 2. TTL过期机制
 * 3. 缓存键命名规范
 * 4. 并发请求处理
 * 5. 缓存失效策略
 * 6. Redis不可用时的降级处理
 */

import { RedisClient } from '@/lib/infrastructure/cache/redis-client'
import { CacheManager } from '@/lib/infrastructure/cache/cache-manager'

describe('RedisClient', () => {
  let redisClient: RedisClient

  beforeEach(() => {
    redisClient = new RedisClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    })
  })

  afterEach(async () => {
    await redisClient.disconnect()
  })

  describe('基础连接', () => {
    it('应该成功连接到Redis', async () => {
      const isConnected = await redisClient.isConnected()
      expect(isConnected).toBe(true)
    })

    it('应该能够处理连接失败', async () => {
      const badClient = new RedisClient({
        host: 'invalid-host',
        port: 9999,
      })

      // 应该不抛出错误，而是优雅降级
      const isConnected = await badClient.isConnected()
      expect(isConnected).toBe(false)

      await badClient.disconnect()
    })
  })

  describe('缓存设置和获取', () => {
    it('应该能够设置和获取字符串值', async () => {
      const key = 'test:string'
      const value = 'hello world'

      await redisClient.set(key, value, 60)
      const result = await redisClient.get(key)

      expect(result).toBe(value)
    })

    it('应该能够设置和获取对象值', async () => {
      const key = 'test:object'
      const value = { id: 1, name: 'test', data: [1, 2, 3] }

      await redisClient.set(key, value, 60)
      const result = await redisClient.get<typeof value>(key)

      expect(result).toEqual(value)
    })

    it('应该在键不存在时返回null', async () => {
      const result = await redisClient.get('non-existent-key')
      expect(result).toBeNull()
    })

    it('应该能够删除缓存键', async () => {
      const key = 'test:delete'
      const value = 'delete me'

      await redisClient.set(key, value, 60)
      expect(await redisClient.get(key)).toBe(value)

      await redisClient.delete(key)
      expect(await redisClient.get(key)).toBeNull()
    })
  })

  describe('TTL过期机制', () => {
    it('应该在TTL过期后自动删除键', async () => {
      const key = 'test:ttl:expire'
      const value = 'will expire'

      // 设置1秒TTL
      await redisClient.set(key, value, 1)
      expect(await redisClient.get(key)).toBe(value)

      // 等待1.5秒
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // 应该已过期
      expect(await redisClient.get(key)).toBeNull()
    }, 3000)

    it('应该能够获取剩余TTL', async () => {
      const key = 'test:ttl:check'
      const value = 'check ttl'

      await redisClient.set(key, value, 60)
      const ttl = await redisClient.getTTL(key)

      expect(ttl).toBeGreaterThan(50) // 应该接近60秒
      expect(ttl).toBeLessThanOrEqual(60)
    })

    it('应该为不存在的键返回-2', async () => {
      const ttl = await redisClient.getTTL('non-existent-key')
      expect(ttl).toBe(-2)
    })
  })

  describe('缓存键命名规范', () => {
    it('应该支持命名空间模式', async () => {
      const keys = [
        'crs:dashboard:user123',
        'crs:keys:user123',
        'stats:usage:user123',
        'stats:trend:key456',
      ]

      for (const key of keys) {
        await redisClient.set(key, `value-${key}`, 60)
        const result = await redisClient.get(key)
        expect(result).toBe(`value-${key}`)
      }
    })

    it('应该能够清除特定命名空间的所有键', async () => {
      // 设置多个键
      await redisClient.set('test:namespace:key1', 'value1', 60)
      await redisClient.set('test:namespace:key2', 'value2', 60)
      await redisClient.set('other:namespace:key3', 'value3', 60)

      // 清除 test:namespace 的所有键
      await redisClient.deletePattern('test:namespace:*')

      // test:namespace 的键应该被删除
      expect(await redisClient.get('test:namespace:key1')).toBeNull()
      expect(await redisClient.get('test:namespace:key2')).toBeNull()

      // other:namespace 的键应该保留
      expect(await redisClient.get('other:namespace:key3')).toBe('value3')
    })
  })

  describe('并发请求处理', () => {
    it('应该能够处理并发的设置和获取', async () => {
      const operations = Array.from({ length: 10 }, (_, i) => {
        const key = `test:concurrent:${i}`
        const value = `value-${i}`
        return redisClient.set(key, value, 60)
      })

      await Promise.all(operations)

      // 验证所有值都已设置
      for (let i = 0; i < 10; i++) {
        const result = await redisClient.get(`test:concurrent:${i}`)
        expect(result).toBe(`value-${i}`)
      }
    })

    it('应该能够处理并发的相同键操作', async () => {
      const key = 'test:concurrent:same-key'

      // 并发设置同一个键
      await Promise.all([
        redisClient.set(key, 'value1', 60),
        redisClient.set(key, 'value2', 60),
        redisClient.set(key, 'value3', 60),
      ])

      // 应该是最后一个设置的值
      const result = await redisClient.get(key)
      expect(['value1', 'value2', 'value3']).toContain(result)
    })
  })

  describe('错误处理和降级', () => {
    it('应该在Redis断开连接时优雅降级', async () => {
      // 断开连接
      await redisClient.disconnect()

      // 应该返回null而不是抛出错误
      const result = await redisClient.get('test:key')
      expect(result).toBeNull()

      // 设置操作应该静默失败
      await expect(
        redisClient.set('test:key', 'value', 60)
      ).resolves.not.toThrow()
    })
  })
})

describe('CacheManager', () => {
  let cacheManager: CacheManager

  beforeEach(() => {
    cacheManager = new CacheManager({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    })
  })

  afterEach(async () => {
    await cacheManager.disconnect()
  })

  describe('基础缓存操作', () => {
    it('应该能够设置和获取缓存', async () => {
      const key = 'user:123'
      const value = { id: 123, name: 'Test User' }

      await cacheManager.set(key, value, 60)
      const result = await cacheManager.get<typeof value>(key)

      expect(result).toEqual(value)
    })

    it('应该支持泛型类型', async () => {
      interface User {
        id: number
        name: string
        email: string
      }

      const key = 'user:typed'
      const value: User = { id: 1, name: 'John', email: 'john@example.com' }

      await cacheManager.set(key, value, 60)
      const result = await cacheManager.get<User>(key)

      expect(result).toEqual(value)
      expect(result?.email).toBe('john@example.com')
    })
  })

  describe('缓存键生成', () => {
    it('应该生成符合规范的缓存键', () => {
      const testCases = [
        {
          namespace: 'crs',
          entity: 'dashboard',
          id: 'user123',
          expected: 'crs:dashboard:user123',
        },
        {
          namespace: 'stats',
          entity: 'usage',
          id: 'user456',
          expected: 'stats:usage:user456',
        },
        {
          namespace: 'crs',
          entity: 'keys',
          id: 'user789',
          expected: 'crs:keys:user789',
        },
      ]

      testCases.forEach(({ namespace, entity, id, expected }) => {
        const key = cacheManager.generateKey(namespace, entity, id)
        expect(key).toBe(expected)
      })
    })

    it('应该支持可选参数', () => {
      const key1 = cacheManager.generateKey('test', 'entity')
      expect(key1).toBe('test:entity')

      const key2 = cacheManager.generateKey('test', 'entity', 'id123')
      expect(key2).toBe('test:entity:id123')

      const key3 = cacheManager.generateKey(
        'test',
        'entity',
        'id123',
        'extra'
      )
      expect(key3).toBe('test:entity:id123:extra')
    })
  })

  describe('TTL配置管理', () => {
    it('应该使用预定义的TTL配置', () => {
      const ttls = {
        dashboard: cacheManager.getTTL('dashboard'),
        keys: cacheManager.getTTL('keys'),
        trend: cacheManager.getTTL('trend'),
        stats: cacheManager.getTTL('stats'),
      }

      expect(ttls.dashboard).toBe(60) // 1分钟
      expect(ttls.keys).toBe(60) // 1分钟
      expect(ttls.trend).toBe(300) // 5分钟
      expect(ttls.stats).toBe(60) // 1分钟
    })

    it('应该为未知类型返回默认TTL', () => {
      const ttl = cacheManager.getTTL('unknown-type')
      expect(ttl).toBe(60) // 默认60秒
    })
  })

  describe('缓存失效策略', () => {
    it('应该能够使特定用户的所有缓存失效', async () => {
      const userId = 'user123'

      // 设置多个缓存
      await cacheManager.set(`crs:dashboard:${userId}`, { data: 1 }, 60)
      await cacheManager.set(`crs:keys:${userId}`, { data: 2 }, 60)
      await cacheManager.set(`stats:usage:${userId}`, { data: 3 }, 60)

      // 使用户缓存失效
      await cacheManager.invalidateUser(userId)

      // 所有用户相关缓存应该被删除
      expect(await cacheManager.get(`crs:dashboard:${userId}`)).toBeNull()
      expect(await cacheManager.get(`crs:keys:${userId}`)).toBeNull()
      expect(await cacheManager.get(`stats:usage:${userId}`)).toBeNull()
    })

    it('应该能够使特定密钥的缓存失效', async () => {
      const keyId = 'key456'

      // 设置密钥相关缓存
      await cacheManager.set(`stats:key:${keyId}`, { data: 1 }, 60)
      await cacheManager.set(`crs:key-detail:${keyId}`, { data: 2 }, 60)

      // 使密钥缓存失效
      await cacheManager.invalidateKey(keyId)

      // 密钥相关缓存应该被删除
      expect(await cacheManager.get(`stats:key:${keyId}`)).toBeNull()
      expect(await cacheManager.get(`crs:key-detail:${keyId}`)).toBeNull()
    })

    it('应该能够清除所有CRS相关缓存', async () => {
      await cacheManager.set('crs:dashboard:user1', { data: 1 }, 60)
      await cacheManager.set('crs:keys:user2', { data: 2 }, 60)
      await cacheManager.set('stats:usage:user3', { data: 3 }, 60)

      // 清除所有CRS缓存
      await cacheManager.invalidateNamespace('crs')

      // CRS缓存应该被删除
      expect(await cacheManager.get('crs:dashboard:user1')).toBeNull()
      expect(await cacheManager.get('crs:keys:user2')).toBeNull()

      // 非CRS缓存应该保留
      expect(await cacheManager.get('stats:usage:user3')).toEqual({ data: 3 })
    })
  })

  describe('性能监控', () => {
    it('应该能够记录缓存命中率', async () => {
      const key = 'test:metrics'
      const value = 'test value'

      // 设置缓存
      await cacheManager.set(key, value, 60)

      // 获取缓存（命中）
      await cacheManager.get(key)
      await cacheManager.get(key)

      // 获取不存在的键（未命中）
      await cacheManager.get('non-existent')

      // 获取统计信息
      const stats = cacheManager.getStats()

      expect(stats.hits).toBe(2)
      expect(stats.misses).toBe(1)
      expect(stats.hitRate).toBeCloseTo(0.67, 1) // 2/3 ≈ 0.67
    })

    it('应该能够重置统计信息', async () => {
      await cacheManager.get('test:key')
      await cacheManager.get('test:key2')

      let stats = cacheManager.getStats()
      expect(stats.hits + stats.misses).toBeGreaterThan(0)

      cacheManager.resetStats()

      stats = cacheManager.getStats()
      expect(stats.hits).toBe(0)
      expect(stats.misses).toBe(0)
      expect(stats.hitRate).toBe(0)
    })
  })
})
