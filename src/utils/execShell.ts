import { spawn, StdioOptions } from 'child_process'

import { getRootPath } from './editor'

export const execShell = (
  command: string,
  args: string[],
  stdio?: StdioOptions
) =>
  new Promise<string>((resolve, reject) => {
    const task = spawn(command, args, {
      cwd: getRootPath()?.fsPath,
      env: process.env,
      shell: true,
      stdio,
    })

    if (stdio === 'inherit') {
      task.on('close', resolve)
    } else {
      let result = ''
      let error = ''
      task.stdout.on('data', data => {
        result += data
      })

      task.stderr.on('data', data => {
        error += data
      })

      task.on('close', () => {
        if (result) {
          resolve(result)
        }
        if (error) {
          reject(error)
        }
      })
    }
  })
