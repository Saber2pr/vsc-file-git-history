import { checkoutCommit } from './utils/git'
import {
  FileHistoryViewerProvider,
  NodeItem,
} from './FileHistoryViewerProvider'
import * as vscode from 'vscode'
import { COM_CHECKOUT } from './constants'

// install
export function activate(context: vscode.ExtensionContext) {
  const Provider = new FileHistoryViewerProvider()

  const TreeView = vscode.window.createTreeView('file-git-history', {
    treeDataProvider: Provider,
  })
  context.subscriptions.push(
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
            await checkoutCommit(commit)
            progress.report({
              increment: 100,
              message: `checkouted commit: ${commit}`,
            })
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
