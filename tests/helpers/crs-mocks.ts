/**
 * CRS Mock Helpers
 *
 * 提供常用的 CRS 响应数据 Mock 辅助函数
 */

import { mockCrsClient } from '../mocks/crs-client.mock'

/**
 * CRS 密钥响应类型
 */
export interface CrsKeyResponse {
  id: string
  key: string
  name: string
  description?: string
  status: string
  createdAt: string
}

/**
 * CRS 统计响应类型
 */
export interface CrsStatsResponse {
  totalTokens: number
  totalRequests: number
  inputTokens: number
  outputTokens: number
  cacheCreateTokens: number
  cacheReadTokens: number
  cost: number
}

/**
 * CRS 仪表板响应类型
 */
export interface CrsDashboardResponse {
  totalKeys: number
  activeKeys: number
  totalRequests: number
  totalTokens: number
  successRate: number
  avgResponseTime: number
}

/**
 * Setup CRS Create Key Mock
 *
 * @param data - 部分 CRS 密钥数据（会与默认值合并）
 */
export function setupCrsCreateKeyMock(data?: Partial<CrsKeyResponse>) {
  mockCrsClient.createKey.mockResolvedValue({
    id: 'crs-key-123',
    key: 'sk-test-xxx',
    name: 'Test Key',
    description: 'Test Description',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    ...data,
  })
}

/**
 * Setup CRS Update Key Mock
 *
 * @param data - 部分 CRS 密钥数据（会与默认值合并）
 */
export function setupCrsUpdateKeyMock(data?: Partial<CrsKeyResponse>) {
  mockCrsClient.updateKey.mockResolvedValue({
    id: 'crs-key-123',
    name: 'Updated Key',
    description: 'Updated Description',
    status: 'ACTIVE',
    ...data,
  })
}

/**
 * Setup CRS Delete Key Mock
 */
export function setupCrsDeleteKeyMock() {
  mockCrsClient.deleteKey.mockResolvedValue({ success: true })
}

/**
 * Setup CRS List Keys Mock
 *
 * @param keys - 密钥列表
 */
export function setupCrsListKeysMock(keys?: CrsKeyResponse[]) {
  mockCrsClient.listKeys.mockResolvedValue(
    keys || [
      {
        id: 'crs-key-1',
        key: 'sk-test-1',
        name: 'Key 1',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'crs-key-2',
        key: 'sk-test-2',
        name: 'Key 2',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      },
    ]
  )
}

/**
 * Setup CRS Get Key Stats Mock
 *
 * @param stats - 部分统计数据（会与默认值合并）
 */
export function setupCrsGetKeyStatsMock(stats?: Partial<CrsStatsResponse>) {
  mockCrsClient.getKeyStats.mockResolvedValue({
    totalTokens: 10000,
    totalRequests: 100,
    inputTokens: 5000,
    outputTokens: 5000,
    cacheCreateTokens: 0,
    cacheReadTokens: 0,
    cost: 1.5,
    ...stats,
  })
}

/**
 * Setup CRS Get Usage Trend Mock
 *
 * @param trend - 趋势数据
 */
export function setupCrsGetUsageTrendMock(
  trend?: Array<{
    date: string
    requests: number
    tokens: number
  }>
) {
  mockCrsClient.getUsageTrend.mockResolvedValue({
    trend:
      trend ||
      [
        { date: '2025-10-01', requests: 100, tokens: 5000 },
        { date: '2025-10-02', requests: 120, tokens: 6000 },
        { date: '2025-10-03', requests: 110, tokens: 5500 },
      ],
  })
}

/**
 * Setup CRS Get Dashboard Mock
 *
 * @param dashboard - 部分仪表板数据（会与默认值合并）
 */
export function setupCrsGetDashboardMock(
  dashboard?: Partial<CrsDashboardResponse>
) {
  mockCrsClient.getDashboard.mockResolvedValue({
    totalKeys: 10,
    activeKeys: 8,
    totalRequests: 1000,
    totalTokens: 50000,
    successRate: 98.5,
    avgResponseTime: 250,
    ...dashboard,
  })
}

/**
 * Setup CRS Health Check Mock
 */
export function setupCrsHealthCheckMock() {
  mockCrsClient.healthCheck.mockResolvedValue({ status: 'healthy' })
}

/**
 * Setup CRS Unavailable Error
 *
 * 模拟 CRS 服务不可用场景
 */
export function setupCrsUnavailableError() {
  const error = new Error('CRS服务暂时不可用，请稍后重试')
  error.name = 'CrsUnavailableError'

  mockCrsClient.createKey.mockRejectedValue(error)
  mockCrsClient.updateKey.mockRejectedValue(error)
  mockCrsClient.deleteKey.mockRejectedValue(error)
  mockCrsClient.listKeys.mockRejectedValue(error)
  mockCrsClient.getKeyStats.mockRejectedValue(error)
  mockCrsClient.getUsageTrend.mockRejectedValue(error)
  mockCrsClient.getDashboard.mockRejectedValue(error)
}

/**
 * Setup CRS API Error
 *
 * 模拟 CRS API 返回错误
 *
 * @param statusCode - HTTP 状态码
 * @param message - 错误消息
 */
export function setupCrsApiError(statusCode: number, message: string) {
  const error = new Error(message)
  error.name = 'CrsApiError'
  ;(error as any).statusCode = statusCode

  mockCrsClient.createKey.mockRejectedValue(error)
  mockCrsClient.updateKey.mockRejectedValue(error)
  mockCrsClient.deleteKey.mockRejectedValue(error)
}

/**
 * Reset All CRS Mocks
 *
 * 清除所有 Mock 状态，在每个测试前调用
 */
export function resetCrsMocks() {
  jest.clearAllMocks()
}
