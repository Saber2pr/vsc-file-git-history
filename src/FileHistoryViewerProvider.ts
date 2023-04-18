import { getRootPath } from './utils/getRootPath'
import { parse } from 'path'
import * as vscode from 'vscode'
import { encodeDiffDocUri, getPathFromStr } from './utils/encodeDiffDocUri'
import { getArray } from './utils/getArray'
import {
  Commit,
  CommitType,
  getFileCommits,
  getFileCommitType,
} from './utils/git'
import moment from 'moment'

export class FileHistoryViewerProvider
  implements vscode.TreeDataProvider<NodeItem>
{
  private textEditor?: vscode.TextEditor
  constructor() {
    this.textEditor = vscode.window.activeTextEditor
  }

  getCurrentFilePath() {
    if (this.textEditor) {
      const document = this.textEditor.document
      return document?.fileName
    }
  }

  async getChildren(node?: NodeItem): Promise<NodeItem[]> {
    if (this.textEditor) {
      const file = this.getCurrentFilePath()
      const commits = await getFileCommits(file)
      return getArray(commits).map(
        commit =>
          new NodeItem(file, commit, vscode.TreeItemCollapsibleState.None)
      )
    } else {
      return []
    }
  }

  async getTreeItem(node: NodeItem): Promise<vscode.TreeItem> {
    const filePathAbs = this.getCurrentFilePath()
    const repo = getRootPath()
    const filePath = filePathAbs.replace(repo, '').replace(/^(\\)|(\/)/, '')

    const nodeCommit = node.commit
    const commit = nodeCommit.commit

    const isFirstCommit = nodeCommit.isFirstCommit

    let commitType: CommitType = 'update'
    if (isFirstCommit) {
      commitType = 'new'
    } else {
      commitType = await getFileCommitType(filePathAbs, commit)
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

  changeEditor = (textEditor?: vscode.TextEditor) => {
    if (textEditor) {
      const fileName = textEditor.document?.fileName

      // if is diff, skip reset
      if (
        fileName &&
        (fileName.startsWith('\\file') || fileName.startsWith('/file'))
      ) {
        return
      }
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
      .TreeItemCollapsibleState.Collapsed
  ) {
    let title = `[${moment(new Date(commit.date)).format(
      'YYYY-MM-DD HH:mm:ss'
    )}] ${commit.title}`
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
    if(commit.authorName) {
      title += ` - @${commit.authorName}`
    }
    super(title, collapsibleState)
  }
}
