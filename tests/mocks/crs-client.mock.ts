/**
 * CRS Client Mock
 *
 * 统一的 CRS Client Mock，用于所有需要测试 CRS 集成的测试文件
 *
 * 使用方法:
 * ```typescript
 * import { mockCrsClient } from '@/tests/mocks/crs-client.mock'
 *
 * beforeEach(() => {
 *   mockCrsClient.createKey.mockResolvedValue({ ... })
 * })
 * ```
 */

export const mockCrsClient = {
  // 密钥管理
  createKey: jest.fn(),
  updateKey: jest.fn(),
  deleteKey: jest.fn(),
  listKeys: jest.fn(),

  // 统计数据
  getKeyStats: jest.fn(),
  getUsageTrend: jest.fn(),
  getDashboard: jest.fn(),

  // 健康检查
  healthCheck: jest.fn(),
}

// 自动 Mock @/lib/infrastructure/external/crs-client 模块
jest.mock('@/lib/infrastructure/external/crs-client', () => ({
  crsClient: mockCrsClient,
  CrsClient: jest.fn().mockImplementation(() => mockCrsClient),
}))
