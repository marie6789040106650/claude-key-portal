/**
 * 认证相关的数据验证规则
 * 使用 Zod 进行类型安全的输入验证
 */

import { z } from 'zod'

/**
 * 密码强度验证规则
 * - 至少8个字符
 * - 包含大写字母
 * - 包含小写字母
 * - 包含数字
 * - 包含特殊字符
 */
const passwordSchema = z
  .string()
  .min(8, '密码至少需要8个字符')
  .regex(/[A-Z]/, '密码必须包含至少一个大写字母')
  .regex(/[a-z]/, '密码必须包含至少一个小写字母')
  .regex(/[0-9]/, '密码必须包含至少一个数字')
  .regex(/[^A-Za-z0-9]/, '密码必须包含至少一个特殊字符')

/**
 * 邮箱验证规则
 */
const emailSchema = z.string().email('邮箱格式不正确')

/**
 * 手机号验证规则（中国大陆）
 * 11位数字，1开头
 */
const phoneSchema = z
  .string()
  .regex(/^1[3-9]\d{9}$/, '手机号格式不正确')

/**
 * 用户注册请求验证
 */
export const registerSchema = z
  .object({
    email: emailSchema.optional(),
    phone: phoneSchema.optional(),
    password: passwordSchema,
    nickname: z.string().max(50, '昵称不能超过50个字符').optional(),
  })
  .refine((data) => data.email || data.phone, {
    message: '邮箱或手机号至少提供一个',
    path: ['email'],
  })

/**
 * 用户登录请求验证
 */
export const loginSchema = z
  .object({
    email: z.string().optional(),
    phone: z.string().optional(),
    password: z.string({ required_error: '密码不能为空' }).min(1, '密码不能为空'),
  })
  .refine((data) => data.email || data.phone, {
    message: '邮箱或手机号至少提供一个',
    path: ['email'],
  })

/**
 * 类型导出
 */
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
