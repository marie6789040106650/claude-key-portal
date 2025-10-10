/**
 * API密钥单个操作API
 * GET /api/keys/[id] - 获取密钥详情
 * PUT /api/keys/[id] - 更新密钥（完整更新）
 * PATCH /api/keys/[id] - 更新密钥（部分更新）
 * DELETE /api/keys/[id] - 删除密钥
 */

import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/infrastructure/persistence/prisma'

/**
 * GET /api/keys/[id] - 获取密钥详情
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. 验证JWT Token（支持Cookie和Header双重认证）
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: '未登录或Token缺失' },
        { status: 401 }
      )
    }
    const userId = user.id

    // 2. 查询密钥
    const key = await prisma.apiKey.findUnique({
      where: { id: params.id },
    })

    if (!key) {
      return NextResponse.json({ error: '密钥不存在' }, { status: 404 })
    }

    // 3. 验证权限
    if (key.userId !== userId) {
      return NextResponse.json({ error: '无权访问此密钥' }, { status: 403 })
    }

    // 4. 返回密钥信息（脱敏处理）
    const { crsKey, totalCalls, totalTokens, ...keyData } = key
    return NextResponse.json({
      ...keyData,
      crsKey: crsKey ? `${crsKey.substring(0, 12)}...${crsKey.substring(crsKey.length - 8)}` : null, // 只显示部分密钥
      totalCalls: Number(totalCalls),
      totalTokens: Number(totalTokens),
    }, { status: 200 })
  } catch (error: any) {
    console.error('Get key error:', error)
    return NextResponse.json(
      { error: '系统错误，请稍后重试' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/keys/[id] - 更新API密钥（完整更新）
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. 验证JWT Token（支持Cookie和Header双重认证）
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: '未登录或Token缺失' },
        { status: 401 }
      )
    }
    const userId = user.id

    // 2. 解析请求体
    const body = await request.json()

    // 3. 创建UseCase实例
    const { UpdateKeyUseCase } = await import('@/lib/application/key')
    const { keyRepository } = await import('@/lib/infrastructure/persistence/repositories')
    const { crsClient } = await import('@/lib/infrastructure/external/crs-client')
    const updateKeyUseCase = new UpdateKeyUseCase(keyRepository, crsClient)

    // 4. 执行更新流程
    const result = await updateKeyUseCase.execute({
      keyId: params.id,
      userId,
      ...body,
    })

    // 5. 处理结果
    if (result.isSuccess) {
      return NextResponse.json({ key: result.value }, { status: 200 })
    } else {
      const error = result.error!

      if (error.name === 'ValidationError') {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      if (error.name === 'NotFoundError') {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }

      if (error.name === 'ForbiddenError') {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }

      if (error.name === 'ConflictError') {
        return NextResponse.json({ error: error.message }, { status: 409 })
      }

      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Update key (PUT) error:', error)
    return NextResponse.json(
      { error: '系统错误，请稍后重试' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/keys/[id] - 更新API密钥（部分更新）
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. 验证JWT Token（支持Cookie和Header双重认证）
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: '未登录或Token缺失' },
        { status: 401 }
      )
    }
    const userId = user.id

    // 2. 解析请求体
    const body = await request.json()

    // 3. 创建UseCase实例
    const { UpdateKeyUseCase } = await import('@/lib/application/key')
    const { keyRepository } = await import('@/lib/infrastructure/persistence/repositories')
    const { crsClient } = await import('@/lib/infrastructure/external/crs-client')
    const updateKeyUseCase = new UpdateKeyUseCase(keyRepository, crsClient)

    // 4. 执行更新流程
    const result = await updateKeyUseCase.execute({
      keyId: params.id,
      userId,
      ...body,
    })

    // 5. 处理结果
    if (result.isSuccess) {
      return NextResponse.json({ key: result.value }, { status: 200 })
    } else {
      const error = result.error!

      if (error.name === 'ValidationError') {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      if (error.name === 'NotFoundError') {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }

      if (error.name === 'ForbiddenError') {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }

      if (error.name === 'ConflictError') {
        return NextResponse.json({ error: error.message }, { status: 409 })
      }

      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Update key error:', error)
    return NextResponse.json(
      { error: '系统错误，请稍后重试' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/keys/[id] - 删除API密钥
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. 验证JWT Token（支持Cookie和Header双重认证）
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: '未登录或Token缺失' },
        { status: 401 }
      )
    }
    const userId = user.id

    // 2. 解析查询参数
    const { searchParams } = new URL(request.url)
    const permanent = searchParams.get('permanent') === 'true'
    const force = searchParams.get('force') === 'true'

    // 3. 创建UseCase实例
    const { DeleteKeyUseCase } = await import('@/lib/application/key')
    const { keyRepository } = await import('@/lib/infrastructure/persistence/repositories')
    const { crsClient } = await import('@/lib/infrastructure/external/crs-client')
    const deleteKeyUseCase = new DeleteKeyUseCase(keyRepository, crsClient)

    // 4. 执行删除流程
    const result = await deleteKeyUseCase.execute({
      keyId: params.id,
      userId,
      permanent,
      force,
    })

    // 5. 处理结果
    if (result.isSuccess) {
      const deleteResult = result.value!
      const response: any = {
        success: true,
        deleted: deleteResult.deleted,
        message: deleteResult.permanent ? '密钥已永久删除' : '密钥已删除',
      }

      if (deleteResult.alreadyDeleted) {
        response.alreadyDeleted = true
      }

      if (deleteResult.warning) {
        response.warning = deleteResult.warning
      }

      return NextResponse.json(response, { status: 200 })
    } else {
      const error = result.error!

      if (error.name === 'NotFoundError') {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }

      if (error.name === 'ForbiddenError') {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }

      if (error.name === 'CrsUnavailableError') {
        return NextResponse.json({ error: error.message }, { status: 503 })
      }

      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Delete key error:', error)
    return NextResponse.json(
      { error: '系统错误，请稍后重试' },
      { status: 500 }
    )
  }
}
