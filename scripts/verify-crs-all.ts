/**
 * CRS API 全面验证脚本
 *
 * 按顺序执行所有验证脚本：
 * 1. verify-crs-auth.ts - 认证API
 * 2. verify-crs-admin.ts - Admin API
 * 3. verify-crs-public-stats.ts - 公开统计API
 *
 * 生成综合报告
 */

import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

const SCRIPTS_DIR = __dirname
const DOCS_DIR = path.join(__dirname, '..', 'docs')

interface ScriptInfo {
  name: string
  file: string
  description: string
  outputFile: string
}

const scripts: ScriptInfo[] = [
  {
    name: '认证API验证',
    file: 'verify-crs-auth.ts',
    description: 'POST /web/auth/login, GET /web/auth/user, etc.',
    outputFile: 'CRS_AUTH_VERIFICATION.json',
  },
  {
    name: 'Admin API验证',
    file: 'verify-crs-admin.ts',
    description: 'GET /admin/dashboard, GET /admin/api-keys, etc.',
    outputFile: 'CRS_ADMIN_VERIFICATION.json',
  },
  {
    name: '公开统计API验证',
    file: 'verify-crs-public-stats.ts',
    description: 'POST /api/user-stats, POST /api/user-model-stats, etc.',
    outputFile: 'CRS_PUBLIC_STATS_VERIFICATION.json',
  },
]

function runScript(scriptPath: string): boolean {
  try {
    console.log(`执行: ${scriptPath}`)
    execSync(`npx tsx "${scriptPath}"`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    })
    console.log(`✅ 完成\n`)
    return true
  } catch (error) {
    console.error(`❌ 失败: ${error}\n`)
    return false
  }
}

function generateCombinedReport() {
  console.log('=' .repeat(60))
  console.log('📊 生成综合验证报告...\n')

  const reports: any[] = []

  for (const script of scripts) {
    const outputPath = path.join(DOCS_DIR, script.outputFile)

    if (fs.existsSync(outputPath)) {
      try {
        const content = fs.readFileSync(outputPath, 'utf-8')
        const data = JSON.parse(content)
        reports.push({
          script: script.name,
          description: script.description,
          ...data,
        })
      } catch (error) {
        console.error(`⚠️  无法读取 ${script.outputFile}: ${error}`)
      }
    } else {
      console.error(`⚠️  文件不存在: ${script.outputFile}`)
    }
  }

  // 计算总体统计
  const totalSummary = {
    totalTests: 0,
    totalSuccess: 0,
    totalFailed: 0,
    totalError: 0,
    totalSkipped: 0,
    avgResponseTime: 0,
  }

  let totalResponseTimes = 0
  let totalResponseCount = 0

  reports.forEach(report => {
    if (report.summary) {
      totalSummary.totalTests += report.summary.total || 0
      totalSummary.totalSuccess += report.summary.success || report.summary.endpointExists || 0
      totalSummary.totalFailed += report.summary.failed || report.summary.endpointNotFound || 0
      totalSummary.totalError += report.summary.error || 0
      totalSummary.totalSkipped += report.summary.skipped || 0

      if (report.summary.avgResponseTime) {
        totalResponseTimes += report.summary.avgResponseTime * (report.summary.total || 0)
        totalResponseCount += report.summary.total || 0
      }

      if (report.results) {
        report.results.forEach((r: any) => {
          if (r.responseTime) {
            totalResponseTimes += r.responseTime
            totalResponseCount++
          }
        })
      }
    }
  })

  if (totalResponseCount > 0) {
    totalSummary.avgResponseTime = Math.round(totalResponseTimes / totalResponseCount)
  }

  // 生成Markdown报告
  const markdownReport = generateMarkdownReport(reports, totalSummary)
  const markdownPath = path.join(DOCS_DIR, 'CRS_VERIFICATION_COMPLETE_REPORT.md')
  fs.writeFileSync(markdownPath, markdownReport)
  console.log(`✅ Markdown报告已保存: ${markdownPath}`)

  // 生成JSON报告
  const combinedReport = {
    timestamp: new Date().toISOString(),
    totalSummary,
    reports,
  }
  const jsonPath = path.join(DOCS_DIR, 'CRS_VERIFICATION_COMPLETE_REPORT.json')
  fs.writeFileSync(jsonPath, JSON.stringify(combinedReport, null, 2))
  console.log(`✅ JSON报告已保存: ${jsonPath}`)

  // 打印总结
  printFinalSummary(totalSummary)
}

