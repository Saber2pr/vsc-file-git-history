import * as vscode from 'vscode'

import { COM_CHECKOUT, COM_OPEN_FILE } from './constants'
import {
  FileHistoryViewerProvider,
  NodeItem,
} from './FileHistoryViewerProvider'
import { openFile } from './utils/editor'
import { checkoutCommit } from './utils/git'

// install
export function activate(context: vscode.ExtensionContext) {
  const Provider = new FileHistoryViewerProvider()
  
  const TreeView = vscode.window.createTreeView('file-git-history', {
    treeDataProvider: Provider,
  })
  context.subscriptions.push(
    vscode.commands.registerCommand(COM_OPEN_FILE, async () => {
    const filePath = Provider.getCurrentFilePath()
      try {
        if (filePath) {
          await openFile(filePath)
        } else {
          throw 'no such file:' + filePath
        }
      } catch (error) {
        vscode.window.showErrorMessage(`Open File Fail: ${String(error)}`)
      }
    }),
    TreeView,
    vscode.window.onDidChangeActiveTextEditor(Provider.changeEditor),
    vscode.commands.registerCommand(COM_CHECKOUT, (node: NodeItem) => {
      const commit = node?.commit?.commit
      if (commit) {
        vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
          },
          async progress => {
            progress.report({ increment: 0 })
            try {
              await checkoutCommit(commit)
            } catch (error) {
              console.log(error)
              if (/err/.test(error)) {
                vscode.window.showErrorMessage(error)
              } else {
                const title = node?.commit?.title
                vscode.window.showInformationMessage(
                  `Checkouted ${commit.slice(0, 7)}: ${title}`
                )
              }
            }
            progress.report({ increment: 100 })
          }
        )
      } else {
        vscode.window.showErrorMessage(`Checkout Commit Fail.`)
      }
    })
  )
}

// uninstall
export function deactivate() {}
