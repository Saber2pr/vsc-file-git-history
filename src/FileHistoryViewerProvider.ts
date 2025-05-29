import { getRootPath } from './utils/getRootPath'
import { join, parse } from 'path'
import * as vscode from 'vscode'
import { encodeDiffDocUri, getPathFromStr } from './utils/encodeDiffDocUri'
import { getArray } from './utils/getArray'
import {
  Commit,
  CommitType,
  findGitRepoDir,
  getFileCommits,
  getFileCommitType,
  getRepoCwd,
} from './utils/git'
import moment from 'moment'

export class FileHistoryViewerProvider
  implements vscode.TreeDataProvider<NodeItem>
{
  private textEditor?: vscode.TextEditor
  constructor() {
    this.textEditor = vscode.window.activeTextEditor
  }

  parseDocPath(document: vscode.TextDocument) {
    const query = document?.uri?.query
    if (query) {
      const str = Buffer.from(query, 'base64').toString('utf8')
      let queryObj = {} as {
        filePath: string
        commit: string
        repo: string
        exists: boolean
      }
      try {
        queryObj = JSON.parse(str)
      } catch (error) {
        console.log('error', error)
      }

      if (queryObj?.filePath) {
        return queryObj?.filePath
      }
    }
    return document?.fileName
  }

  getCurrentFilePath() {
    if (this.textEditor) {
      const document = this.textEditor.document
      return this.parseDocPath(document)
    }
  }

  showTime = true
  showAuth = true

  async getChildren(node?: NodeItem): Promise<NodeItem[]> {
    if (this.textEditor) {
      const file = this.getCurrentFilePath()
      const commits = await this.getCommitList(file)
      return getArray(commits).map(
        commit =>
          new NodeItem(
            file,
            commit,
            vscode.TreeItemCollapsibleState.None,
            this.showTime,
            this.showAuth
          )
      )
    } else {
      return []
    }
  }

  async getCommitList(fileName: string) {
    // if is diff, skip reset
    const isDiff =
      fileName &&
      (fileName.startsWith('\\file') || fileName.startsWith('/file'))

    if (isDiff) {
      return []
    }

    const repo = getRepoCwd()

    const commits = await getFileCommits(repo, fileName)
    return commits
  }

  async getTreeItem(node: NodeItem): Promise<vscode.TreeItem> {
    const filePathAbs = this.getCurrentFilePath()
    const rootPath = getRootPath()
    if (!rootPath) {
      return
    }
    const repo = findGitRepoDir(rootPath)
    const filePath = filePathAbs.replace(repo, '').replace(/^((\\)|(\/))/, '')

    const nodeCommit = node.commit
    const commit = nodeCommit.commit

    const isFirstCommit = nodeCommit.isFirstCommit

    let commitType: CommitType = 'update'
    if (isFirstCommit) {
      commitType = 'new'
    } else {
      commitType = await getFileCommitType(repo, filePathAbs, commit)
    }

    const isUpdateCommit = commitType === 'update'
    const isDeleteCommit = commitType === 'deleted'
    const isAddCommit = commitType === 'new'

    const shortCommit = commit.slice(0, 7)

    const result = parse(filePath)
    const fileName = `${result.name}${result.ext}`

    const title = `${fileName}(${
      isUpdateCommit
        ? `${shortCommit}^ ~ ${shortCommit}`
        : isAddCommit
        ? `Added in ${shortCommit}`
        : isDeleteCommit
        ? `Deleted in ${shortCommit}`
        : ''
    })`

    node.command = {
      command: 'vscode.diff',
      title: 'check file history',
      arguments: [
        encodeDiffDocUri(
          getPathFromStr(repo),
          filePath,
          `${commit}^`,
          isUpdateCommit || isDeleteCommit
        ),
        encodeDiffDocUri(
          getPathFromStr(repo),
          filePath,
          `${commit}`,
          !isDeleteCommit || isAddCommit
        ),
        title,
        {
          preview: true,
          viewColumn: vscode.ViewColumn.One,
        },
      ],
    }

    return node
  }

  private _onDidChangeTreeData: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>()

  readonly onDidChangeTreeData: vscode.Event<void> =
    this._onDidChangeTreeData.event

  changeEditor = (
    textEditor?: vscode.TextEditor,
    {
      showTime = this.showTime,
      showAuth = this.showAuth,
    }: { showTime?: boolean; showAuth?: boolean } = {
      showTime: this.showTime,
      showAuth: this.showAuth,
    }
  ) => {
    if (textEditor) {
      const fileName = this.parseDocPath(textEditor.document)
      this.showTime = showTime
      this.showAuth = showAuth

      // if is diff, skip reset
      const isDiff =
        fileName &&
        (fileName.startsWith('\\file') || fileName.startsWith('/file'))

      if (isDiff) {
        return
      }

      this.textEditor = textEditor
      this._onDidChangeTreeData.fire()
    }
  }

  reloadEditor = (
    textEditor?: vscode.TextEditor,
    {
      showTime = this.showTime,
      showAuth = this.showAuth,
    }: { showTime?: boolean; showAuth?: boolean } = {
      showTime: this.showTime,
      showAuth: this.showAuth,
    }
  ) => {
    if (textEditor) {
      this.showTime = showTime
      this.showAuth = showAuth
      this.textEditor = textEditor
      this._onDidChangeTreeData.fire()
    }
  }
}

export class NodeItem extends vscode.TreeItem {
  constructor(
    public readonly originFile: string,
    public readonly commit: Commit,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode
      .TreeItemCollapsibleState.Collapsed,
    showTime: boolean,
    showAuth: boolean
  ) {
    let title = `${commit.title}`

    if (showTime) {
      title = `[${moment(new Date(commit.date)).format(
        'YYYY-MM-DD HH:mm:ss'
      )}] ${commit.title}`
    } else {
      title = `${commit.title}`
    }

    const changes = []
    if (commit.insertions > 0) {
      changes.push(`+${commit.insertions}`)
    }
    if (commit.deletions > 0) {
      changes.push(`-${commit.deletions}`)
    }
    if (changes.length > 0) {
      title += ` ${changes.join('|')}`
    }

    if (showAuth) {
      title = `@${commit.authorName} ${title}`
    }

    super(title, collapsibleState)
  }
}
