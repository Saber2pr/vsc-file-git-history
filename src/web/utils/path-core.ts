/**
 * Web Extension 版本的 path 核心函数
 */
export function join(...paths: string[]): string {
  return paths
    .filter(p => p)
    .map((p, i) => {
      if (i === 0) {
        return p.replace(/\/$/, '')
      }
      return p.replace(/^\//, '').replace(/\/$/, '')
    })
    .join('/')
}

export function isAbsolute(path: string): boolean {
  return path.startsWith('/') || /^[a-zA-Z]:/.test(path)
}

