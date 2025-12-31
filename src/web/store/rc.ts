/**
 * Web Extension 版本的 RCManager
 * 使用 VS Code workspace.fs API 替代 fs-extra
 */
import * as vscode from 'vscode'
import { dirname, resolve } from '../utils/path-core'
import { homedir } from '../utils/os'

// TextEncoder 和 TextDecoder 在浏览器环境中是全局可用的
declare const TextEncoder: {
  new (): {
    encode(input?: string): Uint8Array
  }
}
declare const TextDecoder: {
  new (): {
    decode(input?: Uint8Array): string
  }
}

const SafeJSON: Pick<typeof JSON, 'parse' | 'stringify'> = {
  parse(text, ...args) {
    if (typeof text === 'string') {
      try {
        const obj = JSON.parse(text, ...args)
        if (typeof obj === 'object' && obj) {
          return obj
        } else {
          return {}
        }
      } catch (e) {
        return {}
      }
    } else {
      return {}
    }
  },
  stringify(obj: object, ...args: any[]) {
    if (obj) {
      return JSON.stringify(obj, ...args)
    } else {
      return ''
    }
  },
}

async function ensureFileExists(uri: vscode.Uri): Promise<void> {
  try {
    await vscode.workspace.fs.stat(uri)
  } catch {
    // 文件不存在，创建目录和文件
    try {
      const dirPath = dirname(uri.fsPath)
      const parts = dirPath.split('/').filter(p => p)
      let currentPath = ''
      for (const part of parts) {
        currentPath = currentPath ? `${currentPath}/${part}` : `/${part}`
        try {
          const dirUri = vscode.Uri.file(currentPath)
          await vscode.workspace.fs.stat(dirUri)
        } catch {
          try {
            const dirUri = vscode.Uri.file(currentPath)
            await vscode.workspace.fs.createDirectory(dirUri)
          } catch {
            // 忽略创建失败
          }
        }
      }
    } catch {
      // 忽略目录创建失败
    }
    // 创建空文件
    try {
      const encoder = new TextEncoder()
      await vscode.workspace.fs.writeFile(uri, encoder.encode(SafeJSON.stringify({})))
    } catch {
      // 忽略文件创建失败
    }
  }
}

export class RCManager {
  private uri: vscode.Uri

  constructor(configPath: string) {
    const configFilePath = resolve(homedir(), configPath)
    // 将路径转换为 Uri
    if (configFilePath.startsWith('/') || configFilePath.match(/^[a-zA-Z]:/)) {
      this.uri = vscode.Uri.file(configFilePath)
    } else {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0]
      if (workspaceFolder) {
        this.uri = vscode.Uri.joinPath(workspaceFolder.uri, configFilePath)
      } else {
        this.uri = vscode.Uri.file(configFilePath)
      }
    }
  }

  async get(key?: string) {
    await ensureFileExists(this.uri)

    const data = await vscode.workspace.fs.readFile(this.uri)
    const text = new TextDecoder().decode(data)
    const parsed = SafeJSON.parse(text)
    return key ? parsed[key] : parsed
  }

  getSync(key?: string) {
    throw new Error('getSync is not available in web extensions. Use get() instead.')
  }

  async mergeSet(value: any) {
    await ensureFileExists(this.uri)

    const data = await this.get()
    const newData = {
      ...(data || {}),
      ...(value || {}),
    }
    const encoder = new TextEncoder()
    await vscode.workspace.fs.writeFile(
      this.uri,
      encoder.encode(SafeJSON.stringify(newData, null, 2))
    )
    return newData
  }

  async set(key: string, value: any) {
    await ensureFileExists(this.uri)

    const data = await this.get()
    const newData = { ...data, [key]: value }
    const encoder = new TextEncoder()
    await vscode.workspace.fs.writeFile(
      this.uri,
      encoder.encode(SafeJSON.stringify(newData, null, 2))
    )
  }

  setSync(key: string, value: any) {
    throw new Error('setSync is not available in web extensions. Use set() instead.')
  }

  async delete(key: string) {
    await ensureFileExists(this.uri)

    const data = await this.get()
    delete data[key]
    const encoder = new TextEncoder()
    await vscode.workspace.fs.writeFile(
      this.uri,
      encoder.encode(SafeJSON.stringify(data, null, 2))
    )
  }

  deleteSync(key: string) {
    throw new Error('deleteSync is not available in web extensions. Use delete() instead.')
  }
}

