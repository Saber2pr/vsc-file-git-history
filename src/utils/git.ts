import path from 'path'
import fs from 'fs'
import { runCmdV2 } from './shellV2'
import { getRootPath } from './getRootPath'

// git log --stat --pretty=oneline -- <file>
/**

commit e9c563ec335f69568c3414ee4d35b3ea04dd2dcb
Author: saber2pr <saber2pr@gmail.com>
Date:   Mon Aug 29 10:16:47 2022 +0800

    chore: update

 README.md | 46 ++++++++++++++++++++++++++++++++++++++++++++++
 1 file changed, 46 insertions(+)

 */
export const getFileCommits = async (
  cwd: string,
  path: string
): Promise<Commit[]> => {
  const res = await runCmdV2(cwd, `git log --stat --pretty=medium -- "${path}"`)
  if (res?.output) {
    return parseLog(res?.output)
  }
}

export const checkoutCommit = async (cwd: string, commit: string) => {
  return await runCmdV2(cwd, `git checkout ${commit}`)
}

export interface Commit {
  title: string
  commit: string
  file: string
  changes: number
  changeFiles: number
  insertions: number
  deletions: number
  isFirstCommit?: boolean
  authorName: string
  authorEmail: string
  date: string
}

export const parseLog = (log: string) => {
  const lines = log.split('\n')
  const nodes: Commit[] = []
  for (const line of lines) {
    if (!line.trim()) {
      continue
    }

    if (/^commit/.test(line)) {
      nodes.push({} as any)
    }

    const item = nodes[nodes.length - 1]
    if (!item) {
      continue
    }

    if (/^commit/.test(line)) {
      item.commit = line.split(' ')[1]
    }
    if (/^Author/.test(line)) {
      const meta = line.split(' ')
      item.authorName = meta[1]
      item.authorEmail = meta[2].replace(/[<>]/g, '')
    }
    if (/^Date/.test(line)) {
      const str = line.replace('Date:', '').trim()
      item.date = str
    }
    if (/^ {4}/.test(line)) {
      item.title = line.trim()
    }
    if (/^ {1}/.test(line)) {
      const ch = '|'
      if (line.includes(ch)) {
        const [file, desc] = line.split(ch)
        item.file = file.trim()
        const changes = desc.match(/\d+/)?.[0]
        item.changes = changes ? Number(changes) : item.changes
      } else {
        const [changeFiles, str1, str2] = line.split(',')
        let insertions = ''
        let deletions = ''

        if (str1 && str2) {
          insertions = str1
          deletions = str2
        } else if (str1 && !str2) {
          if (/\+/.test(str1)) {
            insertions = str1
          }
          if (/-/.test(str1)) {
            deletions = str1
          }
        }

        if (changeFiles) {
          const changeFilesCount = changeFiles.match(/\d+/)?.[0]
          item.changeFiles = changeFilesCount
            ? Number(changeFilesCount)
            : item.changeFiles
        }

        if (insertions) {
          const insertionsCount = insertions.match(/\d+/)?.[0]
          item.insertions = insertionsCount
            ? Number(insertionsCount)
            : item.insertions
        }

        if (deletions) {
          const deletionsCount = deletions.match(/\d+/)?.[0]
          item.deletions = deletionsCount
            ? Number(deletionsCount)
            : item.deletions
        }
      }
    }
  }
  const first = nodes.pop()
  if (first) {
    first.isFirstCommit = true
    nodes.push(first)
  }
  return nodes
}

// git diff <start>^..<end> -- <file>
export const getFileCommitType = async (
  cwd: string,
  path: string,
  commit: string
): Promise<CommitType> => {
  try {
    const res = await runCmdV2(cwd, `git diff ${commit}^..${commit} -- ${path}`)
    const str = res?.output
    if (str) {
      if (/new file mode/.test(str)) {
        return 'new'
      }
      if (/deleted file mode/.test(str)) {
        return 'deleted'
      }
    }
  } catch (error) {}
  return 'update'
}

export type CommitType = 'new' | 'update' | 'deleted'

export function findGitRepoDir(startPath: string) {
  try {
    const maxDepth = 100
    let index = 0
    let currentPath = startPath

    while (currentPath !== path.parse(currentPath).root) {
      const gitDir = path.join(currentPath, '.git')
      if (fs.existsSync(gitDir)) {
        return currentPath
      }

      index++
      if (index > maxDepth) {
        return null
      }
      currentPath = path.dirname(currentPath) // 上级目录
    }

    return null // 如果找不到.git目录，返回null
  } catch (error) {
    return startPath
  }
}

export const getRepoCwd = () => {
  const rootPath = getRootPath()
  const repo = findGitRepoDir(rootPath)
  return repo
}
