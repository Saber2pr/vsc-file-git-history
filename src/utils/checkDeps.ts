import vscode, { Extension } from 'vscode'
import { getArray } from './getArray'

const defaultList = [
  'mhutchie.git-graph',
  'gxl.git-graph-3',
  'med-h.git-graph-revamped',
  'linjun.git-graph-pro',
  'fyzhu.git-pretty-graph',
  'hansu.git-graph-2',
]

export const checkDeps = async () => {
  const extensionList = getArray<Extension<any>>(
    vscode?.extensions?.all as any
  ).map(ext => ext.id.toLowerCase())

  const gitGraphList = getArray(extensionList).filter(id =>
    defaultList.includes(id)
  )

  if (gitGraphList.length) {
    console.log('current git graph: ', gitGraphList)
  } else {
    const res = await vscode.window.showQuickPick(defaultList, {
      title: 'Select a plugin to enable Diff view',
    })
    if (res) {
      await vscode.commands.executeCommand(
        'workbench.extensions.installExtension',
        res
      )
      const selection = await vscode.window.showInformationMessage(
        `Ext ${res} installed, need reload window`,
        'Reload Now'
      )
      if (selection === 'Reload Now') {
        await vscode.commands.executeCommand('workbench.action.reloadWindow')
      }
    }
  }
}

const max = 5
let index = 0

export const loopCheck = () => {
  checkDeps().catch(reason => {
    vscode.window.showErrorMessage(String(reason))

    index++
    if (index > max) {
      return
    }

    loopCheck()
  })
}
