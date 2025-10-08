/**
 * 平台选择器组件
 * Sprint MVP - Phase 2 🟢 GREEN
 */

import { Monitor, Apple, Terminal } from 'lucide-react'

type Platform = 'macos' | 'windows' | 'linux'

interface PlatformSelectorProps {
  selected: Platform
  onChange: (platform: Platform) => void
}

export function PlatformSelector({ selected, onChange }: PlatformSelectorProps) {
  const platforms = [
    {
      id: 'macos' as Platform,
      name: 'macOS',
      icon: Apple,
      description: 'Mac系统',
    },
    {
      id: 'windows' as Platform,
      name: 'Windows',
      icon: Monitor,
      description: 'Windows系统',
    },
    {
      id: 'linux' as Platform,
      name: 'Linux',
      icon: Terminal,
      description: 'Linux系统',
    },
  ]

  return (
    <div className="space-y-2">
      {platforms.map((platform) => {
        const Icon = platform.icon
        const isSelected = selected === platform.id

        return (
          <button
            key={platform.id}
            role="button"
            aria-label={platform.name}
            onClick={() => onChange(platform.id)}
            className={`w-full flex items-center p-3 rounded-lg border transition-colors ${
              isSelected
                ? 'border-blue-500 bg-blue-50 selected'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
            </div>
            <div className="ml-3 text-left">
              <div className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                {platform.name}
              </div>
              <div className="text-sm text-gray-500">{platform.description}</div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
