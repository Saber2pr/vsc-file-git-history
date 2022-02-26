import { Uri } from 'vscode'

const FS_REGEX = /\\/g

export function getPathFromStr(str: string) {
  return str.replace(FS_REGEX, '/')
}

export function encodeDiffDocUri(
  repo: string,
  filePath: string,
  commit: string,
  exists: boolean
): Uri {
  const data = {
    filePath: getPathFromStr(filePath),
    commit: commit,
    repo: repo,
    exists: exists,
  }

  let extension: string
  const extIndex = data.filePath.indexOf(
    '.',
    data.filePath.lastIndexOf('/') + 1
  )
  extension = extIndex > -1 ? data.filePath.substring(extIndex) : ''

  return Uri.file('file' + extension).with({
    scheme: 'git-graph',
    query: Buffer.from(JSON.stringify(data)).toString('base64'),
  })
}
