import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'

// 加载环境变量
config()

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['query', 'info', 'warn', 'error'],
})

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...')
    console.log('📍 URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'))

    // 简单查询测试
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Database connection successful!')
    console.log('📊 Test query result:', result)

    // 检查表是否存在
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `
    console.log('📋 Existing tables:', tables)
  } catch (error) {
    console.error('❌ Database connection failed!')
    console.error('Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()
