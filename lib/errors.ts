/**
 * 错误处理工具函数
 */

import { NextResponse } from 'next/server'

/**
 * 处理CRS API错误
 * 根据错误类型返回适当的HTTP响应
 */
export function handleCrsError(error: any): NextResponse {
  // CRS服务不可用
  if (error.name === 'CrsUnavailableError' || error.message?.includes('CRS service')) {
    return NextResponse.json(
      { error: 'CRS服务暂时不可用，请稍后重试' },
      { status: 503 }
    )
  }

  // CRS业务错误（带状态码）
  if (error.statusCode) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    )
  }

  // 未知错误，继续抛出
  throw error
}
