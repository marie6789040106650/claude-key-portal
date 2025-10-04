'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { DateRangePreset } from '@/types/stats'

interface DateRangePickerProps {
  /** 当前选中的预设 */
  value?: DateRangePreset
  /** 自定义开始日期 */
  startDate?: Date
  /** 自定义结束日期 */
  endDate?: Date
  /** 选择回调 */
  onChange: (preset: DateRangePreset, startDate?: Date, endDate?: Date) => void
}

export function DateRangePicker({
  value = 'last7days',
  startDate,
  endDate,
  onChange,
}: DateRangePickerProps) {
  const [customStart, setCustomStart] = useState<Date | undefined>(startDate)
  const [customEnd, setCustomEnd] = useState<Date | undefined>(endDate)
  const [showCustom, setShowCustom] = useState(value === 'custom')

  const presets: { value: DateRangePreset; label: string }[] = [
    { value: 'today', label: '今天' },
    { value: 'yesterday', label: '昨天' },
    { value: 'last7days', label: '最近 7 天' },
    { value: 'last30days', label: '最近 30 天' },
    { value: 'thisMonth', label: '本月' },
    { value: 'lastMonth', label: '上月' },
    { value: 'custom', label: '自定义' },
  ]

  const handlePresetChange = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      setShowCustom(true)
    } else {
      setShowCustom(false)
      onChange(preset)
    }
  }

  const handleCustomDateChange = (start?: Date, end?: Date) => {
    setCustomStart(start)
    setCustomEnd(end)
    if (start && end) {
      onChange('custom', start, end)
    }
  }

  return (
    <div data-testid="date-range-picker" className="flex flex-col gap-4">
      {/* 预设选择器 */}
      <Select value={value} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="选择时间范围" />
        </SelectTrigger>
        <SelectContent>
          {presets.map((preset) => (
            <SelectItem key={preset.value} value={preset.value}>
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* 自定义日期范围 */}
      {showCustom && (
        <div
          data-testid="custom-date-range"
          className="flex flex-col sm:flex-row gap-4"
        >
          {/* 开始日期 */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">开始日期</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-[240px] justify-start text-left font-normal',
                    !customStart && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customStart ? (
                    format(customStart, 'yyyy-MM-dd')
                  ) : (
                    <span>选择开始日期</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customStart}
                  onSelect={(date) => handleCustomDateChange(date, customEnd)}
                  disabled={(date) =>
                    date > new Date() || (customEnd ? date > customEnd : false)
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {/* 隐藏的input用于测试 */}
            <input
              type="hidden"
              data-testid="start-date-input"
              value={customStart ? format(customStart, 'yyyy-MM-dd') : ''}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value) : undefined
                handleCustomDateChange(date, customEnd)
              }}
            />
          </div>

          {/* 结束日期 */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">结束日期</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-[240px] justify-start text-left font-normal',
                    !customEnd && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customEnd ? (
                    format(customEnd, 'yyyy-MM-dd')
                  ) : (
                    <span>选择结束日期</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customEnd}
                  onSelect={(date) => handleCustomDateChange(customStart, date)}
                  disabled={(date) =>
                    date > new Date() || (customStart ? date < customStart : false)
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {/* 隐藏的input用于测试 */}
            <input
              type="hidden"
              data-testid="end-date-input"
              value={customEnd ? format(customEnd, 'yyyy-MM-dd') : ''}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value) : undefined
                handleCustomDateChange(customStart, date)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
