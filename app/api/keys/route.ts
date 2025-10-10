/**
 * API密钥管理API
 * GET /api/keys - 列出密钥
 * POST /api/keys - 创建密钥
 */

import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'

/**
 * GET /api/keys - 列出API密钥
 */
export async function GET(request: Request) {
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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') || undefined
    const tag = searchParams.get('tag') || undefined
    const sync = searchParams.get('sync') === 'true'

    // 3. 创建UseCase实例
    const { ListKeysUseCase } = await import('@/lib/application/key')
    const { keyRepository } = await import('@/lib/infrastructure/persistence/repositories')
    const { crsClient } = await import('@/lib/infrastructure/external/crs-client')
    const listKeysUseCase = new ListKeysUseCase(keyRepository, crsClient)

    // 4. 执行列表查询
    const result = await listKeysUseCase.execute({
      userId,
      page,
      limit,
      status: status as any,
      tag,
      sync,
    })

    // 5. 处理结果
    if (result.isSuccess) {
      // 字段映射：添加totalRequests别名（前端兼容性）
      const response = {
        ...result.value,
        keys: result.value!.keys.map(key => ({
          ...key,
          totalRequests: key.totalCalls,  // 添加别名字段
        })),
      }
      return NextResponse.json(response, { status: 200 })
    } else {
      const error = result.error!

      if (error.name === 'ValidationError') {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  } catch (error: any) {
    console.error('List keys error:', error)
    return NextResponse.json(
      { error: '系统错误，请稍后重试' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/keys - 创建API密钥
 */
export async function POST(request: Request) {
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
    const { CreateKeyUseCase } = await import('@/lib/application/key')
    const { keyRepository } = await import('@/lib/infrastructure/persistence/repositories')
    const { crsClient } = await import('@/lib/infrastructure/external/crs-client')
    const createKeyUseCase = new CreateKeyUseCase(keyRepository, crsClient)

    // 4. 执行创建流程
    const result = await createKeyUseCase.execute({
      userId,
      ...body,
    })

    // 5. 处理结果
    if (result.isSuccess) {
      return NextResponse.json(
        {
          key: result.value,
          warning: '请妥善保管密钥，此密钥只会显示一次！',
        },
        { status: 201 }
      )
    } else {
      const error = result.error!

      if (error.name === 'ValidationError') {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      if (error.name === 'ConflictError') {
        return NextResponse.json({ error: error.message }, { status: 409 })
      }

      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Create key error:', error)
    return NextResponse.json(
      { error: '系统错误，请稍后重试' },
      { status: 500 }
    )
  }
}
