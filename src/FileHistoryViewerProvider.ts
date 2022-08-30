import { getRootPath } from './utils/getRootPath'
import { parse } from 'path'
import * as vscode from 'vscode'
import { encodeDiffDocUri, getPathFromStr } from './utils/encodeDiffDocUri'
import { getArray } from './utils/getArray'
import { Commit, getFileCommits } from './utils/git'

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
        commit => new NodeItem(commit, vscode.TreeItemCollapsibleState.None)
      )
    } else {
      return []
    }
  }

  async getTreeItem(node: NodeItem): Promise<vscode.TreeItem> {
    let filePath = this.getCurrentFilePath()
    const repo = getRootPath()
    filePath = filePath.replace(repo, '').replace(/^(\\)|(\/)/, '')

    const nodeCommit = node.commit
    const commit = nodeCommit.commit

    const isUpdateCommit = nodeCommit.insertions > 0 && nodeCommit.deletions > 0
    const isDeleteCommit = nodeCommit.deletions === nodeCommit.changes
    const isAddCommit = nodeCommit.insertions === nodeCommit.changes

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
    public readonly commit: Commit,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode
      .TreeItemCollapsibleState.Collapsed
  ) {
    let title = `${commit.commit.slice(0, 7)}: ${commit.title}`
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
    super(title, collapsibleState)
  }
}
