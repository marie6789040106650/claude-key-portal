/**
 * Cron Runner - 定时任务执行器
 *
 * 负责注册、调度和执行定时任务
 */

import cron, { ScheduledTask } from 'node-cron'
import { prisma } from '@/lib/prisma'

export interface CronJob {
  name: string
  schedule: string
  handler: () => Promise<CronJobResult>
  description?: string
}

export interface CronJobResult {
  success: boolean
  [key: string]: any
}

export class CronRunner {
  private tasks: Map<string, ScheduledTask> = new Map()
  private jobs: Map<string, CronJob> = new Map()
  private runningJobs: Set<string> = new Set()

  /**
   * 注册定时任务
   */
  register(job: CronJob): void {
    // 验证 cron 表达式
    if (!cron.validate(job.schedule)) {
      throw new Error(`Invalid cron expression: ${job.schedule}`)
    }

    // 检查重复注册
    if (this.jobs.has(job.name)) {
      throw new Error(`Job ${job.name} is already registered`)
    }

    // 创建定时任务
    const task = cron.schedule(job.schedule, async () => {
      await this.executeJob(job)
    })

    this.tasks.set(job.name, task)
    this.jobs.set(job.name, job)
  }

  /**
   * 执行任务
   */
  async executeJob(job: CronJob): Promise<void> {
    // 并发控制 - 同一任务不允许并发执行
    if (this.runningJobs.has(job.name)) {
      console.log(`Job ${job.name} is already running, skipping...`)
      return
    }

    this.runningJobs.add(job.name)

    const startTime = Date.now()

    // 创建执行日志
    const log = await prisma.cronJobLog.create({
      data: {
        jobName: job.name,
        status: 'RUNNING',
        startAt: new Date(startTime),
      },
    })

    try {
      // 执行任务处理器
      const result = await job.handler()

      const endTime = Date.now()
      const duration = endTime - startTime

      // 更新日志为成功
      await prisma.cronJobLog.update({
        where: { id: log.id },
        data: {
          status: 'SUCCESS',
          endAt: new Date(endTime),
          duration,
          result,
        },
      })
    } catch (error: any) {
      const endTime = Date.now()
      const duration = endTime - startTime

      // 更新日志为失败
      await prisma.cronJobLog.update({
        where: { id: log.id },
        data: {
          status: 'FAILED',
          endAt: new Date(endTime),
          duration,
          error: error.message,
        },
      })
    } finally {
      this.runningJobs.delete(job.name)
    }
  }

  /**
   * 停止所有任务
   */
  stopAll(): void {
    for (const task of this.tasks.values()) {
      task.stop()
    }
    this.tasks.clear()
    this.jobs.clear()
  }

  /**
   * 获取已注册任务列表
   */
  getRegisteredJobs(): string[] {
    return Array.from(this.jobs.keys())
  }

  /**
   * 手动触发任务
   */
  async runManually(jobName: string): Promise<void> {
    const job = this.jobs.get(jobName)

    if (!job) {
      throw new Error(`Job ${jobName} is not registered`)
    }

    await this.executeJob(job)
  }
}
