/**
 * 数据库连接测试
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// 加载环境变量
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testDatabase() {
  try {
    console.log('🔍 测试数据库连接...')

    // 1. 测试基本连接
    await prisma.$connect()
    console.log('✅ 数据库连接成功')

    // 2. 测试查询
    const userCount = await prisma.user.count()
    console.log(`✅ 用户数量: ${userCount}`)

    // 3. 测试创建用户（带回滚）
    console.log('\n🧪 测试创建用户...')

    const testEmail = `test-${Date.now()}@example.com`
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash: 'test_hash',
        nickname: 'Test User',
      },
    })

    console.log('✅ 用户创建成功:', {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
    })

    // 4. 清理测试数据
    await prisma.user.delete({
      where: { id: user.id },
    })
    console.log('✅ 测试数据已清理')

    console.log('\n✅ 所有数据库测试通过')
  } catch (error) {
    console.error('❌ 数据库测试失败:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabase()
