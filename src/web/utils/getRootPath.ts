import * as vscode from 'vscode'

export const getRootPath = (): string | undefined => {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]
  if (!workspaceFolder) {
    return undefined
  }
  // 在 web 环境中，fsPath 可能返回无效路径（如 /workspace）
  // 尝试使用 path 属性，如果不可用则使用 fsPath
  const path = workspaceFolder.uri.path || workspaceFolder.uri.fsPath
  // 如果路径是 /workspace 或无效，返回 undefined，让调用者处理
  if (path === '/workspace' || !path) {
    return undefined
  }
  return path
}

