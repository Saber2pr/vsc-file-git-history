import * as vscode from 'vscode'

import {
  COM_CHECKOUT,
  COM_COPY_COMMIT,
  COM_HIDE_TIME,
  COM_OPEN_FILE,
  COM_RELOAD,
  COM_SHOW_TIME,
  CONFIG_KEY_SHOWTIME,
} from './constants'
import {
  FileHistoryViewerProvider,
  NodeItem,
} from './FileHistoryViewerProvider'
import { loopCheck } from './utils/checkDeps'
import { openFile } from './utils/editor'
import { checkoutCommit, getRepoCwd } from './utils/git'
import { getContext, setContext } from './utils/setContext'

// install
export function activate(context: vscode.ExtensionContext) {
  const Provider = new FileHistoryViewerProvider()

  const refresh = (activeTextEditor = vscode.window.activeTextEditor) =>
    getContext(CONFIG_KEY_SHOWTIME).then(res => {
      Provider.reloadEditor(activeTextEditor, res === 'on' ? false : true)
    })
  refresh()

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
    TreeView.onDidChangeSelection(e => {
      loopCheck()
    }),
    vscode.window.onDidChangeActiveTextEditor(editor => {
      getContext(CONFIG_KEY_SHOWTIME).then(res => {
        Provider.changeEditor(editor, res === 'on' ? false : true)
      })
    }),
    vscode.commands.registerCommand(COM_RELOAD, refresh),
    vscode.commands.registerCommand(COM_SHOW_TIME, () => {
      const activeTextEditor = vscode.window.activeTextEditor
      if (activeTextEditor) {
        setContext(CONFIG_KEY_SHOWTIME, 'off')
        Provider.reloadEditor(activeTextEditor, true)
      }
    }),
    vscode.commands.registerCommand(COM_HIDE_TIME, () => {
      const activeTextEditor = vscode.window.activeTextEditor
      if (activeTextEditor) {
        setContext(CONFIG_KEY_SHOWTIME, 'on')
        Provider.reloadEditor(activeTextEditor, false)
      }
    }),
    vscode.commands.registerCommand(COM_COPY_COMMIT, async (node: NodeItem) => {
      const commit = node?.commit?.commit
      if (commit) {
        try {
          await vscode.env.clipboard.writeText(commit)
        } catch (error) {
          vscode.window.showErrorMessage(`Copy commit fail:` + String(error))
        }
      } else {
        vscode.window.showErrorMessage(`Copy commit fail: not commit`)
      }
    }),
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
              await checkoutCommit(getRepoCwd(), commit)
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
