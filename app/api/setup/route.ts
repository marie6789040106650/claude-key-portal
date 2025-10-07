/**
 * 临时数据库初始化端点
 * 用于首次部署时创建表结构
 *
 * 使用后应删除此文件
 */

import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: Request) {
  try {
    // 安全检查：只允许首次设置
    const { password } = await request.json()

    if (password !== 'HCTBMoiK3PZD0eDC') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Starting database setup...')

    // 运行 prisma db push
    const { stdout, stderr } = await execAsync('npx prisma db push --accept-data-loss --skip-generate')

    console.log('Database setup output:', stdout)
    if (stderr) console.error('Database setup errors:', stderr)

    return NextResponse.json({
      success: true,
      message: 'Database tables created successfully',
      output: stdout
    })
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Setup failed'
    }, { status: 500 })
  }
}
