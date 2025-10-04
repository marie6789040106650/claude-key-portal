/**
 * 密钥管理 API 客户端
 *
 * 封装所有密钥相关的 API 调用逻辑
 */

import type {
  ApiKey,
  CreateKeyRequest,
  CreateKeyResponse,
  UpdateKeyRequest,
  ApiErrorResponse,
} from '@/types/keys'

/**
 * API 调用配置
 */
interface RequestConfig extends RequestInit {
  /** 超时时间（毫秒），默认 10 秒 */
  timeout?: number
}

/**
 * 执行 API 请求的通用函数
 *
 * @param url - API 端点 URL
 * @param config - 请求配置
 * @returns API 响应数据
 * @throws {Error} 当请求失败时抛出错误
 *
 * @internal
 */
async function apiRequest<T>(url: string, config: RequestConfig = {}): Promise<T> {
  const { timeout = 10000, ...fetchConfig } = config

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...fetchConfig,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...fetchConfig.headers,
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData: ApiErrorResponse = await response.json()
      throw new Error(errorData.error || '请求失败')
    }

    return response.json()
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('请求超时')
      }
      throw error
    }

    throw new Error('未知错误')
  }
}

/**
 * 获取密钥列表
 *
 * @returns 密钥数组
 * @throws {Error} 当请求失败时抛出错误
 *
 * @example
 * const keys = await fetchKeys()
 * console.log(`获取到 ${keys.length} 个密钥`)
 */
export async function fetchKeys(): Promise<ApiKey[]> {
  return apiRequest<ApiKey[]>('/api/keys', {
    method: 'GET',
  })
}

/**
 * 获取单个密钥详情
 *
 * @param id - 密钥 ID
 * @returns 密钥对象
 * @throws {Error} 当请求失败时抛出错误
 *
 * @example
 * const key = await fetchKeyById('key-123')
 * console.log(`密钥名称: ${key.name}`)
 */
export async function fetchKeyById(id: string): Promise<ApiKey> {
  return apiRequest<ApiKey>(`/api/keys/${id}`, {
    method: 'GET',
  })
}

/**
 * 创建新密钥
 *
 * @param data - 创建密钥的请求数据
 * @returns 创建成功的密钥对象（包含完整密钥值）
 * @throws {Error} 当请求失败时抛出错误
 *
 * @example
 * const newKey = await createKey({
 *   name: 'My API Key',
 *   description: 'For production use',
 *   rateLimit: 1000,
 * })
 * console.log(`创建成功，密钥: ${newKey.key}`)
 */
export async function createKey(data: CreateKeyRequest): Promise<CreateKeyResponse> {
  return apiRequest<CreateKeyResponse>('/api/keys', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * 更新密钥信息
 *
 * @param id - 密钥 ID
 * @param data - 更新数据
 * @returns 更新后的密钥对象
 * @throws {Error} 当请求失败时抛出错误
 *
 * @example
 * const updatedKey = await updateKey('key-123', {
 *   name: 'Updated Name',
 *   rateLimit: 2000,
 * })
 * console.log(`密钥已更新`)
 */
export async function updateKey(id: string, data: UpdateKeyRequest): Promise<ApiKey> {
  return apiRequest<ApiKey>(`/api/keys/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

/**
 * 删除密钥
 *
 * @param id - 密钥 ID
 * @returns 删除操作的响应
 * @throws {Error} 当请求失败时抛出错误
 *
 * @example
 * await deleteKey('key-123')
 * console.log(`密钥已删除`)
 */
export async function deleteKey(id: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/api/keys/${id}`, {
    method: 'DELETE',
  })
}

/**
 * 复制密钥到剪贴板
 *
 * @param keyValue - 要复制的密钥值
 * @returns 是否复制成功
 *
 * @example
 * const success = await copyKeyToClipboard('sk-abc123...')
 * if (success) {
 *   console.log('已复制到剪贴板')
 * }
 */
export async function copyKeyToClipboard(keyValue: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(keyValue)
      return true
    } else {
      // 降级方案：使用 textarea
      const textarea = document.createElement('textarea')
      textarea.value = keyValue
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      const success = document.execCommand('copy')
      document.body.removeChild(textarea)
      return success
    }
  } catch (error) {
    console.error('复制失败:', error)
    return false
  }
}
