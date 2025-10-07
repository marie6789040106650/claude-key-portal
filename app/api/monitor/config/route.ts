/**
 * PUT /api/monitor/config - 告警配置更新API
 *
 * 更新告警规则的配置参数
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/infrastructure/persistence/prisma'
import { z } from 'zod'

const updateConfigSchema = z.object({
  ruleId: z.string(),
  threshold: z.number().positive().optional(),
  enabled: z.boolean().optional(),
  channels: z.array(z.string()).optional(),
})

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    // 验证输入
    const validation = updateConfigSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 }
      )
    }

    const { ruleId, ...updateData } = validation.data

    // 检查规则是否存在
    const rule = await prisma.alertRule.findUnique({
      where: { id: ruleId },
    })

    if (!rule) {
      return NextResponse.json(
        { error: 'Alert rule not found' },
        { status: 404 }
      )
    }

    // 更新规则配置
    const updatedRule = await prisma.alertRule.update({
      where: { id: ruleId },
      data: updateData,
    })

    return NextResponse.json(updatedRule, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to update configuration',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
