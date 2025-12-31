/**
 * Web Extension 版本的 editor 工具函数
 */
import * as vscode from 'vscode'
import { isNotNullOrUndefined } from '../utils/is'
import { safe_join } from '../utils/path'

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

  const filePath = safe_join(rootPath.fsPath, path)
  const fileUri = vscode.Uri.file(filePath)

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

  const filePath = safe_join(rootPath.fsPath, path)
  const fileUri = vscode.Uri.file(filePath)

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

