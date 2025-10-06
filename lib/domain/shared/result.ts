/**
 * Result模式 - 统一的错误处理
 *
 * 用于封装操作结果，避免使用try-catch
 * 使代码更加函数式和类型安全
 */

export class Result<T> {
  public readonly isSuccess: boolean
  public readonly isFailure: boolean
  public readonly value?: T
  public readonly error?: Error

  private constructor(isSuccess: boolean, value?: T, error?: Error) {
    this.isSuccess = isSuccess
    this.isFailure = !isSuccess
    this.value = value
    this.error = error

    // 不变性检查
    if (isSuccess && error) {
      throw new Error('成功的Result不能包含错误')
    }
    if (!isSuccess && !error) {
      throw new Error('失败的Result必须包含错误')
    }

    Object.freeze(this)
  }

  /**
   * 创建成功的Result
   */
  static ok<U>(value?: U): Result<U> {
    return new Result<U>(true, value, undefined)
  }

  /**
   * 创建失败的Result
   */
  static fail<U>(error: string | Error): Result<U> {
    const errorObj = typeof error === 'string' ? new Error(error) : error
    return new Result<U>(false, undefined, errorObj)
  }

  /**
   * 组合多个Result
   * 只有所有Result都成功时才返回成功
   */
  static combine(results: Result<any>[]): Result<void> {
    for (const result of results) {
      if (result.isFailure) {
        return Result.fail(result.error!)
      }
    }
    return Result.ok()
  }

  /**
   * Map操作 - 转换成功的值
   */
  map<U>(fn: (value: T) => U): Result<U> {
    if (this.isFailure) {
      return Result.fail(this.error!)
    }
    try {
      return Result.ok(fn(this.value!))
    } catch (error) {
      return Result.fail(error as Error)
    }
  }

  /**
   * FlatMap操作 - 链式调用Result操作
   */
  flatMap<U>(fn: (value: T) => Result<U>): Result<U> {
    if (this.isFailure) {
      return Result.fail(this.error!)
    }
    try {
      return fn(this.value!)
    } catch (error) {
      return Result.fail(error as Error)
    }
  }

  /**
   * 获取值或抛出错误
   */
  unwrap(): T {
    if (this.isFailure) {
      throw this.error
    }
    return this.value!
  }

  /**
   * 获取值或返回默认值
   */
  unwrapOr(defaultValue: T): T {
    if (this.isFailure) {
      return defaultValue
    }
    return this.value!
  }
}

/**
 * 异步Result辅助函数
 */
export async function wrapAsync<T>(
  promise: Promise<T>
): Promise<Result<T>> {
  try {
    const value = await promise
    return Result.ok(value)
  } catch (error) {
    return Result.fail(error as Error)
  }
}
