/**
 * CRS集成测试
 * 验证与真实CRS系统的对接
 *
 * 运行前需要：
 * 1. 确保CRS服务可访问 (https://claude.just-play.fun)
 * 2. 设置环境变量: CRS_BASE_URL, CRS_ADMIN_USERNAME, CRS_ADMIN_PASSWORD
 *
 * 运行方式: npm test -- tests/integration/crs-integration.test.ts
 *
 * 注意：这些测试会在真实CRS环境创建/删除数据！
 * @jest-environment node
 */

import { crsClient } from '@/lib/infrastructure/external/crs-client'

describe('CRS Integration Tests', () => {
  let testKeyId: string

  // 跳过集成测试（除非设置环境变量）
  const skipIntegration = !process.env.RUN_INTEGRATION_TESTS
  const testIf = skipIntegration ? test.skip : test

  beforeAll(() => {
    if (skipIntegration) {
      console.log(
        '⏭️  跳过集成测试 (设置 RUN_INTEGRATION_TESTS=true 来运行)'
      )
    }
  })

  testIf('应该能够认证CRS系统', async () => {
    const token = await crsClient.ensureAuthenticated()
    expect(token).toBeTruthy()
    expect(typeof token).toBe('string')
  })

  testIf('应该能够获取仪表板数据', async () => {
    const dashboard = await crsClient.getDashboard()
    expect(dashboard).toHaveProperty('totalKeys')
    expect(dashboard).toHaveProperty('activeKeys')
    expect(typeof dashboard.totalKeys).toBe('number')
  })

  testIf('应该能够创建密钥', async () => {
    const result = await crsClient.createKey({
      name: `integration_test_${Date.now()}`,
      description: 'Integration test key - safe to delete',
    })

    expect(result).toHaveProperty('id')
    expect(result).toHaveProperty('key')
    expect(result.key).toMatch(/^sk-ant-/) // 验证密钥格式

    testKeyId = result.id // 保存用于后续测试
  })

  testIf('应该能够列出密钥', async () => {
    const keys = await crsClient.listKeys()
    expect(Array.isArray(keys)).toBe(true)
    if (testKeyId) {
      const createdKey = keys.find((k: any) => k.id === testKeyId)
      expect(createdKey).toBeTruthy()
    }
  })

  testIf('应该能够更新密钥', async () => {
    if (!testKeyId) {
      throw new Error('No test key created')
    }

    const result = await crsClient.updateKey(testKeyId, {
      description: 'Updated integration test',
      status: 'PAUSED',
    })

    expect(result).toHaveProperty('success')
    expect(result.success).toBe(true)
  })

  testIf('应该能够获取密钥统计', async () => {
    if (!testKeyId) {
      throw new Error('No test key created')
    }

    const stats = await crsClient.getKeyStats(testKeyId)
    expect(stats).toHaveProperty('totalTokens')
    expect(stats).toHaveProperty('totalRequests')
    expect(typeof stats.totalTokens).toBe('number')
  })

  testIf('应该能够删除密钥', async () => {
    if (!testKeyId) {
      throw new Error('No test key created')
    }

    const result = await crsClient.deleteKey(testKeyId)
    expect(result).toHaveProperty('success')
    expect(result.success).toBe(true)
  })

  testIf('删除不存在的密钥应该返回404', async () => {
    await expect(crsClient.deleteKey('non_existent_key')).rejects.toThrow()
  })
})
