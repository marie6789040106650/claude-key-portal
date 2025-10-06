/**
 * 头像工具函数
 * Sprint 14 - Phase 7 🔵 REFACTOR
 *
 * 提供头像生成和处理功能
 */

/**
 * 获取用户头像 URL
 *
 * @param {string | null | undefined} avatarUrl - 用户的头像 URL
 * @param {string} fallbackText - 生成默认头像的文本（通常是用户名或邮箱）
 * @returns {string | null} 头像 URL 或 null（表示使用默认头像）
 *
 * @example
 * getUserAvatarUrl('https://example.com/avatar.jpg', 'John') // => 'https://example.com/avatar.jpg'
 * getUserAvatarUrl(null, 'John') // => null（使用默认头像）
 */
export function getUserAvatarUrl(
  avatarUrl: string | null | undefined,
  fallbackText: string
): string | null {
  // 如果有有效的头像 URL，直接返回
  if (avatarUrl && isValidUrl(avatarUrl)) {
    return avatarUrl
  }

  // 否则返回 null，表示使用默认头像
  return null
}

/**
 * 验证 URL 是否有效
 *
 * @param {string} url - 待验证的 URL
 * @returns {boolean} 是否为有效 URL
 *
 * @example
 * isValidUrl('https://example.com/image.jpg') // => true
 * isValidUrl('invalid-url') // => false
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * 生成默认头像的首字母
 *
 * @param {string} name - 用户名或邮箱
 * @returns {string} 首字母（1-2个字符）
 *
 * @example
 * getAvatarInitials('John Doe') // => 'JD'
 * getAvatarInitials('张三') // => '张三'
 * getAvatarInitials('user@example.com') // => 'U'
 */
export function getAvatarInitials(name: string): string {
  if (!name) return '?'

  // 如果是邮箱，取邮箱前缀的首字母
  if (name.includes('@')) {
    const prefix = name.split('@')[0]
    return prefix.charAt(0).toUpperCase()
  }

  // 分词
  const words = name.trim().split(/\s+/)

  if (words.length === 0) return '?'

  // 如果是中文名（通常2-3个字），直接返回
  if (name.length <= 3 && /[\u4e00-\u9fa5]/.test(name)) {
    return name
  }

  // 如果是英文名，取每个单词的首字母，最多2个
  if (words.length === 1) {
    // 单个单词，取前两个字母
    return words[0].substring(0, 2).toUpperCase()
  }

  // 多个单词，取前两个单词的首字母
  return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase()
}

/**
 * 根据字符串生成确定性的颜色
 *
 * @param {string} str - 输入字符串（通常是用户名或邮箱）
 * @returns {string} Tailwind CSS 背景色类名
 *
 * @example
 * getAvatarColor('John Doe') // => 'bg-blue-500'
 * getAvatarColor('Jane Smith') // => 'bg-green-500'
 */
export function getAvatarColor(str: string): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-cyan-500',
  ]

  // 使用简单的哈希函数生成索引
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }

  const index = Math.abs(hash) % colors.length
  return colors[index]
}

/**
 * 获取头像的 Fallback 属性
 *
 * @param {string} name - 用户名或邮箱
 * @returns {object} 包含 initials 和 color 的对象
 *
 * @example
 * const { initials, color } = getAvatarFallback('John Doe')
 * // initials: 'JD', color: 'bg-blue-500'
 */
export function getAvatarFallback(name: string) {
  return {
    initials: getAvatarInitials(name),
    color: getAvatarColor(name),
  }
}

/**
 * 处理头像上传文件
 *
 * @param {File} file - 上传的文件
 * @returns {Promise<string | null>} Base64 编码的图片数据 URL 或 null
 *
 * @example
 * const file = event.target.files[0]
 * const dataUrl = await processAvatarUpload(file)
 */
export async function processAvatarUpload(file: File): Promise<string | null> {
  // 验证文件类型
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!validTypes.includes(file.type)) {
    throw new Error('不支持的文件类型，请上传 JPG、PNG、GIF 或 WebP 格式的图片')
  }

  // 验证文件大小（最大 5MB）
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    throw new Error('文件大小超过限制，请上传小于 5MB 的图片')
  }

  // 读取文件并转换为 Data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const result = e.target?.result
      if (typeof result === 'string') {
        resolve(result)
      } else {
        reject(new Error('文件读取失败'))
      }
    }

    reader.onerror = () => {
      reject(new Error('文件读取失败'))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * 调整图片大小
 *
 * @param {string} dataUrl - 图片的 Data URL
 * @param {number} maxWidth - 最大宽度
 * @param {number} maxHeight - 最大高度
 * @returns {Promise<string>} 调整后的 Data URL
 *
 * @example
 * const resizedUrl = await resizeImage(dataUrl, 200, 200)
 */
export async function resizeImage(
  dataUrl: string,
  maxWidth: number = 200,
  maxHeight: number = 200
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()

    img.onload = () => {
      const canvas = document.createElement('canvas')
      let { width, height } = img

      // 计算缩放比例
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
      }

      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas context not available'))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.9))
    }

    img.onerror = () => {
      reject(new Error('图片加载失败'))
    }

    img.src = dataUrl
  })
}
