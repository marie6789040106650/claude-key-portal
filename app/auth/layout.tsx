/**
 * 认证布局
 * 包含登录、注册等页面
 */

// 强制动态渲染（因为使用了useSearchParams）
export const dynamic = 'force-dynamic'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
