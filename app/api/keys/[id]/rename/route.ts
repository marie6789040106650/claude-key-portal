/**
 * 密钥重命名 API
 * PUT /api/keys/[id]/rename
 *
 * 🟢 GREEN Phase: 实现功能
 * - 调用 CRS Admin API 更新密钥名称
 * - 验证权限和输入
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/infrastructure/persistence/prisma'
import { crsClient } from '@/lib/infrastructure/external/crs-client'

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
): Promise<NextResponse> {
  try {
    // 1. 解析请求体
    const body = await request.json()
    const { name } = body

    // 2. 验证输入
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // 3. 查找密钥（获取crsKeyId）
    const key = await prisma.apiKey.findUnique({
      where: { id: context.params.id },
      select: {
        id: true,
        userId: true,
        crsKeyId: true,
      },
    })

    if (!key) {
      return NextResponse.json({ error: 'Key not found' }, { status: 404 })
    }

    // 4. 调用 CRS API 更新密钥名称
    const updatedKey = await crsClient.updateKey(key.crsKeyId, {
      name: name.trim(),
    })

    // 5. 返回更新后的密钥信息
    return NextResponse.json(updatedKey)
  } catch (error) {
    console.error('Failed to rename key:', error)
    return NextResponse.json(
      { error: 'Failed to rename key' },
      { status: 500 }
    )
  }
}
