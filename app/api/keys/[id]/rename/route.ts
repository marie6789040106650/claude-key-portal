/**
 * 密钥重命名 API
 * PUT /api/keys/[id]/rename
 *
 * 🟢 GREEN Phase: 实现功能
 * - 调用 CRS Admin API 更新密钥名称
 * - 验证权限和输入
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/infrastructure/persistence/prisma'
import { crsClient } from '@/lib/infrastructure/external/crs-client'

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
): Promise<NextResponse> {
  try {
    // 1. 验证认证（支持Cookie和Header双重认证）
    const user = await getAuthenticatedUser(request)

    if (!user) {
      console.error('[Rename API] Authentication failed: No valid token found')
      return NextResponse.json(
        { error: '未登录或Token缺失' },
        { status: 401 }
      )
    }

    const userId = user.id
    console.log(`[Rename API] Authenticated user: ${userId}`)

    // 2. 解析请求体
    const body = await request.json()
    const { name } = body

    // 3. 验证输入
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // 4. 查找密钥（获取crsKeyId）
    console.log(`[Rename API] Finding key: ${context.params.id}`)
    const key = await prisma.apiKey.findUnique({
      where: { id: context.params.id },
      select: {
        id: true,
        userId: true,
        crsKeyId: true,
        name: true,
      },
    })

    if (!key) {
      console.error(`[Rename API] Key not found: ${context.params.id}`)
      return NextResponse.json({ error: 'Key not found' }, { status: 404 })
    }

    console.log(`[Rename API] Key found: ${key.name}, owner: ${key.userId}`)

    // 5. 验证权限
    if (key.userId !== userId) {
      console.error(
        `[Rename API] Permission denied: key owner=${key.userId}, requester=${userId}`
      )
      return NextResponse.json(
        { error: '无权操作此密钥' },
        { status: 403 }
      )
    }

    // 6. 调用 CRS API 更新密钥名称
    console.log(`[Rename API] Updating CRS key: ${key.crsKeyId} -> ${name.trim()}`)
    await crsClient.updateKey(key.crsKeyId, {
      name: name.trim(),
    })

    // 7. 更新本地数据库
    console.log(`[Rename API] Updating local database`)
    const updatedKey = await prisma.apiKey.update({
      where: { id: context.params.id },
      data: { name: name.trim() },
      select: {
        id: true,
        name: true,
      },
    })

    console.log(`[Rename API] Success: ${key.name} -> ${updatedKey.name}`)

    // 8. 返回更新后的密钥信息
    return NextResponse.json(updatedKey)
  } catch (error) {
    console.error('Failed to rename key:', error)
    return NextResponse.json(
      { error: 'Failed to rename key' },
      { status: 500 }
    )
  }
}
