/**
 * Redis Mock配置
 *
 * 为所有测试提供统一的Redis mock，避免实际连接Redis
 */

/**
 * Mock Redis客户端
 */
const mockRedisClient = {
  // 基础操作
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  exists: jest.fn().mockResolvedValue(0),

  // 带过期时间的操作
  setex: jest.fn().mockResolvedValue('OK'),
  expire: jest.fn().mockResolvedValue(1),
  ttl: jest.fn().mockResolvedValue(-1),

  // 批量操作
  mget: jest.fn().mockResolvedValue([]),
  mset: jest.fn().mockResolvedValue('OK'),
  keys: jest.fn().mockResolvedValue([]),

  // 哈希操作
  hget: jest.fn().mockResolvedValue(null),
  hset: jest.fn().mockResolvedValue(1),
  hgetall: jest.fn().mockResolvedValue({}),
  hdel: jest.fn().mockResolvedValue(1),

  // 列表操作
  lpush: jest.fn().mockResolvedValue(1),
  rpush: jest.fn().mockResolvedValue(1),
  lpop: jest.fn().mockResolvedValue(null),
  rpop: jest.fn().mockResolvedValue(null),
  lrange: jest.fn().mockResolvedValue([]),

  // 集合操作
  sadd: jest.fn().mockResolvedValue(1),
  srem: jest.fn().mockResolvedValue(1),
  smembers: jest.fn().mockResolvedValue([]),
  sismember: jest.fn().mockResolvedValue(0),

  // 连接状态
  isConnected: jest.fn().mockReturnValue(false),
  ping: jest.fn().mockResolvedValue('PONG'),
  quit: jest.fn().mockResolvedValue('OK'),

  // 事务
  multi: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue([]),

  // 管道
  pipeline: jest.fn().mockReturnThis(),

  // 发布订阅
  publish: jest.fn().mockResolvedValue(0),
  subscribe: jest.fn().mockResolvedValue(undefined),
  unsubscribe: jest.fn().mockResolvedValue(undefined),
}

/**
 * Mock CacheManager
 */
const mockCacheManager = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(true),
  del: jest.fn().mockResolvedValue(true),
  clear: jest.fn().mockResolvedValue(true),
  has: jest.fn().mockResolvedValue(false),
}

// Mock Redis客户端模块
jest.mock('@/lib/infrastructure/cache/redis-client', () => ({
  redisClient: mockRedisClient,
  RedisClient: jest.fn(() => mockRedisClient),
}))

// Mock CacheManager模块
jest.mock('@/lib/infrastructure/cache/cache-manager', () => ({
  cacheManager: mockCacheManager,
  CacheManager: jest.fn(() => mockCacheManager),
}))

/**
 * 辅助函数: Mock获取成功
 */
export function mockRedisGetSuccess(key: string, value: string): void {
  mockRedisClient.get.mockResolvedValueOnce(value)
}

/**
 * 辅助函数: Mock获取失败（key不存在）
 */
export function mockRedisGetNotFound(key: string): void {
  mockRedisClient.get.mockResolvedValueOnce(null)
}

/**
 * 辅助函数: Mock设置成功
 */
export function mockRedisSetSuccess(): void {
  mockRedisClient.set.mockResolvedValueOnce('OK')
}

/**
 * 辅助函数: Mock删除成功
 */
export function mockRedisDelSuccess(count: number = 1): void {
  mockRedisClient.del.mockResolvedValueOnce(count)
}

/**
 * 辅助函数: Mock CacheManager获取
 */
export function mockCacheGetSuccess<T>(key: string, value: T): void {
  mockCacheManager.get.mockResolvedValueOnce(value)
}

/**
 * 辅助函数: Mock CacheManager设置
 */
export function mockCacheSetSuccess(): void {
  mockCacheManager.set.mockResolvedValueOnce(true)
}

/**
 * 辅助函数: 重置所有Mock
 */
export function resetRedisMock(): void {
  // 重置Redis客户端
  Object.values(mockRedisClient).forEach((mock) => {
    if (jest.isMockFunction(mock)) {
      mock.mockClear()
    }
  })

  // 重置为默认行为
  mockRedisClient.get.mockResolvedValue(null)
  mockRedisClient.set.mockResolvedValue('OK')
  mockRedisClient.del.mockResolvedValue(1)
  mockRedisClient.isConnected.mockReturnValue(false)

  // 重置CacheManager
  Object.values(mockCacheManager).forEach((mock) => {
    if (jest.isMockFunction(mock)) {
      mock.mockClear()
    }
  })

  mockCacheManager.get.mockResolvedValue(null)
  mockCacheManager.set.mockResolvedValue(true)
  mockCacheManager.del.mockResolvedValue(true)
  mockCacheManager.has.mockResolvedValue(false)
}

/**
 * 辅助函数: 验证Redis调用
 */
export function expectRedisGetCalled(key: string): void {
  expect(mockRedisClient.get).toHaveBeenCalledWith(key)
}

export function expectRedisSetCalled(key: string, value: string): void {
  expect(mockRedisClient.set).toHaveBeenCalledWith(key, value)
}

export function expectRedisDelCalled(key: string): void {
  expect(mockRedisClient.del).toHaveBeenCalledWith(key)
}

/**
 * 辅助函数: 验证CacheManager调用
 */
export function expectCacheGetCalled(key: string): void {
  expect(mockCacheManager.get).toHaveBeenCalledWith(key)
}

export function expectCacheSetCalled(key: string, value: any): void {
  expect(mockCacheManager.set).toHaveBeenCalledWith(key, value, expect.any(Number))
}

// 导出mock实例供测试使用
export { mockRedisClient, mockCacheManager }
