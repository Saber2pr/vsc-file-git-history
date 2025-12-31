import * as vscode from 'vscode'

export const getRootPath = (): string | undefined => {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]
  return workspaceFolder?.uri.fsPath
}