function generateMarkdownReport(reports: any[], totalSummary: any): string {
  const lines: string[] = []

  lines.push('# CRS API 完整验证报告')
  lines.push('')
  lines.push(`> **验证时间**: ${new Date().toISOString()}`)
  lines.push(`> **CRS地址**: https://claude.just-play.fun`)
  lines.push('')
  lines.push('---')
  lines.push('')

  // 总体统计
  lines.push('## 📊 总体统计')
  lines.push('')
  lines.push('| 指标 | 数值 |')
  lines.push('|-----|------|')
  lines.push(`| 总测试数 | ${totalSummary.totalTests} |`)
  lines.push(`| ✅ 成功 | ${totalSummary.totalSuccess} |`)
  lines.push(`| ❌ 失败 | ${totalSummary.totalFailed} |`)
  lines.push(`| ⚠️  错误 | ${totalSummary.totalError} |`)
  lines.push(`| ⏭️  跳过 | ${totalSummary.totalSkipped} |`)
  lines.push(`| ⏱️  平均响应时间 | ${totalSummary.avgResponseTime}ms |`)
  lines.push('')

  // 成功率
  const successRate = totalSummary.totalTests > 0
    ? ((totalSummary.totalSuccess / totalSummary.totalTests) * 100).toFixed(1)
    : 0
  lines.push(`**成功率**: ${successRate}%`)
  lines.push('')
  lines.push('---')
  lines.push('')

  // 分类报告
  reports.forEach((report, index) => {
    lines.push(`## ${index + 1}. ${report.script}`)
    lines.push('')
    lines.push(`**描述**: ${report.description}`)
    lines.push('')

    if (report.summary) {
      lines.push('### 统计')
      lines.push('')
      lines.push('| 指标 | 数值 |')
      lines.push('|-----|------|')
      lines.push(`| 总计 | ${report.summary.total || 0} |`)
      lines.push(`| 成功 | ${report.summary.success || report.summary.endpointExists || 0} |`)
      lines.push(`| 失败 | ${report.summary.failed || report.summary.endpointNotFound || 0} |`)
      lines.push(`| 错误 | ${report.summary.error || 0} |`)
      if (report.summary.skipped) {
        lines.push(`| 跳过 | ${report.summary.skipped} |`)
      }
      if (report.summary.avgResponseTime) {
        lines.push(`| 平均响应时间 | ${report.summary.avgResponseTime}ms |`)
      }
      lines.push('')
    }

    if (report.results && report.results.length > 0) {
      lines.push('### 详细结果')
      lines.push('')
      lines.push('| # | 端点 | 方法 | 状态 | 状态码 | 响应时间 |')
      lines.push('|---|------|------|------|--------|----------|')

      report.results.forEach((r: any, i: number) => {
        const icon = r.status === 'success' ? '✅' :
                     r.status === 'failed' ? '❌' :
                     r.status === 'skipped' ? '⏭️' : '⚠️'
        lines.push(`| ${i + 1} | ${r.endpoint} | ${r.method} | ${icon} ${r.status} | ${r.statusCode || '-'} | ${r.responseTime || '-'}ms |`)
      })

      lines.push('')
    }

    lines.push('---')
    lines.push('')
  })

  return lines.join('\n')
}

function printFinalSummary(totalSummary: any) {
  console.log('')
  console.log('=' .repeat(60))
  console.log('🎉 所有验证完成！')
  console.log('=' .repeat(60))
  console.log('')
  console.log('📊 总体统计:')
  console.log(`   总测试数: ${totalSummary.totalTests}`)
  console.log(`   ✅ 成功: ${totalSummary.totalSuccess}`)
  console.log(`   ❌ 失败: ${totalSummary.totalFailed}`)
  console.log(`   ⚠️  错误: ${totalSummary.totalError}`)
  console.log(`   ⏭️  跳过: ${totalSummary.totalSkipped}`)
  console.log(`   ⏱️  平均响应时间: ${totalSummary.avgResponseTime}ms`)
  console.log('')

  const successRate = totalSummary.totalTests > 0
    ? ((totalSummary.totalSuccess / totalSummary.totalTests) * 100).toFixed(1)
    : 0
  console.log(`🎯 成功率: ${successRate}%`)
  console.log('')
}

async function main() {
  console.log('🚀 CRS API 全面验证')
  console.log('=' .repeat(60))
  console.log(`开始时间: ${new Date().toISOString()}`)
  console.log('')

  // 确保docs目录存在
  if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR, { recursive: true })
  }

  // 执行所有验证脚本
  for (const script of scripts) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`📋 ${script.name}`)
    console.log(`${'='.repeat(60)}\n`)

    const scriptPath = path.join(SCRIPTS_DIR, script.file)

    if (!fs.existsSync(scriptPath)) {
      console.error(`❌ 脚本文件不存在: ${script.file}\n`)
      continue
    }

    runScript(scriptPath)

    // 每个脚本之间等待1秒
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  // 生成综合报告
  generateCombinedReport()

  console.log(`\n结束时间: ${new Date().toISOString()}`)
  console.log('=' .repeat(60))
}

main().catch(error => {
  console.error('验证过程失败:', error)
  process.exit(1)
})
