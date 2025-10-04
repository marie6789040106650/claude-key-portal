/**
 * Script Templates Library
 * 脚本模板库 - 生成不同平台的环境配置脚本
 */

export interface ScriptConfig {
  platform: 'macos' | 'windows' | 'linux'
  environment: string
  keyValue: string
  baseUrl: string
}

// Template definitions
const TEMPLATES = {
  macos: {
    bash: `#!/bin/bash
# Claude Code Environment Configuration
# 添加到 ~/.bashrc

# Anthropic API Configuration
export ANTHROPIC_BASE_URL="{{baseUrl}}"
export ANTHROPIC_AUTH_TOKEN="{{keyValue}}"

echo "Claude Code configuration loaded successfully"
`,
    zsh: `#!/bin/zsh
# Claude Code Environment Configuration
# 添加到 ~/.zshrc

# Anthropic API Configuration
export ANTHROPIC_BASE_URL="{{baseUrl}}"
export ANTHROPIC_AUTH_TOKEN="{{keyValue}}"

echo "Claude Code configuration loaded successfully"
`,
    fish: `#!/usr/bin/env fish
# Claude Code Environment Configuration
# 添加到 ~/.config/fish/config.fish

# Anthropic API Configuration
set -x ANTHROPIC_BASE_URL "{{baseUrl}}"
set -x ANTHROPIC_AUTH_TOKEN "{{keyValue}}"

echo "Claude Code configuration loaded successfully"
`,
  },
  windows: {
    powershell: `# Claude Code Environment Configuration
# PowerShell Configuration Script

# Anthropic API Configuration
[System.Environment]::SetEnvironmentVariable("ANTHROPIC_BASE_URL", "{{baseUrl}}", "User")
[System.Environment]::SetEnvironmentVariable("ANTHROPIC_AUTH_TOKEN", "{{keyValue}}", "User")

Write-Host "Claude Code configuration completed successfully"
Write-Host "Please restart your terminal for changes to take effect"
`,
    cmd: `@echo off
REM Claude Code Environment Configuration
REM Command Prompt Configuration Script

REM Anthropic API Configuration
setx ANTHROPIC_BASE_URL "{{baseUrl}}"
setx ANTHROPIC_AUTH_TOKEN "{{keyValue}}"

echo Claude Code configuration completed successfully
echo Please restart your terminal for changes to take effect
`,
  },
  linux: {
    bash: `#!/bin/bash
# Claude Code Environment Configuration
# 添加到 ~/.bashrc

# Anthropic API Configuration
export ANTHROPIC_BASE_URL="{{baseUrl}}"
export ANTHROPIC_AUTH_TOKEN="{{keyValue}}"

echo "Claude Code configuration loaded successfully"
`,
    zsh: `#!/bin/zsh
# Claude Code Environment Configuration
# 添加到 ~/.zshrc

# Anthropic API Configuration
export ANTHROPIC_BASE_URL="{{baseUrl}}"
export ANTHROPIC_AUTH_TOKEN="{{keyValue}}"

echo "Claude Code configuration loaded successfully"
`,
    fish: `#!/usr/bin/env fish
# Claude Code Environment Configuration
# 添加到 ~/.config/fish/config.fish

# Anthropic API Configuration
set -x ANTHROPIC_BASE_URL "{{baseUrl}}"
set -x ANTHROPIC_AUTH_TOKEN "{{keyValue}}"

echo "Claude Code configuration loaded successfully"
`,
  },
}

