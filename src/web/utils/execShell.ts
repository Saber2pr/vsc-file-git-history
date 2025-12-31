/**
 * Web Extension 版本的 execShell
 * 使用 VS Code Terminal API
 */
import * as vscode from 'vscode'
import { StdioOptions } from 'child_process'
import { getRootPath } from './getRootPath'

export const execShell = (
  command: string,
  args: string[],
  stdio?: StdioOptions
) =>
  new Promise<string>((resolve, reject) => {
    const rootPath = getRootPath()
    const cwd = rootPath?.fsPath || '/workspace'

    if (stdio === 'inherit') {
      // 交互式命令，使用终端
      const terminal = vscode.window.createTerminal({
        name: 'Command',
        cwd,
      })
      terminal.sendText(`${command} ${args.join(' ')}`)
      terminal.show()
      resolve('')
    } else {
      // 非交互式命令，在 web 环境中可能不支持
      reject(
        new Error(
          `Command execution is not fully supported in web extensions. Command: ${command} ${args.join(' ')}`
        )
      )
    }
  })

