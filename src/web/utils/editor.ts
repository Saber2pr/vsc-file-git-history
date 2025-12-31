/**
 * Web Extension 版本的 editor 工具函数
 */
import * as vscode from 'vscode'
import { isNotNullOrUndefined } from '../utils/is'

export const getRootPath = () => vscode.workspace.workspaceFolders?.[0]?.uri

export const openFile = async (
  path: string,
  edit?: {
    offset: number
    text: string
  }
) => {
  const rootPath = getRootPath()
  if (!rootPath) {
    vscode.window.showErrorMessage('No workspace folder found')
    return
  }

  // 在 web 环境中，使用 vscode.Uri.joinPath 而不是 fsPath
  const fileUri = vscode.Uri.joinPath(rootPath, path)

  try {
    // 检查文件是否存在
    try {
      await vscode.workspace.fs.stat(fileUri)
    } catch {
      vscode.window.showErrorMessage(`file not found ${path}`)
      return
    }

    const document = await vscode.workspace.openTextDocument(fileUri)
    const editor = await vscode.window.showTextDocument(document)
    if (edit) {
      const { offset, text } = edit
      await editor.edit(edit =>
        edit.insert(document.positionAt(offset), text)
      )
      // 选中生成的代码
      editor.selection = new vscode.Selection(
        document.positionAt(offset),
        document.positionAt(offset + text.length)
      )
    }
  } catch (error) {
    console.log(error)
    vscode.window.showErrorMessage(`Failed to open file: ${String(error)}`)
  }
}

export const jumpToFile = async (
  path: string,
  offset?: number,
  offsetLength: number = offset
) => {
  const rootPath = getRootPath()
  if (!rootPath) {
    return
  }

  // 在 web 环境中，使用 vscode.Uri.joinPath 而不是 fsPath
  const fileUri = vscode.Uri.joinPath(rootPath, path)

  try {
    const document = await vscode.workspace.openTextDocument(fileUri)
    const editor = await vscode.window.showTextDocument(document)
    if (isNotNullOrUndefined(offset) && isNotNullOrUndefined(offsetLength)) {
      editor.selection = new vscode.Selection(
        document.positionAt(offset),
        document.positionAt(offset + offsetLength)
      )
      editor.revealRange(
        new vscode.Range(
          document.positionAt(offset),
          document.positionAt(offset + offsetLength)
        )
      )
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to jump to file: ${String(error)}`)
  }
}

