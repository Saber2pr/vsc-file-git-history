/**
 * Web Extension 版本的 encodeDiffDocUri
 * 使用浏览器 API 替代 Buffer
 */
import { Uri } from 'vscode'

const FS_REGEX = /\\/g

export function getPathFromStr(str: string) {
  return str.replace(FS_REGEX, '/')
}

// Base64 编码函数（替代 Buffer）
function base64Encode(str: string): string {
  if (typeof btoa !== 'undefined') {
    return btoa(unescape(encodeURIComponent(str)))
  }
  // 降级方案：使用 TextEncoder
  const encoder = new TextEncoder()
  const bytes = encoder.encode(str)
  const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join('')
  return btoa(binary)
}

export function encodeDiffDocUri(
  repo: string,
  filePath: string,
  commit: string,
  exists: boolean
): Uri {
  const data = {
    filePath: getPathFromStr(filePath),
    commit: commit,
    repo: repo,
    exists: exists,
  }

  let extension: string
  const extIndex = data.filePath.indexOf(
    '.',
    data.filePath.lastIndexOf('/') + 1
  )
  extension = extIndex > -1 ? data.filePath.substring(extIndex) : ''

  return Uri.file('file' + extension).with({
    scheme: 'diff-view',
    query: base64Encode(JSON.stringify(data)),
  })
}

