import { FileHistoryViewerProvider } from './FileHistoryViewerProvider'
import * as vscode from 'vscode'

// install
export function activate(context: vscode.ExtensionContext) {
  const Provider = new FileHistoryViewerProvider()

  const TreeView = vscode.window.createTreeView('file-git-history', {
    treeDataProvider: Provider,
  })

  context.subscriptions.push(
    TreeView,
    vscode.window.onDidChangeActiveTextEditor(Provider.changeEditor)
  )
}

// uninstall
export function deactivate() {}
