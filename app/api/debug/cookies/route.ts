/**
 * Cookie调试endpoint
 * 用于测试Cookie是否正确传递到服务器
 *
 * 注意：这个endpoint被中间件保护，需要认证
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAuthenticatedUser } from '@/lib/auth'

export async function GET(request: Request) {
  // 方法1: 使用cookies()
  const cookieStore = cookies()
  const accessTokenFromStore = cookieStore.get('accessToken')
  const refreshTokenFromStore = cookieStore.get('refreshToken')

  // 方法2: 从request header读取
  const cookieHeader = request.headers.get('cookie')

  // 方法3: 使用getAuthenticatedUser (这是API routes应该用的)
  const user = await getAuthenticatedUser(request)

  return NextResponse.json({
    method1_cookieStore: {
      accessToken: accessTokenFromStore?.value ? 'EXISTS (length: ' + accessTokenFromStore.value.length + ')' : 'NOT_FOUND',
      refreshToken: refreshTokenFromStore?.value ? 'EXISTS' : 'NOT_FOUND',
    },
    method2_header: {
      cookieHeader: cookieHeader || 'NOT_FOUND',
      parsed: cookieHeader
        ? {
            hasAccessToken: cookieHeader.includes('accessToken='),
            hasRefreshToken: cookieHeader.includes('refreshToken='),
          }
        : null,
    },
    method3_getAuthenticatedUser: {
      authenticated: user !== null,
      userId: user?.id || 'NOT_FOUND',
    },
    middlewareNote: '如果你看到这个响应，说明中间件已经通过了认证检查',
  })
}
