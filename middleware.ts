/**
 * Next.js 中间件 - 路由保护和认证检查
 * Sprint 11 - Phase 5 🟢 GREEN
 *
 * 功能:
 * - 保护需要认证的路由
 * - JWT Token 验证
 * - 自动重定向到登录页
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

/**
 * 受保护的路由前缀
 */
const PROTECTED_ROUTES = [
  '/dashboard',
  '/api/keys',
  '/api/user',
  '/api/stats',
  '/api/dashboard',
  '/api/monitor',
  '/api/install',
  '/api/debug', // 用于测试认证
]

/**
 * 公开路由（不需要认证）
 */
const PUBLIC_ROUTES = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/api/auth/login',
  '/api/auth/register',
  '/api/health',
]

/**
 * 检查路径是否需要保护
 */
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route))
}

/**
 * 检查路径是否为公开路由
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route))
}

/**
 * 中间件主函数
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. 公开路由直接放行
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // 2. 检查是否为受保护路由
  if (!isProtectedRoute(pathname)) {
    return NextResponse.next()
  }

  // 3. 获取 Authorization header
  const authHeader = request.headers.get('authorization')
  const cookieToken = request.cookies.get('accessToken')?.value

  // 使用 Authorization header 或 Cookie 中的 token
  const token = authHeader || (cookieToken ? `Bearer ${cookieToken}` : null)

  // 4. 验证 Token
  try {
    if (!token) {
      throw new Error('Token 缺失')
    }

    // 验证 Token（会抛出异常如果无效）
    verifyToken(token)

    // Token 有效，允许访问
    return NextResponse.next()
  } catch (error) {
    // 5. Token 无效或缺失

    // API 路由：返回 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: '未授权访问，请先登录' },
        { status: 401 }
      )
    }

    // 页面路由：重定向到登录页
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)

    return NextResponse.redirect(loginUrl)
  }
}

/**
 * 中间件配置
 * 定义哪些路由会触发中间件
 */
export const config = {
  matcher: [
    /*
     * 匹配所有路径除了:
     * - _next/static (静态文件)
     * - _next/image (图片优化文件)
     * - favicon.ico (网站图标)
     * - public 文件夹 (.svg, .png, .jpg, .jpeg, .gif, .webp)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
