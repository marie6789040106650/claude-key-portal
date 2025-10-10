/**
 * Redis客户端封装
 *
 * 功能：
 * - 连接管理（自动重连）
 * - 基础操作（set/get/delete）
 * - TTL管理
 * - 模式删除（批量删除键）
 * - 错误降级（Redis不可用时返回null而非抛出错误）
 */

import Redis, { RedisOptions } from 'ioredis'

export interface RedisClientOptions {
  host?: string
  port?: number
  password?: string
  db?: number
}

export class RedisClient {
  private client: Redis | null = null
  private connected: boolean = false
  private options: RedisClientOptions

  constructor(options: RedisClientOptions = {}) {
    this.options = {
      host: options.host || process.env.REDIS_HOST || 'localhost',
      port: options.port || parseInt(process.env.REDIS_PORT || '6379'),
      password: options.password || process.env.REDIS_PASSWORD,
      db: options.db || parseInt(process.env.REDIS_DB || '0'),
    }

    this.connect()
  }

  /**
   * 连接到Redis
   */
  private connect(): void {
    try {
      const redisOptions: RedisOptions = {
        host: this.options.host,
        port: this.options.port,
        password: this.options.password,
        db: this.options.db,
        retryStrategy: (times) => {
          // 最多重试10次，每次间隔时间递增
          if (times > 10) {
            return null // 停止重试
          }
          return Math.min(times * 50, 2000) // 最多等待2秒
        },
        lazyConnect: false, // 立即连接
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        connectTimeout: 5000, // 5秒连接超时
      }

      this.client = new Redis(redisOptions)

      // 在测试环境中（ioredis-mock），连接是立即成功的
      if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) {
        this.connected = true
      }

      this.client.on('connect', () => {
        this.connected = true
        console.log('[Redis] Connected successfully')
      })

      this.client.on('ready', () => {
        this.connected = true
        console.log('[Redis] Ready to accept commands')
      })

      this.client.on('error', (error) => {
        this.connected = false
        console.error('[Redis] Connection error:', error.message)
      })

      this.client.on('close', () => {
        this.connected = false
        console.log('[Redis] Connection closed')
      })

      this.client.on('reconnecting', () => {
        console.log('[Redis] Reconnecting...')
      })
    } catch (error) {
      console.error('[Redis] Failed to create client:', error)
      this.connected = false
      this.client = null
    }
  }

  /**
   * 检查Redis连接状态
   */
  async isConnected(): Promise<boolean> {
    if (!this.client) {
      return false
    }

    try {
      await this.client.ping()
      this.connected = true
      return true
    } catch (error) {
      this.connected = false
      return false
    }
  }

  /**
   * 设置缓存值
   *
   * @param key - 缓存键
   * @param value - 缓存值（支持字符串和对象）
   * @param ttl - 过期时间（秒）
   */
  async set<T = any>(key: string, value: T, ttl: number): Promise<void> {
    if (!this.client || !this.connected) {
      console.warn('[Redis] Not connected, skipping set operation')
      return
    }

    try {
      const serializedValue =
        typeof value === 'string' ? value : JSON.stringify(value)

      await this.client.setex(key, ttl, serializedValue)
    } catch (error) {
      console.error(`[Redis] Failed to set key "${key}":`, error)
      // 降级：不抛出错误
    }
  }

  /**
   * 获取缓存值
   *
   * @param key - 缓存键
   * @returns 缓存值，如果不存在或发生错误则返回null
   */
  async get<T = any>(key: string): Promise<T | null> {
    if (!this.client || !this.connected) {
      return null
    }

    try {
      const value = await this.client.get(key)

      if (value === null) {
        return null
      }

      // 尝试解析为JSON，如果失败则返回原始字符串
      try {
        return JSON.parse(value) as T
      } catch {
        // 如果不是JSON格式，直接返回字符串
        return value as T
      }
    } catch (error) {
      console.error(`[Redis] Failed to get key "${key}":`, error)
      return null
    }
  }

  /**
   * 删除缓存键
   *
   * @param key - 缓存键
   */
  async delete(key: string): Promise<void> {
    if (!this.client || !this.connected) {
      console.warn('[Redis] Not connected, skipping delete operation')
      return
    }

    try {
      await this.client.del(key)
    } catch (error) {
      console.error(`[Redis] Failed to delete key "${key}":`, error)
      // 降级：不抛出错误
    }
  }

  /**
   * 获取键的剩余TTL
   *
   * @param key - 缓存键
   * @returns 剩余TTL（秒），-1表示永不过期，-2表示键不存在
   */
  async getTTL(key: string): Promise<number> {
    if (!this.client || !this.connected) {
      return -2
    }

    try {
      return await this.client.ttl(key)
    } catch (error) {
      console.error(`[Redis] Failed to get TTL for key "${key}":`, error)
      return -2
    }
  }

  /**
   * 删除匹配模式的所有键
   *
   * @param pattern - 键模式（如 "user:*"）
   */
  async deletePattern(pattern: string): Promise<void> {
    if (!this.client || !this.connected) {
      console.warn('[Redis] Not connected, skipping deletePattern operation')
      return
    }

    try {
      // 使用SCAN命令而不是KEYS，避免阻塞Redis
      const stream = this.client.scanStream({
        match: pattern,
        count: 100, // 每次扫描100个键
      })

      const pipeline = this.client.pipeline()
      let keysToDelete = 0

      for await (const keys of stream) {
        if (keys.length > 0) {
          for (const key of keys) {
            pipeline.del(key)
            keysToDelete++
          }
        }
      }

      if (keysToDelete > 0) {
        await pipeline.exec()
        console.log(
          `[Redis] Deleted ${keysToDelete} keys matching pattern "${pattern}"`
        )
      }
    } catch (error) {
      console.error(
        `[Redis] Failed to delete pattern "${pattern}":`,
        error
      )
      // 降级：不抛出错误
    }
  }

  /**
   * 断开Redis连接
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit()
        this.client = null
        this.connected = false
        console.log('[Redis] Disconnected')
      } catch (error) {
        console.error('[Redis] Error during disconnect:', error)
        // 强制关闭连接
        if (this.client) {
          this.client.disconnect()
          this.client = null
          this.connected = false
        }
      }
    }
  }

  /**
   * 获取Redis客户端实例（用于高级操作）
   */
  getClient(): Redis | null {
    return this.client
  }
}

// 导出单例实例
let redisClientInstance: RedisClient | null = null

export function getRedisClient(): RedisClient {
  if (!redisClientInstance) {
    redisClientInstance = new RedisClient()
  }
  return redisClientInstance
}
