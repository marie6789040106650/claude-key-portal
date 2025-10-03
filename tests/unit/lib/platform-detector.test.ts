/**
 * Platform Detection Utility Tests
 * 平台检测工具测试
 */

import {
  detectPlatform,
  getPlatformFeatures,
  detectShellFromUserAgent,
  type PlatformInfo,
} from '@/lib/platform-detector'

describe('detectPlatform', () => {
  it('应该检测 macOS', () => {
    const userAgent =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    const result = detectPlatform(userAgent)

    expect(result.platform).toBe('macos')
    expect(result.os).toBe('macos')
  })

  it('应该检测 Windows', () => {
    const userAgent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    const result = detectPlatform(userAgent)

    expect(result.platform).toBe('windows')
    expect(result.os).toBe('windows')
  })

  it('应该检测 Linux', () => {
    const userAgent =
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
    const result = detectPlatform(userAgent)

    expect(result.platform).toBe('linux')
    expect(result.os).toBe('linux')
  })

  it('应该检测 ARM64 架构', () => {
    const userAgent =
      'Mozilla/5.0 (Macintosh; ARM Mac OS X 10_15_7) AppleWebKit/537.36'
    const result = detectPlatform(userAgent)

    expect(result.arch).toBe('arm64')
  })

  it('应该检测 x64 架构', () => {
    const userAgent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    const result = detectPlatform(userAgent)

    expect(result.arch).toBe('x64')
  })

  it('应该处理未知用户代理', () => {
    const userAgent = 'Unknown Browser'
    const result = detectPlatform(userAgent)

    expect(['macos', 'windows', 'linux']).toContain(result.platform)
    expect(result).toHaveProperty('os')
    expect(result).toHaveProperty('arch')
  })

  it('应该处理空用户代理', () => {
    const result = detectPlatform('')

    expect(result).toHaveProperty('platform')
    expect(result).toHaveProperty('os')
  })
})

describe('detectShellFromUserAgent', () => {
  it('应该为 macOS 返回推荐的 shell', () => {
    const result = detectShellFromUserAgent('macos')

    expect(['bash', 'zsh']).toContain(result)
  })

  it('应该为 Windows 返回 powershell', () => {
    const result = detectShellFromUserAgent('windows')

    expect(result).toBe('powershell')
  })

  it('应该为 Linux 返回 bash', () => {
    const result = detectShellFromUserAgent('linux')

    expect(result).toBe('bash')
  })
})

describe('getPlatformFeatures', () => {
  it('应该返回 macOS 特性', () => {
    const features = getPlatformFeatures('macos')

    expect(features).toHaveProperty('supportedShells')
    expect(features.supportedShells).toContain('bash')
    expect(features.supportedShells).toContain('zsh')
    expect(features).toHaveProperty('defaultShell')
    expect(features).toHaveProperty('configPaths')
  })

  it('应该返回 Windows 特性', () => {
    const features = getPlatformFeatures('windows')

    expect(features.supportedShells).toContain('powershell')
    expect(features.defaultShell).toBe('powershell')
    expect(features.configPaths).toBeDefined()
  })

  it('应该返回 Linux 特性', () => {
    const features = getPlatformFeatures('linux')

    expect(features.supportedShells).toContain('bash')
    expect(features.defaultShell).toBe('bash')
  })

  it('应该包含配置文件路径', () => {
    const macosFeatures = getPlatformFeatures('macos')
    const windowsFeatures = getPlatformFeatures('windows')
    const linuxFeatures = getPlatformFeatures('linux')

    expect(macosFeatures.configPaths.bash).toContain('.bashrc')
    expect(windowsFeatures.configPaths.powershell).toBeDefined()
    expect(linuxFeatures.configPaths.bash).toBeDefined()
  })

  it('应该包含环境变量设置方式', () => {
    const macosFeatures = getPlatformFeatures('macos')

    expect(macosFeatures).toHaveProperty('envSetMethod')
    expect(['export', 'setx']).toContain(macosFeatures.envSetMethod)
  })
})
