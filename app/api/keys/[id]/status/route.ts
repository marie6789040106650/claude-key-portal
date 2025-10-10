/**
 * Key Status API Route
 * P3.2 阶段 - 密钥启用/禁用功能 🟢 GREEN
 *
 * PATCH /api/keys/[id]/status
 * - 更新密钥状态（启用/禁用）
 * - 调用 CRS Admin API
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/infrastructure/persistence/prisma'
import { crsClient, CrsUnavailableError, CrsApiError } from '@/lib/infrastructure/external/crs-client'
import { getAuthenticatedUser } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. 验证用户登录
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    // 2. 解析请求体
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: '无效的请求数据' },
        { status: 400 }
      )
    }

    // 3. 验证输入
    const { isActive } = body

    if (isActive === undefined) {
      return NextResponse.json(
        { error: '缺少必填字段: isActive' },
        { status: 400 }
      )
    }

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'isActive 必须是布尔值' },
        { status: 400 }
      )
    }

    // 4. 查找密钥（获取crsKeyId）
    const key = await prisma.apiKey.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        userId: true,
        crsKeyId: true,
        name: true,
      },
    })

    if (!key) {
      return NextResponse.json({ error: '密钥不存在' }, { status: 404 })
    }

    // 5. 验证权限
    if (key.userId !== user.id) {
      return NextResponse.json(
        { error: '无权操作此密钥' },
        { status: 403 }
      )
    }

    // 6. 调用 CRS API 更新密钥状态
    try {
      await crsClient.updateKey(key.crsKeyId, {
        status: isActive ? 'active' : 'inactive',
      })

      return NextResponse.json({
        success: true,
        message: isActive ? '密钥已启用' : '密钥已禁用',
        keyId: key.id,
        isActive,
      })
    } catch (error) {
      // CRS服务不可用
      if (error instanceof CrsUnavailableError) {
        return NextResponse.json(
          { error: 'CRS服务暂时不可用，请稍后重试' },
          { status: 503 }
        )
      }

      // CRS API错误
      if (error instanceof CrsApiError) {
        return NextResponse.json(
          { error: 'CRS服务异常，请稍后重试' },
          { status: 502 }
        )
      }

      // 未知错误
      throw error
    }
  } catch (error) {
    console.error('Failed to update key status:', error)
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    )
  }
}
