'use client'

import React, { useState, useEffect } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { KeyStats } from '@/types/stats'

interface KeyFilterProps {
  /** 可选的密钥列表 */
  keys: KeyStats[]
  /** 当前选中的密钥ID */
  selectedKeys?: string[]
  /** 选择变化回调 */
  onChange: (selectedKeys: string[]) => void
  /** 最大高度 */
  maxHeight?: number
}

export function KeyFilter({
  keys,
  selectedKeys = [],
  onChange,
  maxHeight = 300,
}: KeyFilterProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedKeys))

  // 同步外部传入的 selectedKeys
  useEffect(() => {
    setSelected(new Set(selectedKeys))
  }, [selectedKeys])

  // 全选状态
  const allSelected = selected.size === keys.length && keys.length > 0
  const someSelected = selected.size > 0 && selected.size < keys.length

  // 切换单个密钥
  const toggleKey = (keyId: string) => {
    const newSelected = new Set(selected)
    if (newSelected.has(keyId)) {
      newSelected.delete(keyId)
    } else {
      newSelected.add(keyId)
    }
    setSelected(newSelected)
    onChange(Array.from(newSelected))
  }

  // 全选/取消全选
  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set())
      onChange([])
    } else {
      const allKeys = new Set(keys.map((k) => k.id))
      setSelected(allKeys)
      onChange(Array.from(allKeys))
    }
  }

  return (
    <div data-testid="key-filter" className="border rounded-lg p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold mb-2">筛选密钥</h3>

        {/* 全选控件 */}
        <div className="flex items-center space-x-2 mb-2 pb-2 border-b">
          <Checkbox
            id="select-all"
            checked={allSelected}
            data-testid="select-all-keys"
            onCheckedChange={toggleAll}
            aria-label="全选"
          />
          <Label
            htmlFor="select-all"
            className="text-sm font-medium cursor-pointer"
          >
            {allSelected
              ? '取消全选'
              : someSelected
                ? `已选 ${selected.size}/${keys.length}`
                : '全选'}
          </Label>
        </div>
      </div>

      {/* 密钥列表 */}
      <ScrollArea style={{ maxHeight: `${maxHeight}px` }}>
        <div className="space-y-2">
          {keys.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              暂无密钥
            </p>
          ) : (
            keys.map((key) => (
              <div
                key={key.id}
                className="flex items-center space-x-2 py-1 hover:bg-muted/50 rounded px-2"
              >
                <Checkbox
                  id={`key-${key.id}`}
                  checked={selected.has(key.id)}
                  data-testid={`key-checkbox-${key.id}`}
                  onCheckedChange={() => toggleKey(key.id)}
                  aria-label={`选择 ${key.name}`}
                />
                <Label
                  htmlFor={`key-${key.id}`}
                  className="flex-1 text-sm cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{key.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {key.status}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    请求: {key.totalRequests.toLocaleString()} | Token:{' '}
                    {key.totalTokens.toLocaleString()}
                  </div>
                </Label>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* 选择统计 */}
      {selected.size > 0 && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-muted-foreground">
            已选择 {selected.size} 个密钥
          </p>
        </div>
      )}
    </div>
  )
}
