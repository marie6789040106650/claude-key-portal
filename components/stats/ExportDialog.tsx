'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Download, FileJson, FileText } from 'lucide-react'
import { executeExport, type ExportFormat } from '@/lib/export'
import type { KeyStats } from '@/types/stats'

interface ExportDialogProps {
  /** 要导出的数据 */
  data: KeyStats[]
  /** 触发按钮文本 */
  triggerText?: string
  /** 默认文件名 */
  defaultFilename?: string
}

const AVAILABLE_FIELDS = [
  { value: 'name', label: '密钥名称' },
  { value: 'status', label: '状态' },
  { value: 'totalRequests', label: '总请求数' },
  { value: 'totalTokens', label: '总Token数' },
  { value: 'monthlyUsage', label: '本月使用量' },
  { value: 'lastUsedAt', label: '最后使用时间' },
  { value: 'createdAt', label: '创建时间' },
]

export function ExportDialog({
  data,
  triggerText = '导出数据',
  defaultFilename = 'usage-stats',
}: ExportDialogProps) {
  const [open, setOpen] = useState(false)
  const [format, setFormat] = useState<ExportFormat>('csv')
  const [filename, setFilename] = useState(defaultFilename)
  const [selectedFields, setSelectedFields] = useState<string[]>(
    AVAILABLE_FIELDS.slice(0, 6).map((f) => f.value)
  )

  const handleFieldToggle = (field: string) => {
    setSelectedFields((prev) =>
      prev.includes(field)
        ? prev.filter((f) => f !== field)
        : [...prev, field]
    )
  }

  const handleSelectAll = () => {
    if (selectedFields.length === AVAILABLE_FIELDS.length) {
      setSelectedFields([])
    } else {
      setSelectedFields(AVAILABLE_FIELDS.map((f) => f.value))
    }
  }

  const handleExport = () => {
    if (data.length === 0) {
      alert('暂无数据可导出')
      return
    }

    if (selectedFields.length === 0) {
      alert('请至少选择一个字段')
      return
    }

    executeExport(data, {
      format,
      fields: selectedFields,
      filename,
    })

    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="export-button">
          <Download className="w-4 h-4 mr-2" />
          {triggerText}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>导出数据</DialogTitle>
          <DialogDescription>
            选择导出格式和要包含的字段
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 导出格式 */}
          <div className="space-y-3">
            <Label>导出格式</Label>
            <RadioGroup
              value={format}
              onValueChange={(value) => setFormat(value as ExportFormat)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="format-csv" />
                <Label
                  htmlFor="format-csv"
                  className="flex items-center cursor-pointer"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  CSV (.csv) - 适合 Excel 打开
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="json" id="format-json" />
                <Label
                  htmlFor="format-json"
                  className="flex items-center cursor-pointer"
                >
                  <FileJson className="w-4 h-4 mr-2" />
                  JSON (.json) - 适合程序处理
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* 选择字段 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>选择字段</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedFields.length === AVAILABLE_FIELDS.length
                  ? '取消全选'
                  : '全选'}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {AVAILABLE_FIELDS.map((field) => (
                <div key={field.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`field-${field.value}`}
                    checked={selectedFields.includes(field.value)}
                    onCheckedChange={() => handleFieldToggle(field.value)}
                  />
                  <Label
                    htmlFor={`field-${field.value}`}
                    className="text-sm cursor-pointer"
                  >
                    {field.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* 文件名 */}
          <div className="space-y-2">
            <Label htmlFor="filename">文件名</Label>
            <Input
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="usage-stats"
            />
            <p className="text-xs text-muted-foreground">
              自动添加日期和格式后缀
            </p>
          </div>

          {/* 数据统计 */}
          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm">
              将导出 <span className="font-semibold">{data.length}</span> 条记录
              ，包含 <span className="font-semibold">{selectedFields.length}</span> 个字段
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            导出
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
