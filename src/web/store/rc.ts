/**
 * Web Extension 版本的 RCManager
 * 使用 VS Code workspace.fs API 替代 fs-extra
 */
import * as vscode from 'vscode'
import { resolve } from '../utils/path-core'
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
      // 使用 vscode.Uri 的方法获取父目录，而不是使用 fsPath
      const parentUri = vscode.Uri.joinPath(uri, '..')
      try {
        await vscode.workspace.fs.stat(parentUri)
      } catch {
        // 父目录不存在，尝试创建
        try {
          await vscode.workspace.fs.createDirectory(parentUri)
        } catch {
          // 忽略创建失败（可能父目录已经存在或无法创建）
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
    // 在 web 环境中，优先使用 workspace 文件夹
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]
    if (workspaceFolder) {
      // 使用 workspace 文件夹作为基础路径
      this.uri = vscode.Uri.joinPath(workspaceFolder.uri, configPath)
    } else {
      // 如果没有 workspace 文件夹，尝试使用 homedir
      const configFilePath = resolve(homedir(), configPath)
      // 在 web 环境中，避免使用 fsPath，直接使用 Uri
      if (configFilePath.startsWith('/') || configFilePath.match(/^[a-zA-Z]:/)) {
        this.uri = vscode.Uri.file(configFilePath)
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

