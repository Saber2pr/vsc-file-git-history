import * as vscode from 'vscode'

import {
  COM_CHECKOUT,
  COM_COPY_COMMIT,
  COM_HIDE_TIME,
  COM_OPEN_FILE,
  COM_RELOAD,
  COM_SHOW_TIME,
  CONFIG_KEY_SHOWTIME,
  CONFIG_KEY_SHOWAUTH,
  COM_SHOW_AUTH,
  COM_HIDE_AUTH,
} from './constants'
import {
  FileHistoryViewerProvider,
  NodeItem,
} from './FileHistoryViewerProvider'
import { loopCheck } from './utils/checkDeps'
import { openFile } from './utils/editor'
import { checkoutCommit, getRepoCwd } from './utils/git'
import { getContext, getContexts, setContext } from './utils/setContext'

// install
export function activate(context: vscode.ExtensionContext) {
  const Provider = new FileHistoryViewerProvider()

  const refresh = (activeTextEditor = vscode.window.activeTextEditor) => {
    getContexts(CONFIG_KEY_SHOWTIME, CONFIG_KEY_SHOWAUTH).then(
      ([showTime, showAuth]) => {
        Provider.reloadEditor(activeTextEditor, {
          showTime: showTime === 'on' ? false : true,
          showAuth: showAuth === 'on' ? false : true,
        })
      }
    )
  }
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
      getContexts(CONFIG_KEY_SHOWTIME, CONFIG_KEY_SHOWAUTH).then(
        ([showTime, showAuth]) => {
          Provider.changeEditor(editor, {
            showTime: showTime === 'on' ? false : true,
            showAuth: showAuth === 'on' ? false : true,
          })
        }
      )
    }),
    vscode.commands.registerCommand(COM_RELOAD, refresh),
    vscode.commands.registerCommand(COM_SHOW_TIME, () => {
      const activeTextEditor = vscode.window.activeTextEditor
      if (activeTextEditor) {
        setContext(CONFIG_KEY_SHOWTIME, 'off')
        Provider.reloadEditor(activeTextEditor, {
          showTime: true,
        })
      }
    }),
    vscode.commands.registerCommand(COM_HIDE_TIME, () => {
      const activeTextEditor = vscode.window.activeTextEditor
      if (activeTextEditor) {
        setContext(CONFIG_KEY_SHOWTIME, 'on')
        Provider.reloadEditor(activeTextEditor, {
          showTime: false,
        })
      }
    }),
    vscode.commands.registerCommand(COM_SHOW_AUTH, () => {
      const activeTextEditor = vscode.window.activeTextEditor
      if (activeTextEditor) {
        setContext(CONFIG_KEY_SHOWAUTH, 'off')
        Provider.reloadEditor(activeTextEditor, {
          showAuth: true,
        })
      }
    }),
    vscode.commands.registerCommand(COM_HIDE_AUTH, () => {
      const activeTextEditor = vscode.window.activeTextEditor
      if (activeTextEditor) {
        setContext(CONFIG_KEY_SHOWAUTH, 'on')
        Provider.reloadEditor(activeTextEditor, {
          showAuth: false,
        })
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
