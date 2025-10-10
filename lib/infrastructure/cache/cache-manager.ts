/**
 * 缓存管理器
 *
 * 功能：
 * - 统一的缓存键命名规范
 * - 预定义的TTL配置
 * - 缓存失效策略
 * - 性能监控（命中率统计）
 */

import { RedisClient, RedisClientOptions } from './redis-client'

export interface CacheStats {
  hits: number
  misses: number
  hitRate: number
}

export class CacheManager {
  private redisClient: RedisClient
  private stats: {
    hits: number
    misses: number
  }

  // 预定义的TTL配置（秒）
  private readonly TTL_CONFIG: Record<string, number> = {
    dashboard: 60, // CRS Dashboard数据缓存60秒
    keys: 60, // CRS API Keys列表缓存60秒
    trend: 300, // 趋势数据缓存5分钟
    stats: 60, // 统计数据缓存60秒
    default: 60, // 默认60秒
  }

  constructor(options?: RedisClientOptions) {
    this.redisClient = new RedisClient(options)
    this.stats = {
      hits: 0,
      misses: 0,
    }
  }

  /**
   * 生成标准化的缓存键
   *
   * 格式: namespace:entity[:id[:extra]]
   *
   * @example
   * generateKey('crs', 'dashboard', 'user123') // => 'crs:dashboard:user123'
   * generateKey('stats', 'usage') // => 'stats:usage'
   */
  generateKey(
    namespace: string,
    entity: string,
    id?: string,
    extra?: string
  ): string {
    const parts = [namespace, entity]
    if (id) parts.push(id)
    if (extra) parts.push(extra)
    return parts.join(':')
  }

  /**
   * 获取预定义的TTL配置
   *
   * @param type - 缓存类型
   * @returns TTL（秒）
   */
  getTTL(type: string): number {
    return this.TTL_CONFIG[type] || this.TTL_CONFIG.default
  }

  /**
   * 设置缓存
   *
   * @param key - 缓存键
   * @param value - 缓存值
   * @param ttl - 过期时间（秒）
   */
  async set<T = any>(key: string, value: T, ttl: number): Promise<void> {
    await this.redisClient.set(key, value, ttl)
  }

  /**
   * 获取缓存
   *
   * @param key - 缓存键
   * @returns 缓存值，如果不存在则返回null
   */
  async get<T = any>(key: string): Promise<T | null> {
    const value = await this.redisClient.get<T>(key)

    // 更新统计信息
    if (value !== null) {
      this.stats.hits++
    } else {
      this.stats.misses++
    }

    return value
  }

  /**
   * 删除缓存
   *
   * @param key - 缓存键
   */
  async delete(key: string): Promise<void> {
    await this.redisClient.delete(key)
  }

  /**
   * 使特定用户的所有缓存失效
   *
   * @param userId - 用户ID
   */
  async invalidateUser(userId: string): Promise<void> {
    // 删除所有包含该用户ID的缓存
    const patterns = [
      `crs:*:${userId}`,
      `stats:*:${userId}`,
      `*:${userId}:*`,
    ]

    for (const pattern of patterns) {
      await this.redisClient.deletePattern(pattern)
    }
  }

  /**
   * 使特定密钥的缓存失效
   *
   * @param keyId - 密钥ID
   */
  async invalidateKey(keyId: string): Promise<void> {
    // 删除所有包含该密钥ID的缓存
    const patterns = [`stats:*:${keyId}`, `crs:*:${keyId}`, `*:${keyId}:*`]

    for (const pattern of patterns) {
      await this.redisClient.deletePattern(pattern)
    }
  }

  /**
   * 清除特定命名空间的所有缓存
   *
   * @param namespace - 命名空间（如 'crs', 'stats'）
   */
  async invalidateNamespace(namespace: string): Promise<void> {
    await this.redisClient.deletePattern(`${namespace}:*`)
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses
    const hitRate = total > 0 ? this.stats.hits / total : 0

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: Math.round(hitRate * 100) / 100, // 保留2位小数
    }
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.stats.hits = 0
    this.stats.misses = 0
  }

  /**
   * 检查Redis连接状态
   */
  async isConnected(): Promise<boolean> {
    return await this.redisClient.isConnected()
  }

  /**
   * 断开Redis连接
   */
  async disconnect(): Promise<void> {
    await this.redisClient.disconnect()
  }

  /**
   * 获取底层Redis客户端（用于高级操作）
   */
  getRedisClient(): RedisClient {
    return this.redisClient
  }
}

// 导出单例实例
let cacheManagerInstance: CacheManager | null = null

export function getCacheManager(): CacheManager {
  if (!cacheManagerInstance) {
    cacheManagerInstance = new CacheManager()
  }
  return cacheManagerInstance
}
