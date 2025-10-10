#!/usr/bin/env npx tsx
/**
 * 数据库Schema检查脚本
 * 用于验证数据库表结构是否与Prisma Schema一致
 */

import * as dotenv from 'dotenv'
import pkg from 'pg'
const { Client } = pkg

// 加载环境变量
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

async function checkSchema() {
  // 使用DIRECT_URL绕过连接池问题
  const client = new Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  })

  try {
    console.log('🔍 连接数据库...')
    await client.connect()
    console.log('✅ 连接成功\n')

    // 检查api_keys表结构
    console.log('📋 api_keys 表结构:')
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'api_keys'
      ORDER BY ordinal_position;
    `)

    if (result.rows.length === 0) {
      console.log('❌ api_keys 表不存在！')
      console.log('\n需要运行数据库迁移:')
      console.log('  npx prisma migrate dev --name init')
      process.exit(1)
    }

    console.log('列名\t\t\t类型\t\t可空\t默认值')
    console.log('─'.repeat(80))

    const columns = result.rows.map((row) => row.column_name)
    for (const row of result.rows) {
      const { column_name, data_type, is_nullable, column_default } = row
      console.log(
        `${column_name.padEnd(24)}${data_type.padEnd(16)}${is_nullable.padEnd(8)}${column_default || 'NULL'}`
      )
    }

    // 检查关键字段是否存在
    console.log('\n✅ 关键字段检查:')
    const requiredFields = [
      'id',
      'userId',
      'crsKeyId',
      'crsKey',
      'name',
      'description',
      'tags',
      'isFavorite', // 👈 关键字段
      'status',
      'createdAt',
      'updatedAt',
    ]

    const missingFields = requiredFields.filter(
      (field) => !columns.includes(field)
    )

    if (missingFields.length > 0) {
      console.log(`\n❌ 缺少字段: ${missingFields.join(', ')}`)
      console.log('\n🔧 解决方案:')
      console.log('1. 运行 Prisma 迁移: npx prisma migrate dev')
      console.log('2. 或重置数据库: npx prisma migrate reset')
      process.exit(1)
    }

    console.log('✅ 所有必需字段都存在\n')

    // 检查users表
    console.log('📋 users 表结构:')
    const usersResult = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `)

    console.log(`列数: ${usersResult.rows.length}`)
    console.log(`列名: ${usersResult.rows.map((r) => r.column_name).join(', ')}`)

    console.log('\n✅ 数据库schema检查完成')
  } catch (error: any) {
    console.error('❌ 检查失败:', error.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

checkSchema()
