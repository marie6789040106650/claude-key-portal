/**
 * Fetch API Mock配置
 *
 * 为所有测试提供统一的fetch mock
 */

interface MockResponse {
  ok: boolean
  status: number
  statusText: string
  json: () => Promise<any>
  text: () => Promise<string>
  blob: () => Promise<Blob>
  arrayBuffer: () => Promise<ArrayBuffer>
  headers: Headers
}

/**
 * 创建Mock响应
 */
function createMockResponse(data: any = {}, options: Partial<MockResponse> = {}): MockResponse {
  const defaultResponse: MockResponse = {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    blob: () => Promise.resolve(new Blob([JSON.stringify(data)])),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    headers: new Headers(),
  }

  return { ...defaultResponse, ...options }
}

/**
 * 创建错误响应
 */
function createErrorResponse(message: string, status: number = 500): MockResponse {
  return createMockResponse(
    { error: message },
    {
      ok: false,
      status,
      statusText: message,
    }
  )
}

/**
 * 全局Fetch Mock
 */
const mockFetch = jest.fn((url: string, options?: RequestInit): Promise<MockResponse> => {
  // 默认返回成功响应
  return Promise.resolve(createMockResponse({ data: {} }))
})

// 设置全局fetch
global.fetch = mockFetch as any

/**
 * 辅助函数: Mock成功响应
 */
export function mockFetchSuccess(data: any = {}): void {
  mockFetch.mockResolvedValueOnce(createMockResponse(data) as any)
}

/**
 * 辅助函数: Mock错误响应
 */
export function mockFetchError(message: string, status: number = 500): void {
  mockFetch.mockResolvedValueOnce(createErrorResponse(message, status) as any)
}

/**
 * 辅助函数: Mock网络错误
 */
export function mockFetchNetworkError(): void {
  mockFetch.mockRejectedValueOnce(new Error('Network error'))
}

/**
 * 辅助函数: 重置Mock
 */
export function resetFetchMock(): void {
  mockFetch.mockClear()
  mockFetch.mockResolvedValue(createMockResponse({ data: {} }) as any)
}

/**
 * 辅助函数: 验证Fetch调用
 */
export function expectFetchCalled(url: string, options?: Partial<RequestInit>): void {
  expect(mockFetch).toHaveBeenCalledWith(url, expect.objectContaining(options || {}))
}

/**
 * 辅助函数: 验证Fetch未调用
 */
export function expectFetchNotCalled(): void {
  expect(mockFetch).not.toHaveBeenCalled()
}

// 导出mock实例供测试使用
export { mockFetch }

// 导出类型
export type { MockResponse }
