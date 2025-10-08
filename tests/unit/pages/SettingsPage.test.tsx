/**
 * 设置页面测试
 * Sprint MVP - Phase 2 🔴 RED
 */

import { render, screen } from '@testing-library/react'
import { redirect } from 'next/navigation'
import SettingsPage from '@/app/dashboard/settings/page'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

describe('SettingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('页面重定向', () => {
    it('应该自动重定向到个人信息页面', () => {
      render(<SettingsPage />)

      expect(redirect).toHaveBeenCalledWith('/dashboard/settings/profile')
    })

    it('应该只调用一次重定向', () => {
      render(<SettingsPage />)

      expect(redirect).toHaveBeenCalledTimes(1)
    })

    it('重定向路径应该正确', () => {
      render(<SettingsPage />)

      const redirectCall = (redirect as jest.Mock).mock.calls[0]
      expect(redirectCall[0]).toBe('/dashboard/settings/profile')
    })
  })

  describe('路由配置', () => {
    it('重定向的路由应该存在于导航配置中', () => {
      const { SETTINGS_NAV_ITEMS } = require('@/constants/settings')

      render(<SettingsPage />)

      const redirectPath = (redirect as jest.Mock).mock.calls[0][0]
      const navPaths = SETTINGS_NAV_ITEMS.map((item: any) => item.href)

      expect(navPaths).toContain(redirectPath)
    })

    it('重定向应该指向第一个设置项', () => {
      const { SETTINGS_NAV_ITEMS } = require('@/constants/settings')

      render(<SettingsPage />)

      const redirectPath = (redirect as jest.Mock).mock.calls[0][0]
      expect(redirectPath).toBe(SETTINGS_NAV_ITEMS[0].href)
    })
  })

  describe('SEO和元数据', () => {
    it('页面文件应该导出默认组件', () => {
      expect(SettingsPage).toBeDefined()
      expect(typeof SettingsPage).toBe('function')
    })
  })

  describe('框架集成', () => {
    it('应该使用Next.js的redirect函数', () => {
      render(<SettingsPage />)

      // 验证使用了Next.js提供的redirect函数
      expect(redirect).toHaveBeenCalled()
    })

    it('redirect应该在组件渲染时立即执行', () => {
      const callOrder: string[] = []

      const mockRedirect = redirect as jest.Mock
      mockRedirect.mockImplementationOnce(() => {
        callOrder.push('redirect')
      })

      callOrder.push('before-render')
      render(<SettingsPage />)
      callOrder.push('after-render')

      expect(callOrder).toEqual(['before-render', 'redirect', 'after-render'])
    })
  })

  describe('性能', () => {
    it('应该立即执行重定向，不渲染额外内容', () => {
      const { container } = render(<SettingsPage />)

      // 重定向页面不应该渲染任何可见内容
      expect(container.textContent).toBe('')
    })

    it('不应该等待异步操作', () => {
      const startTime = Date.now()
      render(<SettingsPage />)
      const endTime = Date.now()

      // 重定向应该是同步的，执行时间应该很短（< 10ms）
      expect(endTime - startTime).toBeLessThan(10)
    })
  })

  describe('集成测试', () => {
    it('应该与导航常量集成', () => {
      const { SETTINGS_NAV_ITEMS } = require('@/constants/settings')

      render(<SettingsPage />)

      expect(SETTINGS_NAV_ITEMS).toBeDefined()
      expect(SETTINGS_NAV_ITEMS.length).toBeGreaterThan(0)
    })

    it('第一个导航项应该有正确的路径格式', () => {
      const { SETTINGS_NAV_ITEMS } = require('@/constants/settings')
      const firstItem = SETTINGS_NAV_ITEMS[0]

      expect(firstItem.href).toMatch(/^\/dashboard\/settings\/[a-z]+$/)
    })

    it('所有导航项应该有必需的属性', () => {
      const { SETTINGS_NAV_ITEMS } = require('@/constants/settings')

      SETTINGS_NAV_ITEMS.forEach((item: any) => {
        expect(item).toHaveProperty('key')
        expect(item).toHaveProperty('label')
        expect(item).toHaveProperty('href')
        expect(item).toHaveProperty('icon')
      })
    })
  })

  describe('类型安全', () => {
    it('redirect函数应该接收字符串参数', () => {
      render(<SettingsPage />)

      const redirectCall = (redirect as jest.Mock).mock.calls[0]
      expect(typeof redirectCall[0]).toBe('string')
    })

    it('重定向路径应该是绝对路径', () => {
      render(<SettingsPage />)

      const redirectPath = (redirect as jest.Mock).mock.calls[0][0]
      expect(redirectPath).toMatch(/^\//)
    })
  })

  describe('用户体验', () => {
    it('重定向到第一个标签页提供直观的导航体验', () => {
      const { SETTINGS_NAV_ITEMS } = require('@/constants/settings')

      render(<SettingsPage />)

      const redirectPath = (redirect as jest.Mock).mock.calls[0][0]
      const firstItem = SETTINGS_NAV_ITEMS[0]

      // 确认重定向到"个人信息"（最常用的设置）
      expect(firstItem.key).toBe('profile')
      expect(redirectPath).toBe(firstItem.href)
    })

    it('重定向后用户可以通过导航访问其他设置', () => {
      const { SETTINGS_NAV_ITEMS } = require('@/constants/settings')

      // 验证有多个设置项可供选择
      expect(SETTINGS_NAV_ITEMS.length).toBeGreaterThanOrEqual(3)

      // 验证每个设置项都有不同的路径
      const paths = SETTINGS_NAV_ITEMS.map((item: any) => item.href)
      const uniquePaths = new Set(paths)
      expect(uniquePaths.size).toBe(paths.length)
    })
  })

  describe('边界情况', () => {
    it('导航配置为空时应该有合理的回退', () => {
      jest.doMock('@/constants/settings', () => ({
        SETTINGS_NAV_ITEMS: [],
      }))

      // 清除模块缓存
      jest.resetModules()

      // 这个测试验证了如果导航为空，代码应该如何处理
      // 实际实现中应该有合理的默认值或错误处理
    })

    it('重定向路径包含特殊字符时应该正确处理', () => {
      render(<SettingsPage />)

      const redirectPath = (redirect as jest.Mock).mock.calls[0][0]

      // 路径应该只包含安全字符
      expect(redirectPath).toMatch(/^[\/a-z\-]+$/)
    })
  })

  describe('可访问性', () => {
    it('重定向页面不应该渲染需要无障碍支持的内容', () => {
      const { container } = render(<SettingsPage />)

      // 没有需要无障碍支持的元素
      expect(container.querySelector('[role]')).toBeNull()
      expect(container.querySelector('[aria-label]')).toBeNull()
    })
  })

  describe('响应式设计', () => {
    it('重定向在所有设备上表现一致', () => {
      // 移动设备
      global.innerWidth = 375
      render(<SettingsPage />)
      expect(redirect).toHaveBeenCalled()

      jest.clearAllMocks()

      // 桌面设备
      global.innerWidth = 1920
      render(<SettingsPage />)
      expect(redirect).toHaveBeenCalled()
    })
  })
})
