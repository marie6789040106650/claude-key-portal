/**
 * 首页
 * 面向未登录用户，展示产品介绍和注册/登录入口
 */

import { Navbar } from '@/components/home/Navbar'
import { HeroSection } from '@/components/home/HeroSection'
import { FeaturesSection } from '@/components/home/FeaturesSection'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
    </div>
  )
}
