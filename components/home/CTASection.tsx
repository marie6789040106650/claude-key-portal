/**
 * 首页 - Call to Action Section
 */

import Link from 'next/link'

export function CTASection() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          准备好开始了吗？
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          立即注册，开始管理您的 Claude API 密钥
        </p>
        <Link
          href="/auth/register"
          className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition"
        >
          免费注册
        </Link>
      </div>
    </div>
  )
}
