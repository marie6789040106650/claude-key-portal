/**
 * 密钥管理常量定义
 *
 * 包含密钥管理相关的常量、配置和枚举值
 */

import type { ApiKeyStatus } from '@/types/keys'

/**
 * 密钥状态枚举
 */
export const KEY_STATUS: Record<string, ApiKeyStatus> = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  EXPIRED: 'EXPIRED',
} as const

/**
 * 状态显示标签
 */
export const STATUS_LABELS: Record<ApiKeyStatus | 'ALL', string> = {
  ALL: '全部状态',
  ACTIVE: '激活',
  INACTIVE: '未激活',
  EXPIRED: '已过期',
}

/**
 * 错误消息映射
 *
 * 用于将 API 错误消息转换为用户友好的中文提示
 */
export const ERROR_MESSAGES: Record<string, string> = {
  // 网络错误
  NETWORK_ERROR: '网络错误，请检查网络连接',
  TIMEOUT_ERROR: '请求超时，请稍后重试',

  // CRS 相关错误
  CRS_UNAVAILABLE: 'CRS 服务暂时不可用，请稍后重试',
  CRS_ERROR: 'CRS 服务错误',

  // 认证错误
  UNAUTHORIZED: '未授权，请先登录',
  FORBIDDEN: '无权访问此资源',
  TOKEN_EXPIRED: '登录已过期，请重新登录',

  // 资源错误
  NOT_FOUND: '资源不存在',
  KEY_NOT_FOUND: '密钥不存在',
  KEY_EXISTS: '密钥名称已存在',

  // 验证错误
  VALIDATION_ERROR: '输入数据不合法',
  INVALID_NAME: '密钥名称不合法',
  INVALID_RATE_LIMIT: '速率限制必须是正整数',
  INVALID_EXPIRES_AT: '到期时间必须是未来日期',

  // 服务器错误
  INTERNAL_ERROR: '服务器错误，请稍后重试',
  DATABASE_ERROR: '数据库错误',

  // 默认错误
  UNKNOWN_ERROR: '未知错误',
}

/**
 * 分页配置
 */
export const PAGINATION = {
  /** 默认每页数量 */
  DEFAULT_PAGE_SIZE: 10,

  /** 最小每页数量 */
  MIN_PAGE_SIZE: 5,

  /** 最大每页数量 */
  MAX_PAGE_SIZE: 100,

  /** 默认页码 */
  DEFAULT_PAGE: 1,
} as const

/**
 * 表单验证规则
 */
export const VALIDATION_RULES = {
  /** 密钥名称最小长度 */
  NAME_MIN_LENGTH: 3,

  /** 密钥名称最大长度 */
  NAME_MAX_LENGTH: 100,

  /** 描述最大长度 */
  DESCRIPTION_MAX_LENGTH: 500,

  /** 速率限制最小值 */
  RATE_LIMIT_MIN: 1,

  /** 速率限制最大值 */
  RATE_LIMIT_MAX: 10000,
} as const

/**
 * React Query 配置
 */
export const QUERY_CONFIG = {
  /** 密钥列表查询 key */
  KEYS_LIST: ['keys'] as const,

  /** 密钥详情查询 key */
  KEY_DETAIL: (id: string) => ['keys', id] as const,

  /** 数据过期时间（毫秒） */
  STALE_TIME: 60 * 1000, // 1 分钟

  /** 缓存时间（毫秒） */
  CACHE_TIME: 5 * 60 * 1000, // 5 分钟
} as const

/**
 * API 端点
 */
export const API_ENDPOINTS = {
  /** 密钥列表 */
  KEYS: '/api/keys',

  /** 密钥详情 */
  KEY_DETAIL: (id: string) => `/api/keys/${id}`,
} as const

/**
 * 密钥前缀显示长度
 */
export const KEY_PREFIX_LENGTH = 8

/**
 * 密钥掩码字符
 */
export const KEY_MASK_CHAR = '...'

/**
 * 默认排序配置
 */
export const DEFAULT_SORT = {
  /** 默认排序字段 */
  FIELD: null,

  /** 默认排序顺序 */
  ORDER: 'asc',
} as const

/**
 * Toast 提示持续时间（毫秒）
 */
export const TOAST_DURATION = {
  /** 成功提示 */
  SUCCESS: 2000,

  /** 错误提示 */
  ERROR: 3000,

  /** 警告提示 */
  WARNING: 2500,

  /** 信息提示 */
  INFO: 2000,
} as const
