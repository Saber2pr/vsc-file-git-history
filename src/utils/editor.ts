import vscode from 'vscode'

export const getRootPath = () => vscode.workspace.workspaceFolders?.[0]?.uri
