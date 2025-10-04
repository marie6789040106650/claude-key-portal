#!/usr/bin/env tsx
/**
 * Cron Jobs CLI 启动脚本
 *
 * 用于启动定时任务系统
 *
 * Usage:
 *   npm run cron           # 启动所有任务
 *   npm run cron:check     # 仅启动到期检查
 *   npm run cron:sync      # 仅启动数据同步
 *   npm run cron:cleanup   # 仅启动清理任务
 *   npm run cron:monitor   # 仅启动监控任务
 */

import { CronRunner } from '@/lib/cron/cron-runner'
import { ExpirationCheckJob } from '@/lib/cron/jobs/expiration-check-job'
import { DataSyncJob } from '@/lib/cron/jobs/data-sync-job'
import { CleanupJob } from '@/lib/cron/jobs/cleanup-job'
import { MonitorJob } from '@/lib/cron/jobs/monitor-job'
import { AlertCheckJob } from '@/lib/cron/jobs/alert-check-job'

const runner = new CronRunner()

// 解析命令行参数
const args = process.argv.slice(2)
const command = args[0]

async function main() {
  console.log('🚀 Claude Key Portal - Cron Jobs System')
  console.log('========================================\n')

  try {
    switch (command) {
      case 'check':
        console.log('📅 Starting Expiration Check Job only...')
        runner.register(new ExpirationCheckJob())
        break

      case 'sync':
        console.log('🔄 Starting Data Sync Job only...')
        runner.register(new DataSyncJob())
        break

      case 'cleanup':
        console.log('🧹 Starting Cleanup Job only...')
        runner.register(new CleanupJob())
        break

      case 'monitor':
        console.log('📊 Starting Monitor Job only...')
        runner.register(new MonitorJob())
        runner.register(new AlertCheckJob())
        break

      default:
        console.log('✅ Starting all cron jobs...\n')

        // 注册所有任务
        const expirationJob = new ExpirationCheckJob()
        const dataSyncJob = new DataSyncJob()
        const cleanupJob = new CleanupJob()
        const monitorJob = new MonitorJob()
        const alertCheckJob = new AlertCheckJob()

        runner.register(expirationJob)
        runner.register(dataSyncJob)
        runner.register(cleanupJob)
        runner.register(monitorJob)
        runner.register(alertCheckJob)

        console.log(`📅 Expiration Check: ${expirationJob.schedule} - ${expirationJob.description}`)
        console.log(`🔄 Data Sync: ${dataSyncJob.schedule} - ${dataSyncJob.description}`)
        console.log(`🧹 Cleanup: ${cleanupJob.schedule} - ${cleanupJob.description}`)
        console.log(`📊 Monitor: ${monitorJob.schedule} - ${monitorJob.description}`)
        console.log(`🚨 Alert Check: ${alertCheckJob.schedule} - ${alertCheckJob.description}`)
        break
    }

    const jobs = runner.getRegisteredJobs()
    console.log(`\n✅ ${jobs.length} job(s) registered and running`)
    console.log('📋 Jobs:', jobs.join(', '))
    console.log('\n💡 Press Ctrl+C to stop\n')

    // 保持进程运行
    process.on('SIGINT', () => {
      console.log('\n\n🛑 Stopping all cron jobs...')
      runner.stopAll()
      console.log('✅ All jobs stopped')
      process.exit(0)
    })

    process.on('SIGTERM', () => {
      console.log('\n\n🛑 Stopping all cron jobs...')
      runner.stopAll()
      console.log('✅ All jobs stopped')
      process.exit(0)
    })
  } catch (error) {
    console.error('❌ Error starting cron jobs:', error)
    process.exit(1)
  }
}

main()
