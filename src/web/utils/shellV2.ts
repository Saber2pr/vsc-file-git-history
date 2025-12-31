/**
 * Web Extension 版本的 shell 执行
 * 使用 VS Code Terminal API 执行命令
 */
import * as vscode from 'vscode'
import { StdioOptions } from 'child_process'

export const execShellV2 = async (
  command: string,
  args: string[] = [],
  stdio: StdioOptions = 'inherit',
  cwd = '/workspace',
  env = {},
  log = true
): Promise<{
  data: string
  code: number
}> => {
  if (stdio === 'inherit') {
    // 对于交互式命令，使用终端执行
    const terminal = vscode.window.createTerminal({
      name: 'Git Command',
      cwd,
      env: {
        ...env,
      },
    })
    terminal.sendText(`${command} ${args.join(' ')}`)
    terminal.show()
    return {
      data: '',
      code: 0,
    }
  } else {
    // 对于需要捕获输出的命令，使用 VS Code 的 executeCommand
    // 注意：VS Code Web 可能不支持直接执行 shell 命令
    // 这里提供一个占位实现
    try {
      // 尝试使用 VS Code 的 executeCommand 执行 git 命令
      // 但这在 web 环境中可能不可用
      const fullCommand = `${command} ${args.join(' ')}`
      log && console.log(`+ ${fullCommand}`)

      // 在 web 环境中，git 命令需要通过终端执行
      // 这里返回一个错误提示
      throw new Error(
        `Git commands are not directly supported in web extensions. Please use the terminal to run: ${fullCommand}`
      )
    } catch (error: any) {
      return {
        data: error.message || String(error),
        code: 1,
      }
    }
  }
}

export const runCmdV2 = async (
  cwd: string,
  cmd: string,
  env = {},
  stdio: StdioOptions = 'pipe',
  log = false
) => {
  let output: string
  let error: string
  let code = 0

  const meta = cmd.split(' ')
  const cli = meta.shift()

  try {
    const res = await execShellV2(cli!, meta, stdio, cwd, env, log)
    output = res?.data
    code = res?.code
  } catch (e: any) {
    error = e?.data || e?.message || String(e)
    code = e?.code || 1
  }
  return {
    output,
    error,
    code,
  }
}

