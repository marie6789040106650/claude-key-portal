/**
 * CRS连接测试脚本
 * 验证CRS Admin API是否可用
 *
 * 运行方式: npx tsx scripts/test-crs-connection.ts
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

async function testCrsConnection() {
  console.log('🔍 开始测试CRS连接...\n')

  // 动态导入crsClient（确保环境变量已设置）
  const { crsClient } = await import('@/lib/infrastructure/external/crs-client')

  try {
    // 1. 测试认证
    console.log('1️⃣ 测试CRS认证...')
    const token = await crsClient.ensureAuthenticated()
    console.log('✅ 认证成功!')
    console.log(`   Token: ${token.substring(0, 20)}...\n`)

    // 2. 测试获取仪表板数据
    console.log('2️⃣ 测试获取仪表板数据...')
    const dashboard = await crsClient.getDashboard()
    console.log('✅ 仪表板数据获取成功!')
    console.log('   数据:', JSON.stringify(dashboard, null, 2), '\n')

    // 3. 测试创建密钥
    console.log('3️⃣ 测试创建密钥...')
    const testKey = await crsClient.createKey({
      name: `integration_test_${Date.now()}`,
      description: 'Integration test key - safe to delete',
    })
    console.log('✅ 密钥创建成功!')
    console.log('   密钥ID:', testKey.id)
    console.log('   密钥值:', testKey.key.substring(0, 20), '...')
    console.log('   名称:', testKey.name)
    console.log('   状态:', testKey.status)
    console.log()

    // 4. 测试更新密钥
    console.log('4️⃣ 测试更新密钥...')
    await crsClient.updateKey(testKey.id, {
      description: 'Updated description',
      status: 'PAUSED',
    })
    console.log('✅ 密钥更新成功!\n')

    // 5. 测试获取密钥统计
    console.log('5️⃣ 测试获取密钥统计...')
    const stats = await crsClient.getKeyStats(testKey.key)
    console.log('✅ 统计数据获取成功!')
    console.log('   总Token数:', stats.totalTokens)
    console.log('   总请求数:', stats.totalRequests)
    console.log('   输入Token:', stats.inputTokens)
    console.log('   输出Token:', stats.outputTokens)
    console.log('   成本:', stats.cost)
    console.log()

    // 6. 测试删除密钥
    console.log('6️⃣ 测试删除密钥...')
    await crsClient.deleteKey(testKey.id)
    console.log('✅ 密钥删除成功!\n')

    console.log('🎉 所有CRS API测试通过!')
    process.exit(0)
  } catch (error: any) {
    console.error('❌ CRS测试失败:', error)
    console.error('错误详情:', {
      name: error.name,
      message: error.message,
      statusCode: error.statusCode,
    })
    process.exit(1)
  }
}

// 运行测试
testCrsConnection()
