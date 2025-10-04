/**
 * CRS (Claude Relay Service) Client
 * 代理CRS Admin API，处理认证、请求和错误
 */

/**
 * CRS API错误类
 */
export class CrsApiError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message)
    this.name = 'CrsApiError'
  }
}

/**
 * CRS服务不可用错误类
 */
export class CrsUnavailableError extends Error {
  constructor(message: string = 'CRS服务暂时不可用，请稍后重试') {
    super(message)
    this.name = 'CrsUnavailableError'
  }
}

/**
 * CRS Client类
 */
class CrsClient {
  private token: string | null = null
  private tokenExpiry: number = 0
  private readonly baseUrl: string
  private readonly adminUsername: string
  private readonly adminPassword: string

  constructor() {
    // 从环境变量读取配置
    this.baseUrl = process.env.CRS_BASE_URL || ''
    this.adminUsername = process.env.CRS_ADMIN_USERNAME || ''
    this.adminPassword = process.env.CRS_ADMIN_PASSWORD || ''

    if (!this.baseUrl || !this.adminUsername || !this.adminPassword) {
      console.warn(
        'CRS配置不完整，请检查环境变量: CRS_BASE_URL, CRS_ADMIN_USERNAME, CRS_ADMIN_PASSWORD'
      )
    }
  }

  /**
   * 确保已认证，返回有效的token
   */
  async ensureAuthenticated(): Promise<string> {
    // 检查token是否有效
    if (this.token && Date.now() < this.tokenExpiry) {
      return this.token
    }

    // 自动登录获取新token
    try {
      const response = await fetch(`${this.baseUrl}/web/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: this.adminUsername,
          password: this.adminPassword,
        }),
        signal: AbortSignal.timeout(5000), // 5秒超时
      })

      if (!response.ok) {
        throw new CrsApiError(
          response.status,
          'CRS authentication failed'
        )
      }

      const result = await response.json()

      if (!result.success || !result.token) {
        throw new Error('CRS login response invalid')
      }

      // 确保 token 不为 null
      const token: string = result.token
      this.token = token
      // 提前1分钟刷新token，避免在请求时过期
      const expiresIn = result.expiresIn || 86400000 // 默认24小时
      this.tokenExpiry = Date.now() + expiresIn - 60000

      return this.token
    } catch (error) {
      if (error instanceof CrsApiError) {
        throw error
      }

      // 网络错误或超时
      throw new CrsUnavailableError(
        'CRS服务暂时不可用，请稍后重试'
      )
    }
  }

  /**
   * 通用请求方法
   */
  async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    try {
      const token = await this.ensureAuthenticated()

      const response = await fetch(
        `${this.baseUrl}/admin${endpoint}`,
        {
          ...options,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options?.headers,
          },
          signal: AbortSignal.timeout(5000), // 5秒超时
        }
      )

      if (!response.ok) {
        // 401说明token失效，清除缓存并递归重试
        if (response.status === 401) {
          this.token = null
          return this.request(endpoint, options)
        }

        // 其他错误
        const errorText = await response.text()
        throw new CrsApiError(response.status, errorText)
      }

      const data = await response.json()
      // CRS响应格式: { success: true, data: {...} }
      return data.data as T
    } catch (error) {
      if (error instanceof CrsApiError) {
        throw error
      }

      if (error instanceof CrsUnavailableError) {
        throw error
      }

      // 超时或网络错误
      if (error instanceof Error) {
        if (error.name === 'AbortError' || error.name === 'TimeoutError') {
          throw new CrsUnavailableError('CRS服务响应超时，请稍后重试')
        }
      }

      throw new CrsUnavailableError('CRS服务暂时不可用，请稍后重试')
    }
  }

  /**
   * 列出API密钥
   */
  async listKeys(userId?: string): Promise<any[]> {
    const query = userId ? `?userId=${userId}` : ''
    return this.request<any[]>(`/api-keys${query}`)
  }

  /**
   * 创建API密钥
   */
  async createKey(data: {
    name: string
    description?: string
  }): Promise<{
    id: string
    key: string
    name: string
    description?: string
    status: string
    createdAt: Date
  }> {
    const response = await this.request<any>('/api-keys', {
      method: 'POST',
      body: JSON.stringify(data),
    })

    // 映射CRS响应字段到我们的接口
    return {
      id: response.id,
      key: response.apiKey, // CRS返回apiKey字段，映射到key
      name: response.name,
      description: response.description,
      status: response.isActive ? 'ACTIVE' : 'INACTIVE',
      createdAt: response.createdAt,
    }
  }

  /**
   * 更新API密钥
   */
  async updateKey(
    keyId: string,
    data: {
      name?: string
      description?: string
      status?: string
    }
  ): Promise<{ success: boolean }> {
    return this.request(`/api-keys/${keyId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  /**
   * 删除API密钥
   */
  async deleteKey(keyId: string): Promise<{ success: boolean }> {
    return this.request(`/api-keys/${keyId}`, {
      method: 'DELETE',
    })
  }

  /**
   * 获取密钥统计信息
   *
   * 注意：CRS使用 POST /apiStats/api/user-stats 端点
   * 需要传递完整的API密钥值（不是keyId）
   */
  async getKeyStats(apiKey: string): Promise<{
    totalTokens: number
    totalRequests: number
    inputTokens: number
    outputTokens: number
    cacheCreateTokens: number
    cacheReadTokens: number
    cost: number
  }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/apiStats/api/user-stats`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey }),
          signal: AbortSignal.timeout(5000),
        }
      )

      if (!response.ok) {
        throw new CrsApiError(response.status, await response.text())
      }

      const result = await response.json()

      if (!result.success || !result.data) {
        throw new Error('CRS stats response invalid')
      }

      const usage = result.data.usage?.total || {}

      return {
        totalTokens: usage.allTokens || 0,
        totalRequests: usage.requests || 0,
        inputTokens: usage.inputTokens || 0,
        outputTokens: usage.outputTokens || 0,
        cacheCreateTokens: usage.cacheCreateTokens || 0,
        cacheReadTokens: usage.cacheReadTokens || 0,
        cost: usage.cost || 0,
      }
    } catch (error) {
      if (error instanceof CrsApiError) {
        throw error
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError' || error.name === 'TimeoutError') {
          throw new CrsUnavailableError('CRS统计服务响应超时')
        }
      }

      throw new CrsUnavailableError('CRS统计服务暂时不可用')
    }
  }

  /**
   * 获取使用趋势
   */
  async getUsageTrend(params?: {
    startDate?: string
    endDate?: string
  }): Promise<any[]> {
    const query = new URLSearchParams(params as any).toString()
    const endpoint = query
      ? `/api-keys-usage-trend?${query}`
      : '/api-keys-usage-trend'
    return this.request<any[]>(endpoint)
  }

  /**
   * 获取仪表板数据
   */
  async getDashboard(): Promise<{
    totalKeys: number
    activeKeys: number
    totalTokens: number
    totalRequests: number
  }> {
    return this.request('/dashboard')
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{ status: string }> {
    // 简单的ping检查,验证CRS服务可用
    return this.request('/health')
  }
}

// 导出单例
export const crsClient = new CrsClient()
