import { StdioOptions, spawn } from 'child_process'

export const execShellV2 = (
  command: string,
  args: string[] = [],
  stdio: StdioOptions = 'inherit',
  cwd = process.cwd(),
  env = {},
  log = true
) =>
  new Promise<{
    data: string
    code: number
  }>((resolve, reject) => {
    log && console.log(`+ ${command} ${args.join(' ')}`)
    const task = spawn(command, args, {
      cwd,
      env: {
        ...(process?.env || {}),
        ...env,
      },
      shell: true,
      stdio,
    })

    if (stdio === 'inherit') {
      task.on('close', resolve)
    } else {
      let result = ''
      let error = ''
      task.stdout.on('data', data => {
        console.log(`${data}`)
        result += data
      })

      task.stderr.on('data', data => {
        error += data
      })

      task.on('exit', code => {
        if (code === 0) {
          resolve({
            code: 0,
            data: result,
          })
        } else {
          reject({
            code,
            data: error,
          })
        }
      })

      task.on('close', code => {
        if (code === 0) {
          resolve({
            code: 0,
            data: result,
          })
        } else {
          reject({
            code,
            data: error,
          })
        }
      })
    }
  })

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
    const res = await execShellV2(cli, meta, stdio, cwd, env, log)
    output = res?.data
    code = res?.code
  } catch (e) {
    error = e?.data || e
    code = e?.code
  }
  return {
    output,
    error,
    code,
  }
}
