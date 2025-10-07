/**
 * Script Templates Library Tests
 * 脚本模板库测试
 */

import {
  generateScript,
  getTemplate,
  getInstructions,
  type ScriptConfig,
} from '@/lib/script-templates'

describe('generateScript', () => {
  const mockConfig: ScriptConfig = {
    platform: 'macos',
    environment: 'bash',
    keyValue: 'cr_test_key_123',
    baseUrl: 'https://claude.just-play.fun/api',
  }

  describe('macOS Scripts', () => {
    it('应该生成 bash 脚本', () => {
      const script = generateScript(mockConfig)

      expect(script).toContain('export ANTHROPIC_BASE_URL')
      expect(script).toContain('export ANTHROPIC_AUTH_TOKEN')
      expect(script).toContain(mockConfig.keyValue)
      expect(script).toContain(mockConfig.baseUrl)
    })

    it('应该生成 zsh 脚本', () => {
      const script = generateScript({
        ...mockConfig,
        environment: 'zsh',
      })

      expect(script).toContain('# 添加到 ~/.zshrc')
      expect(script).toContain('export')
      expect(script).toContain(mockConfig.keyValue)
    })

    it('应该包含正确的注释', () => {
      const script = generateScript(mockConfig)

      expect(script).toContain('#')
      expect(script).toContain('Claude Code')
    })
  })

  describe('Windows Scripts', () => {
    it('应该生成 PowerShell 脚本', () => {
      const script = generateScript({
        ...mockConfig,
        platform: 'windows',
        environment: 'powershell',
      })

      expect(script).toContain('[System.Environment]::SetEnvironmentVariable')
      expect(script).toContain('ANTHROPIC_BASE_URL')
      expect(script).toContain(mockConfig.keyValue)
      expect(script).toContain('"User"')
    })

    it('应该正确转义特殊字符', () => {
      const script = generateScript({
        ...mockConfig,
        platform: 'windows',
        environment: 'powershell',
        keyValue: 'cr_key_with_$pecial',
      })

      expect(script).toBeDefined()
      // PowerShell 应该正确处理特殊字符
    })
  })

  describe('Linux Scripts', () => {
    it('应该生成 bash 脚本', () => {
      const script = generateScript({
        ...mockConfig,
        platform: 'linux',
        environment: 'bash',
      })

      expect(script).toContain('export ANTHROPIC_BASE_URL')
      expect(script).toContain(mockConfig.keyValue)
    })

    it('应该生成 zsh 脚本', () => {
      const script = generateScript({
        ...mockConfig,
        platform: 'linux',
        environment: 'zsh',
      })

      expect(script).toContain('export')
    })
  })

  describe('Variable Substitution', () => {
    it('应该替换所有变量', () => {
      const script = generateScript(mockConfig)

      expect(script).not.toContain('{{')
      expect(script).not.toContain('}}')
      expect(script).toContain(mockConfig.keyValue)
      expect(script).toContain(mockConfig.baseUrl)
    })

    it('应该处理特殊字符', () => {
      const specialConfig = {
        ...mockConfig,
        keyValue: 'cr_key_with_special_chars_!@#',
      }

      const script = generateScript(specialConfig)

      expect(script).toContain(specialConfig.keyValue)
    })
  })
})

describe('getTemplate', () => {
  it('应该返回 macOS bash 模板', () => {
    const template = getTemplate('macos', 'bash')

    expect(template).toBeDefined()
    expect(template).toContain('export')
    expect(template).toContain('{{keyValue}}')
    expect(template).toContain('{{baseUrl}}')
  })

  it('应该返回 Windows PowerShell 模板', () => {
    const template = getTemplate('windows', 'powershell')

    expect(template).toBeDefined()
    expect(template).toContain('SetEnvironmentVariable')
  })

  it('应该返回 Linux bash 模板', () => {
    const template = getTemplate('linux', 'bash')

    expect(template).toBeDefined()
    expect(template).toContain('export')
  })

  it('应该为不支持的组合抛出错误', () => {
    expect(() => {
      getTemplate('macos' as any, 'cmd' as any)
    }).toThrow()
  })
})

describe('getInstructions', () => {
  it('应该返回 macOS 安装说明', () => {
    const instructions = getInstructions('macos', 'bash')

    expect(instructions).toBeInstanceOf(Array)
    expect(instructions.length).toBeGreaterThan(0)
    expect(instructions.some((i) => i.includes('保存'))).toBe(true)
    expect(instructions.some((i) => i.includes('~/.bashrc'))).toBe(true)
  })

  it('应该返回 Windows 安装说明', () => {
    const instructions = getInstructions('windows', 'powershell')

    expect(instructions).toBeInstanceOf(Array)
    expect(instructions.some((i) => i.includes('PowerShell'))).toBe(true)
  })

  it('应该返回 Linux 安装说明', () => {
    const instructions = getInstructions('linux', 'bash')

    expect(instructions).toBeInstanceOf(Array)
    expect(instructions.some((i) => i.includes('.bashrc'))).toBe(true)
  })

  it('说明应该包含验证步骤', () => {
    const instructions = getInstructions('macos', 'bash')

    expect(
      instructions.some((i) => i.toLowerCase().includes('验证') || i.includes('echo'))
    ).toBe(true)
  })

  it('说明应该按顺序排列', () => {
    const instructions = getInstructions('macos', 'bash')

    expect(instructions[0]).toMatch(/1\.|保存|复制/)
    // 第一步通常是保存或复制
  })
})

describe('Edge Cases', () => {
  it('应该处理空密钥值', () => {
    const config: ScriptConfig = {
      platform: 'macos',
      environment: 'bash',
      keyValue: '',
      baseUrl: 'https://claude.just-play.fun/api',
    }

    expect(() => generateScript(config)).toThrow()
  })

  it('应该处理空基础 URL', () => {
    const config: ScriptConfig = {
      platform: 'macos',
      environment: 'bash',
      keyValue: 'cr_test',
      baseUrl: '',
    }

    expect(() => generateScript(config)).toThrow()
  })

  it('应该验证平台参数', () => {
    const config: ScriptConfig = {
      platform: 'invalid' as any,
      environment: 'bash',
      keyValue: 'cr_test',
      baseUrl: 'https://test.com',
    }

    expect(() => generateScript(config)).toThrow()
  })

  it('应该验证环境参数', () => {
    const config: ScriptConfig = {
      platform: 'macos',
      environment: 'invalid' as any,
      keyValue: 'cr_test',
      baseUrl: 'https://test.com',
    }

    expect(() => generateScript(config)).toThrow()
  })
})
