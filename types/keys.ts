/**
 * 密钥管理类型定义
 *
 * 包含 API 密钥相关的所有 TypeScript 类型和接口
 */

/**
 * API 密钥状态枚举
 */
export type ApiKeyStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'DELETED' | 'RATE_LIMITED'

/**
 * API 密钥对象
 *
 * 表示系统中的一个 API 密钥及其相关信息
 */
export interface ApiKey {
  /** 密钥唯一标识符 */
  id: string

  /** 密钥名称（用户可读） */
  name: string

  /** 密钥前缀（如 sk-xxx） */
  keyPrefix: string

  /** 掩码后的密钥（如 sk-abc...xyz） */
  keyMasked: string

  /** 密钥状态 */
  status: ApiKeyStatus

  /** 创建时间（ISO 8601 格式） */
  createdAt: string

  /** 总请求次数 */
  totalRequests: number

  /** 总使用 Token 数 */
  totalTokens: number

  /** 最后使用时间（ISO 8601 格式，可选） */
  lastUsedAt?: string

  /** 密钥描述（可选） */
  description?: string

  /** 速率限制（每分钟请求数，可选） */
  rateLimit?: number

  /** 到期时间（ISO 8601 格式，可选） */
  expiresAt?: string
}

/**
 * 创建密钥请求体
 *
 * 用于 POST /api/keys 的请求参数
 */
export interface CreateKeyRequest {
  /** 密钥名称 */
  name: string

  /** 密钥描述（可选） */
  description?: string

  /** 速率限制（每分钟请求数，可选） */
  rateLimit?: number

  /** 到期时间（ISO 8601 格式，可选） */
  expiresAt?: string
}

/**
 * 更新密钥请求体
 *
 * 用于 PUT /api/keys/:id 的请求参数
 */
export interface UpdateKeyRequest {
  /** 密钥名称（可选） */
  name?: string

  /** 密钥描述（可选） */
  description?: string

  /** 速率限制（每分钟请求数，可选） */
  rateLimit?: number

  /** 到期时间（ISO 8601 格式，可选） */
  expiresAt?: string

  /** 密钥状态（可选） */
  status?: ApiKeyStatus
}

/**
 * 创建密钥响应
 *
 * POST /api/keys 的成功响应
 */
export interface CreateKeyResponse extends ApiKey {
  /** 完整的密钥值（仅在创建时返回一次） */
  key: string
}

/**
 * 密钥表单数据
 *
 * 用于 KeyForm 组件的表单数据类型
 */
export interface KeyFormData {
  /** 密钥名称 */
  name: string

  /** 密钥描述（可选） */
  description?: string

  /** 速率限制（每分钟请求数，可选） */
  rateLimit?: number

  /** 到期时间（ISO 8601 格式，可选） */
  expiresAt?: string
}

/**
 * 密钥表单模式
 */
export type KeyFormMode = 'create' | 'edit'

/**
 * 密钥排序字段
 */
export type KeySortField = 'name' | 'createdAt' | null

/**
 * 排序顺序
 */
export type SortOrder = 'asc' | 'desc'

/**
 * 密钥过滤条件
 */
export interface KeysFilter {
  /** 状态过滤 */
  status?: ApiKeyStatus | 'ALL'

  /** 搜索查询（按名称） */
  query?: string
}

/**
 * 密钥列表查询参数
 */
export interface KeysQueryParams extends KeysFilter {
  /** 当前页码（从 1 开始） */
  page?: number

  /** 每页数量 */
  pageSize?: number

  /** 排序字段 */
  sortField?: KeySortField

  /** 排序顺序 */
  sortOrder?: SortOrder
}

/**
 * 密钥列表响应
 */
export interface KeysListResponse {
  /** 密钥数组 */
  keys: ApiKey[]

  /** 总数量 */
  total: number

  /** 当前页码 */
  page: number

  /** 每页数量 */
  limit: number

  /** 总页数 */
  totalPages: number
}

/**
 * API 错误响应
 */
export interface ApiErrorResponse {
  /** 错误消息 */
  error: string

  /** 错误代码（可选） */
  code?: string

  /** 详细信息（可选） */
  details?: Record<string, unknown>
}
