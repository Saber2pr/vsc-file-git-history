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
    filePath = filePath.replace(repo, '').replace(/^\\/, '')

    const commit = node.commit.commit
    const commitIndex = node.commit.index

    const isUpdateCommit = commitIndex > 0
    const shortCommit = commit.slice(0, 7)

    const result = parse(filePath)
    const fileName = `${result.name}${result.ext}`

    const title = `${fileName}(${
      isUpdateCommit
        ? `${shortCommit}^ ~ ${shortCommit}`
        : `Added in ${shortCommit}`
    })`

    node.command = {
      command: 'vscode.diff',
      title: 'check file history',
      arguments: [
        encodeDiffDocUri(
          getPathFromStr(repo),
          filePath,
          `${commit}^`,
          isUpdateCommit
        ),
        encodeDiffDocUri(getPathFromStr(repo), filePath, `${commit}`, true),
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
      if (fileName && fileName.startsWith('\\file')) {
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
    super(`${commit.commit.slice(0, 7)}: ${commit.title}`, collapsibleState)
  }
}
