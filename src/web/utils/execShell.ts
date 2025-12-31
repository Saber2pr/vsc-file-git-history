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
    // 在 web 环境中，如果没有有效的 workspace 路径，不设置 cwd
    const terminalOptions: vscode.TerminalOptions = {
      name: 'Command',
    }
    if (rootPath) {
      terminalOptions.cwd = rootPath
    }

    if (stdio === 'inherit') {
      // 交互式命令，使用终端
      const terminal = vscode.window.createTerminal(terminalOptions)
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

