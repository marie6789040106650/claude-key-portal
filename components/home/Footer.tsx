/**
 * 首页 - Footer 页脚
 */

import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-600 text-sm mb-4 md:mb-0">
            © 2025 Claude Key Portal. All rights reserved.
          </div>
          <div className="flex space-x-6 text-sm">
            <Link href="#" className="text-gray-600 hover:text-blue-600">
              使用条款
            </Link>
            <Link href="#" className="text-gray-600 hover:text-blue-600">
              隐私政策
            </Link>
            <Link href="#" className="text-gray-600 hover:text-blue-600">
              文档
            </Link>
            <Link href="#" className="text-gray-600 hover:text-blue-600">
              支持
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
