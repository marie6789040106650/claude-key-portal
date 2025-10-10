/**
 * Clipboard API Mock配置
 *
 * 为所有测试提供统一的clipboard mock
 */

/**
 * Mock Clipboard API
 */
const mockClipboard = {
  writeText: jest.fn().mockResolvedValue(undefined),
  readText: jest.fn().mockResolvedValue(''),
  write: jest.fn().mockResolvedValue(undefined),
  read: jest.fn().mockResolvedValue([]),
}

// 设置全局clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: mockClipboard,
  writable: true,
  configurable: true,
})

/**
 * 辅助函数: Mock写入成功
 */
export function mockClipboardWriteSuccess(text: string = 'copied'): void {
  mockClipboard.writeText.mockResolvedValueOnce(undefined)
}

/**
 * 辅助函数: Mock写入失败
 */
export function mockClipboardWriteError(error: Error = new Error('Clipboard write failed')): void {
  mockClipboard.writeText.mockRejectedValueOnce(error)
}

/**
 * 辅助函数: Mock读取成功
 */
export function mockClipboardReadSuccess(text: string = 'clipboard content'): void {
  mockClipboard.readText.mockResolvedValueOnce(text)
}

/**
 * 辅助函数: Mock读取失败
 */
export function mockClipboardReadError(error: Error = new Error('Clipboard read failed')): void {
  mockClipboard.readText.mockRejectedValueOnce(error)
}

/**
 * 辅助函数: 重置Mock
 */
export function resetClipboardMock(): void {
  mockClipboard.writeText.mockClear()
  mockClipboard.readText.mockClear()
  mockClipboard.write.mockClear()
  mockClipboard.read.mockClear()

  // 重置为默认行为
  mockClipboard.writeText.mockResolvedValue(undefined)
  mockClipboard.readText.mockResolvedValue('')
  mockClipboard.write.mockResolvedValue(undefined)
  mockClipboard.read.mockResolvedValue([])
}

/**
 * 辅助函数: 验证写入调用
 */
export function expectClipboardWriteCalled(text: string): void {
  expect(mockClipboard.writeText).toHaveBeenCalledWith(text)
}

/**
 * 辅助函数: 验证未调用
 */
export function expectClipboardNotCalled(): void {
  expect(mockClipboard.writeText).not.toHaveBeenCalled()
  expect(mockClipboard.readText).not.toHaveBeenCalled()
}

/**
 * 辅助函数: 获取写入的文本
 */
export function getClipboardWrittenText(): string | undefined {
  const calls = mockClipboard.writeText.mock.calls
  if (calls.length === 0) return undefined
  return calls[calls.length - 1][0]
}

// 导出mock实例供测试使用
export { mockClipboard }
