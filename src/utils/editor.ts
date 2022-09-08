import { existsSync } from 'fs'
import vscode from 'vscode'
import { isNotNullOrUndefined } from './is'
import { safe_join } from './path'

export const getRootPath = () => vscode.workspace.workspaceFolders?.[0]?.uri

export const openFile = async (
  path: string,
  edit?: {
    offset: number
    text: string
  }
) => {
  const rootPath = getRootPath().fsPath
  const filePath = safe_join(rootPath, path)
  if (existsSync(filePath)) {
    try {
      const document = await vscode.workspace.openTextDocument(filePath)
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
    }
  } else {
    vscode.window.showErrorMessage(`file not found ${path}`)
  }
}

export const jumpToFile = async (
  path: string,
  offset?: number,
  offsetLength: number = offset
) => {
  const rootPath = getRootPath().fsPath
  const filePath = safe_join(rootPath, path)
  const document = await vscode.workspace.openTextDocument(
    vscode.Uri.file(filePath)
  )
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
}
