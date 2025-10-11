/**
 * 数据库连接诊断工具
 * 用于检查 Supabase 数据库连接配置
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
})

async function diagnose() {
  console.log('🔍 开始诊断数据库连接...\n')

  // 1. 检查环境变量
  console.log('1️⃣ 检查环境变量配置')
  const databaseUrl = process.env.DATABASE_URL
  const directUrl = process.env.DIRECT_URL

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL 未配置！')
    console.log('   请在 .env.local 中添加：')
    console.log('   DATABASE_URL="postgresql://postgres.[PROJECT-ID]:[PASSWORD]@..."\n')
    process.exit(1)
  }

  console.log('✅ DATABASE_URL 已配置')

  // 显示连接字符串（隐藏密码）
  const maskedUrl = databaseUrl.replace(/:[^:@]+@/, ':***@')
  console.log(`   ${maskedUrl}`)

  // 检查是否使用 pgbouncer
  if (!databaseUrl.includes('pgbouncer=true')) {
    console.warn('⚠️  警告：未启用 pgbouncer，可能影响连接池性能')
    console.log('   建议添加参数：?pgbouncer=true&connection_limit=1\n')
  }

  // 检查 DIRECT_URL
  if (!directUrl) {
    console.warn('⚠️  DIRECT_URL 未配置（迁移时需要）')
  } else {
    console.log('✅ DIRECT_URL 已配置\n')
  }

  // 2. 测试数据库连接
  console.log('2️⃣ 测试数据库连接')
  try {
    await prisma.$connect()
    console.log('✅ 数据库连接成功！\n')
  } catch (error: any) {
    console.error('❌ 数据库连接失败！')
    console.error('   错误信息：', error.message)

    if (error.message.includes('Authentication failed')) {
      console.log('\n💡 可能的原因：')
      console.log('   1. 密码错误或已过期')
      console.log('   2. Supabase 项目已暂停（7天未活动）')
      console.log('   3. 密码包含特殊字符未编码')
      console.log('\n📖 解决步骤：')
      console.log('   1. 登录 https://supabase.com/dashboard')
      console.log('   2. 检查项目状态（如果暂停，点击 Resume）')
      console.log('   3. Settings → Database → Connection string')
      console.log('   4. 复制 Transaction 模式的连接字符串')
      console.log('   5. 更新 .env.local 中的 DATABASE_URL')
      console.log('   6. 如果密码有特殊字符，使用命令编码：')
      console.log('      node -e "console.log(encodeURIComponent(\'your-password\'))"')
    } else if (error.message.includes('timeout')) {
      console.log('\n💡 连接超时，可能的原因：')
      console.log('   1. 网络问题')
      console.log('   2. Supabase 服务器维护')
      console.log('   3. 防火墙阻止连接')
    }

    console.log('\n')
    process.exit(1)
  }

  // 3. 测试数据库查询
  console.log('3️⃣ 测试数据库查询')
  try {
    const result = await prisma.$queryRaw`SELECT version()`
    console.log('✅ 查询执行成功')
    console.log('   PostgreSQL 版本：', result)
  } catch (error: any) {
    console.error('❌ 查询失败：', error.message)
    process.exit(1)
  }

  // 4. 检查表是否存在
  console.log('\n4️⃣ 检查数据库表')
  try {
    const tables = await prisma.$queryRaw`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    ` as any[]

    if (tables.length === 0) {
      console.warn('⚠️  数据库中没有表')
      console.log('   需要运行数据库迁移：')
      console.log('   npx prisma migrate deploy')
      console.log('   或: npx prisma db push\n')
    } else {
      console.log(`✅ 找到 ${tables.length} 个表：`)
      tables.forEach(t => console.log(`   - ${t.tablename}`))
    }
  } catch (error: any) {
    console.error('❌ 无法查询表信息：', error.message)
  }

  console.log('\n✅ 诊断完成！所有检查通过。\n')

  await prisma.$disconnect()
}

diagnose().catch(console.error)
