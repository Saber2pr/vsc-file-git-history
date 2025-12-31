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

export interface ParsedPath {
  root: string
  dir: string
  base: string
  name: string
  ext: string
}

export function parse(path: string): ParsedPath {
  const isWindows = /^[a-zA-Z]:/.test(path)
  const root = isWindows ? path.match(/^[a-zA-Z]:/)?.[0] || '' : path.startsWith('/') ? '/' : ''
  
  // 移除 root
  let pathWithoutRoot = path.slice(root.length)
  
  // 获取目录部分
  const lastSlashIndex = pathWithoutRoot.lastIndexOf('/')
  const dir = lastSlashIndex >= 0 
    ? root + pathWithoutRoot.slice(0, lastSlashIndex)
    : root
  
  // 获取文件名部分
  const base = lastSlashIndex >= 0 
    ? pathWithoutRoot.slice(lastSlashIndex + 1)
    : pathWithoutRoot
  
  // 获取扩展名
  const lastDotIndex = base.lastIndexOf('.')
  const ext = lastDotIndex > 0 ? base.slice(lastDotIndex) : ''
  const name = lastDotIndex > 0 ? base.slice(0, lastDotIndex) : base
  
  return {
    root,
    dir: dir || root,
    base: base || '',
    name,
    ext,
  }
}

export function dirname(path: string): string {
  const parsed = parse(path)
  return parsed.dir || parsed.root || '.'
}

export function resolve(...paths: string[]): string {
  if (paths.length === 0) {
    return '.'
  }
  
  let resolvedPath = ''
  let resolvedAbsolute = false
  
  // 从右到左处理路径
  for (let i = paths.length - 1; i >= 0; i--) {
    const path = paths[i]
    if (!path) {
      continue
    }
    
    if (isAbsolute(path)) {
      resolvedPath = path
      resolvedAbsolute = true
      break
    }
    
    resolvedPath = path + (resolvedPath ? '/' + resolvedPath : '')
  }
  
  // 规范化路径：移除 . 和 ..，处理多个斜杠
  const parts = resolvedPath.split('/').filter(p => p && p !== '.')
  const result: string[] = []
  
  for (const part of parts) {
    if (part === '..') {
      if (result.length > 0 && result[result.length - 1] !== '..') {
        result.pop()
      } else if (!resolvedAbsolute) {
        result.push(part)
      }
    } else {
      result.push(part)
    }
  }
  
  if (resolvedAbsolute) {
    return '/' + result.join('/')
  } else if (result.length === 0) {
    return '.'
  } else {
    return result.join('/')
  }
}

