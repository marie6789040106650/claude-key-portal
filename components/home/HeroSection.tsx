/**
 * 首页 Hero Section
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function HeroSection() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Claude Key Portal
        </h1>
        <p className="text-xl text-gray-600 mb-4">
          CRS (Claude Relay Service) 的用户管理门户
        </p>
        <p className="text-lg text-gray-500 mb-10">
          让 Claude API 密钥管理变得简单高效
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/auth/register">
            <Button size="lg" className="text-lg px-8">
              开始使用
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              立即登录
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