// Installation instructions
const INSTRUCTIONS = {
  macos: {
    bash: [
      '1. 保存上面的脚本内容到 ~/.bashrc 文件末尾',
      '2. 运行 source ~/.bashrc 重新加载配置',
      '3. 验证配置: echo $ANTHROPIC_BASE_URL',
      '4. 重启终端使配置生效',
    ],
    zsh: [
      '1. 保存上面的脚本内容到 ~/.zshrc 文件末尾',
      '2. 运行 source ~/.zshrc 重新加载配置',
      '3. 验证配置: echo $ANTHROPIC_BASE_URL',
      '4. 重启终端使配置生效',
    ],
    fish: [
      '1. 保存上面的脚本内容到 ~/.config/fish/config.fish 文件末尾',
      '2. 运行 source ~/.config/fish/config.fish 重新加载配置',
      '3. 验证配置: echo $ANTHROPIC_BASE_URL',
      '4. 重启终端使配置生效',
    ],
  },
  windows: {
    powershell: [
      '1. 以管理员身份运行 PowerShell',
      '2. 复制上面的脚本内容并执行',
      '3. 重启终端使配置生效',
      '4. 验证配置: $env:ANTHROPIC_BASE_URL',
    ],
    cmd: [
      '1. 以管理员身份运行命令提示符',
      '2. 复制上面的脚本内容并执行',
      '3. 重启终端使配置生效',
      '4. 验证配置: echo %ANTHROPIC_BASE_URL%',
    ],
  },
  linux: {
    bash: [
      '1. 保存上面的脚本内容到 ~/.bashrc 文件末尾',
      '2. 运行 source ~/.bashrc 重新加载配置',
      '3. 验证配置: echo $ANTHROPIC_BASE_URL',
      '4. 重启终端使配置生效',
    ],
    zsh: [
      '1. 保存上面的脚本内容到 ~/.zshrc 文件末尾',
      '2. 运行 source ~/.zshrc 重新加载配置',
      '3. 验证配置: echo $ANTHROPIC_BASE_URL',
      '4. 重启终端使配置生效',
    ],
    fish: [
      '1. 保存上面的脚本内容到 ~/.config/fish/config.fish 文件末尾',
      '2. 运行 source ~/.config/fish/config.fish 重新加载配置',
      '3. 验证配置: echo $ANTHROPIC_BASE_URL',
      '4. 重启终端使配置生效',
    ],
  },
}

/**
 * 生成配置脚本
 */
export function generateScript(config: ScriptConfig): string {
  // Validate required fields
  if (!config.keyValue || config.keyValue.trim() === '') {
    throw new Error('密钥值不能为空')
  }
  if (!config.baseUrl || config.baseUrl.trim() === '') {
    throw new Error('基础URL不能为空')
  }

  // Get template
  const template = getTemplate(config.platform, config.environment)

  // Replace variables
  let script = template
  script = script.replace(/\{\{keyValue\}\}/g, config.keyValue)
  script = script.replace(/\{\{baseUrl\}\}/g, config.baseUrl)

  return script
}

/**
 * 获取原始模板
 */
export function getTemplate(
  platform: 'macos' | 'windows' | 'linux',
  environment: string
): string {
  // Validate platform
  if (!['macos', 'windows', 'linux'].includes(platform)) {
    throw new Error(`不支持的平台: ${platform}`)
  }

  // Get platform templates
  const platformTemplates = TEMPLATES[platform]
  if (!platformTemplates) {
    throw new Error(`不支持的平台: ${platform}`)
  }

  // Get environment template
  const template = platformTemplates[environment as keyof typeof platformTemplates]
  if (!template) {
    throw new Error(`平台 ${platform} 不支持环境 ${environment}`)
  }

  return template
}

/**
 * 获取安装说明
 */
export function getInstructions(
  platform: 'macos' | 'windows' | 'linux',
  environment: string
): string[] {
  // Validate platform
  if (!['macos', 'windows', 'linux'].includes(platform)) {
    throw new Error(`不支持的平台: ${platform}`)
  }

  // Get platform instructions
  const platformInstructions = INSTRUCTIONS[platform]
  if (!platformInstructions) {
    throw new Error(`不支持的平台: ${platform}`)
  }

  // Get environment instructions
  const instructions = platformInstructions[environment as keyof typeof platformInstructions]
  if (!instructions) {
    throw new Error(`平台 ${platform} 不支持环境 ${environment}`)
  }

  return instructions
}
