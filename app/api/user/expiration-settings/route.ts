/**
 * 到期提醒配置API
 * GET /api/user/expiration-settings - 获取配置
 * PUT /api/user/expiration-settings - 更新配置
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

/**
 * 配置更新验证Schema
 */
const updateSettingsSchema = z.object({
  reminderDays: z
    .array(
      z.number({
        invalid_type_error: '提醒天数必须为数字',
      }).int({
        message: '提醒天数必须为正整数',
      }).min(1, '提醒天数必须在 1-30 之间').max(30, '提醒天数必须在 1-30 之间')
    )
    .min(1, '至少需要设置一个提醒天数')
    .optional(),
  notifyChannels: z
    .array(
      z.enum(['email', 'webhook', 'system'], {
        errorMap: () => ({ message: '无效的通知渠道，只支持 email、webhook、system' }),
      })
    )
    .min(1, '至少需要选择一个通知渠道')
    .optional(),
  enabled: z.boolean().optional(),
})

/**
 * GET /api/user/expiration-settings - 获取提醒配置
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 验证JWT Token
    const authHeader = request.headers.get('Authorization')
    let userId: string

    try {
      const tokenData = verifyToken(authHeader)
      userId = tokenData.userId
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    // 2. 查询配置
    let settings = await prisma.expirationSetting.findUnique({
      where: { userId },
    })

    // 3. 如果不存在，创建默认配置
    if (!settings) {
      settings = await prisma.expirationSetting.create({
        data: {
          userId,
          reminderDays: [7, 3, 1],
          notifyChannels: ['system'],
          enabled: true,
        },
      })
    }

    return NextResponse.json(settings)
  } catch (error: any) {
    console.error('Get expiration settings error:', error)
    return NextResponse.json(
      { error: '系统错误，请稍后重试' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/user/expiration-settings - 更新提醒配置
 */
export async function PUT(request: NextRequest) {
  try {
    // 1. 验证JWT Token
    const authHeader = request.headers.get('Authorization')
    let userId: string

    try {
      const tokenData = verifyToken(authHeader)
      userId = tokenData.userId
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    // 2. 解析请求体
    let body: any
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'JSON格式不正确' },
        { status: 400 }
      )
    }

    // 3. 验证输入
    let validatedData: z.infer<typeof updateSettingsSchema>
    try {
      validatedData = updateSettingsSchema.parse(body)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: error.errors[0].message },
          { status: 400 }
        )
      }
      throw error
    }

    // 4. 检查至少有一个通知渠道
    if (validatedData.notifyChannels && validatedData.notifyChannels.length === 0) {
      return NextResponse.json(
        { error: '至少需要选择一个通知渠道' },
        { status: 400 }
      )
    }

    // 5. 去重提醒天数并排序
    const updateData: any = {}
    if (validatedData.reminderDays) {
      const uniqueDays = Array.from(new Set(validatedData.reminderDays)).sort(
        (a, b) => b - a
      )
      updateData.reminderDays = uniqueDays
    }
    if (validatedData.notifyChannels) {
      updateData.notifyChannels = validatedData.notifyChannels
    }
    if (validatedData.enabled !== undefined) {
      updateData.enabled = validatedData.enabled
    }

    // 6. 更新配置
    const updatedSettings = await prisma.expirationSetting.update({
      where: { userId },
      data: updateData,
    })

    return NextResponse.json(updatedSettings)
  } catch (error: any) {
    console.error('Update expiration settings error:', error)
    return NextResponse.json(
      { error: '系统错误，请稍后重试' },
      { status: 500 }
    )
  }
}
