import { resolve } from 'path'
import { execShell } from './execShell'

export type Commit = {
  title: string
  commit: string
  index: number
}

// git log --follow --abbrev-commit --pretty=oneline -- <file>
export const getFileCommits = async (path: string): Promise<Commit[]> => {
  const str = await execShell('git', [
    'log',
    '--follow',
    '--pretty=oneline',
    '--',
    resolve(path),
  ])
  if (str) {
    const lines = str.split('\n').filter(line => !!line.trim())
    return lines.map((item, i) => {
      const index = item.indexOf(' ')
      return {
        commit: item.slice(0, index),
        title: item.slice(index + 1),
        index: lines.length - (i + 1),
      }
    })
  }
}

export const checkoutCommit = async (commit: string) => {
  await execShell('git', ['checkout', commit], 'inherit')
}
