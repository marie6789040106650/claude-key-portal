/**
 * CRS Stats 集成测试脚本
 * 验证 Dashboard 和 Stats API 与 CRS 的集成
 *
 * 运行方式: npx tsx scripts/test-crs-stats.ts
 */

// 在任何import之前加载环境变量
import { readFileSync } from 'fs'
import { resolve } from 'path'

// 加载.env.local
const envPath = resolve(process.cwd(), '.env.local')
try {
  const envContent = readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...values] = trimmed.split('=')
      if (key && values.length > 0) {
        process.env[key.trim()] = values.join('=').trim()
      }
    }
  })
} catch (error) {
  console.warn('⚠️  无法加载.env.local文件')
}

async function testCrsStats() {
  console.log('🔍 开始测试 Sprint 3 - CRS Stats 集成...\n')

  // 动态导入crsClient（确保环境变量已设置）
  const { crsClient } = await import('@/lib/crs-client')

  let testKeyId: string | undefined
  let testApiKey: string | undefined

  try {
    // ============================================
    // 测试 1: CRS 认证
    // ============================================
    console.log('1️⃣  测试 CRS 认证...')
    const token = await crsClient.ensureAuthenticated()
    console.log('✅ 认证成功!')
    console.log(`   Token: ${token.substring(0, 20)}...\n`)

    // ============================================
    // 测试 2: Dashboard 数据 (getDashboard)
    // ============================================
    console.log('2️⃣  测试 Dashboard 数据获取...')
    const dashboard = await crsClient.getDashboard()
    console.log('✅ Dashboard 数据获取成功!')
    console.log('   Overview:')
    console.log(`     总密钥数: ${dashboard.overview?.totalApiKeys || 0}`)
    console.log(`     活跃密钥: ${dashboard.overview?.activeApiKeys || 0}`)
    console.log(`     总Token使用: ${dashboard.overview?.totalTokensUsed || 0}`)
    console.log(`     总请求数: ${dashboard.overview?.totalRequestsUsed || 0}`)
    console.log('   Recent Activity:')
    console.log(
      `     今日创建密钥: ${dashboard.recentActivity?.apiKeysCreatedToday || 0}`
    )
    console.log(
      `     今日请求数: ${dashboard.recentActivity?.requestsToday || 0}`
    )
    console.log(
      `     今日Token数: ${dashboard.recentActivity?.tokensToday || 0}\n`
    )

    // ============================================
    // 测试 3: 创建测试密钥 (用于 Stats 测试)
    // ============================================
    console.log('3️⃣  创建测试密钥...')
    const testKey = await crsClient.createKey({
      name: `stats_test_${Date.now()}`,
      isActive: true,
    })
    testKeyId = testKey.id
    testApiKey = testKey.key
    console.log('✅ 测试密钥创建成功!')
    console.log(`   密钥ID: ${testKeyId}`)
    console.log(`   密钥值: ${testApiKey?.substring(0, 15)}...\n`)

    // ============================================
    // 测试 4: 密钥统计 (getKeyStats)
    // ============================================
    console.log('4️⃣  测试密钥统计获取...')
    if (!testApiKey) {
      throw new Error('测试密钥值不存在')
    }
    const stats = await crsClient.getKeyStats(testApiKey)
    console.log('✅ 密钥统计获取成功!')
    console.log(`   总Token数: ${stats.totalTokens}`)
    console.log(`   总请求数: ${stats.totalRequests}`)
    console.log(`   输入Token: ${stats.inputTokens}`)
    console.log(`   输出Token: ${stats.outputTokens}`)
    console.log(`   缓存创建Token: ${stats.cacheCreateTokens}`)
    console.log(`   缓存读取Token: ${stats.cacheReadTokens}`)
    console.log(`   成本: $${stats.cost}\n`)

    // ============================================
    // 测试 5: 验证 Stats 响应格式
    // ============================================
    console.log('5️⃣  验证 Stats 响应格式...')
    const requiredFields = [
      'totalTokens',
      'totalRequests',
      'inputTokens',
      'outputTokens',
      'cacheCreateTokens',
      'cacheReadTokens',
      'cost',
    ]
    const missingFields = requiredFields.filter(
      (field) => !(field in stats)
    )
    if (missingFields.length > 0) {
      throw new Error(`Stats 响应缺少字段: ${missingFields.join(', ')}`)
    }
    console.log('✅ Stats 响应格式验证通过!')
    console.log(`   包含所有必需字段: ${requiredFields.join(', ')}\n`)

    // ============================================
    // 清理: 删除测试密钥
    // ============================================
    if (testKeyId) {
      console.log('6️⃣  清理测试数据...')
      await crsClient.deleteKey(testKeyId)
      console.log('✅ 测试密钥已删除!\n')
    }

    // ============================================
    // 总结
    // ============================================
    console.log('═══════════════════════════════════════════')
    console.log('✅ Sprint 3 CRS集成测试全部通过!')
    console.log('═══════════════════════════════════════════')
    console.log('测试覆盖:')
    console.log('  ✅ CRS 认证')
    console.log('  ✅ Dashboard 数据获取')
    console.log('  ✅ 密钥统计获取')
    console.log('  ✅ Stats 响应格式验证')
    console.log('  ✅ 测试数据清理')
    console.log('═══════════════════════════════════════════\n')

    process.exit(0)
  } catch (error: any) {
    console.error('\n❌ 测试失败!')
    console.error('错误:', error.message)
    if (error.stack) {
      console.error('堆栈:', error.stack)
    }

    // 清理测试数据
    if (testKeyId) {
      try {
        console.log('\n🧹 尝试清理测试数据...')
        const { crsClient } = await import('@/lib/crs-client')
        await crsClient.deleteKey(testKeyId)
        console.log('✅ 测试密钥已删除')
      } catch (cleanupError) {
        console.error('⚠️  清理失败:', cleanupError)
      }
    }

    process.exit(1)
  }
}

// 运行测试
testCrsStats()
