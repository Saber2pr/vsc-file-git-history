/**
 * Web Extension 版本的 git 工具函数
 * 注意：在 web 环境中，git 命令执行可能受限
 */
import { runCmdV2 } from './shellV2'
import { getRootPath } from './getRootPath'
import { dirname } from './path-core'
import * as vscode from 'vscode'

// git log --stat --pretty=oneline -- <file>
export const getFileCommits = async (
  cwd: string,
  path: string
): Promise<Commit[] | undefined> => {
  const res = await runCmdV2(cwd, `git log --stat --pretty=medium -- "${path}"`)
  if (res?.output) {
    return parseLog(res?.output)
  }
  return undefined
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
      const title = item.title
      item.title = title ? title + '\n' + line.trim() : line.trim()
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

export function findGitRepoDir(startPath: string): string | null {
  try {
    // 在 web 环境中，简化实现：直接返回 startPath
    // 因为异步文件系统操作在同步上下文中不可用
    // git 命令会在正确的目录中执行，所以这里返回 startPath 即可
    return startPath
  } catch (error) {
    return startPath
  }
}

export const getRepoCwd = (): string | null => {
  const rootPath = getRootPath()
  if (!rootPath) {
    return null
  }
  const repo = findGitRepoDir(rootPath)
  return repo
}

