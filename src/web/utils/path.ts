/**
 * Web Extension 版本的 path 工具函数
 */
import { isAbsolute, join } from './path-core'

export const safe_join = (basePath: string, path: string) => {
  return isAbsolute(path) ? path : join(basePath, path)
}
