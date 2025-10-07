/**
 * Platform Detection Utility
 * 平台检测工具 - 根据 User-Agent 检测操作系统和推荐配置
 */

export interface PlatformInfo {
  platform: 'macos' | 'windows' | 'linux'
  os: 'macos' | 'windows' | 'linux'
  arch: 'x64' | 'arm64'
  shell?: string
}

export interface PlatformFeatures {
  supportedShells: string[]
  defaultShell: string
  configPaths: {
    [shell: string]: string
  }
  envSetMethod: 'export' | 'setx' | 'setenv'
}

/**
 * 平台类型定义
 */
export const PLATFORMS = ['macos', 'windows', 'linux'] as const
export type Platform = (typeof PLATFORMS)[number]

/**
 * 支持的环境/Shell配置
 */
export const SUPPORTED_ENVIRONMENTS: Record<Platform, readonly string[]> = {
  macos: ['bash', 'zsh', 'fish'],
  windows: ['powershell', 'cmd'],
  linux: ['bash', 'zsh', 'fish'],
} as const

/**
 * 验证平台是否有效
 */
export function isValidPlatform(platform: string): platform is Platform {
  return PLATFORMS.includes(platform as Platform)
}

/**
 * 验证环境是否对指定平台有效
 */
export function isValidEnvironment(
  platform: Platform,
  environment: string
): boolean {
  return SUPPORTED_ENVIRONMENTS[platform].includes(environment)
}

/**
 * 检测平台信息
 */
export function detectPlatform(userAgent: string): PlatformInfo {
  const ua = userAgent.toLowerCase()

  // 检测操作系统
  let platform: 'macos' | 'windows' | 'linux'
  let os: 'macos' | 'windows' | 'linux'

  if (ua.includes('mac') || ua.includes('darwin')) {
    platform = 'macos'
    os = 'macos'
  } else if (ua.includes('win')) {
    platform = 'windows'
    os = 'windows'
  } else if (ua.includes('linux') || ua.includes('x11')) {
    platform = 'linux'
    os = 'linux'
  } else {
    // 默认值
    platform = 'linux'
    os = 'linux'
  }

  // 检测架构
  let arch: 'x64' | 'arm64'
  if (ua.includes('arm') || ua.includes('aarch64')) {
    arch = 'arm64'
  } else {
    arch = 'x64'
  }

  return {
    platform,
    os,
    arch,
  }
}

/**
 * 根据平台检测推荐的 shell
 */
export function detectShellFromUserAgent(
  platform: 'macos' | 'windows' | 'linux'
): string {
  switch (platform) {
    case 'macos':
      // macOS Catalina+ 默认使用 zsh
      return 'zsh'
    case 'windows':
      return 'powershell'
    case 'linux':
      return 'bash'
    default:
      return 'bash'
  }
}

/**
 * 获取平台特性
 */
export function getPlatformFeatures(
  platform: 'macos' | 'windows' | 'linux'
): PlatformFeatures {
  switch (platform) {
    case 'macos':
      return {
        supportedShells: ['bash', 'zsh', 'fish'],
        defaultShell: 'zsh',
        configPaths: {
          bash: '~/.bashrc',
          zsh: '~/.zshrc',
          fish: '~/.config/fish/config.fish',
        },
        envSetMethod: 'export',
      }

    case 'windows':
      return {
        supportedShells: ['powershell', 'cmd'],
        defaultShell: 'powershell',
        configPaths: {
          powershell: '$PROFILE',
          cmd: 'System Properties > Environment Variables',
        },
        envSetMethod: 'setx',
      }

    case 'linux':
      return {
        supportedShells: ['bash', 'zsh', 'fish'],
        defaultShell: 'bash',
        configPaths: {
          bash: '~/.bashrc',
          zsh: '~/.zshrc',
          fish: '~/.config/fish/config.fish',
        },
        envSetMethod: 'export',
      }

    default:
      throw new Error(`Unsupported platform: ${platform}`)
  }
}
