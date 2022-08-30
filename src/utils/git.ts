import { resolve } from 'path'
import { execShell } from './execShell'

// git log --stat --pretty=oneline -- <file>
/**

bc4297314d50bb1d202379bf6413dd90bee03ccf chore: update
 ReadMe.todo | 78 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++-----------
 1 file changed, 67 insertions(+), 11 deletions(-)
4617d7572221fd784bb60911e0207c257c568e34 Merge branch 'main' of https://github.com/Saber2pr/todo
ca81748dfe3cad2a91aff46aff8c3c1677d3f93e chore: update
 ReadMe.todo | 4 ++--
 1 file changed, 2 insertions(+), 2 deletions(-)

 */
export const getFileCommits = async (path: string): Promise<Commit[]> => {
  const str = await execShell('git', [
    'log',
    '--stat',
    '--pretty=oneline',
    '--',
    resolve(path),
  ])
  if (str) {
    return parseLog(str)
  }
}

export const checkoutCommit = async (commit: string) => {
  return await execShell('git', ['checkout', commit])
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
}

export const parseLog = (log: string) => {
  const lines = log.split('\n')
  const nodes: Commit[] = []
  for (const line of lines) {
    if (!line.trim()) {
      continue
    }
    if (/^ /.test(line)) {
      const item = nodes.pop()
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
      nodes.push(item)
    } else {
      const idx = line.indexOf(' ')
      const title = line.slice(idx + 1)
      nodes.push({
        title,
        commit: line.slice(0, idx),
        changeFiles: null,
        changes: null,
        deletions: null,
        insertions: null,
        file: null,
      })
    }
  }
  const first = nodes.pop()
  if (first) {
    first.isFirstCommit = true
    nodes.push(first)
  }
  return nodes
}
