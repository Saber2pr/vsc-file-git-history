import vscode from 'vscode'
import { runCmdV2 } from './utils/shellV2'

interface DiffData {
  filePath: string
  commit: string
  repo: string
  exists: boolean
}

export class DiffContentProvider implements vscode.TextDocumentContentProvider {
  private _onDidChange = new vscode.EventEmitter<vscode.Uri>()
  public readonly onDidChange = this._onDidChange.event

  setContent(uri: vscode.Uri, content: string) {
    this._onDidChange.fire(uri) // 通知 VSCode 文档更新
  }

  async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
    try {
      // 解析URI中的参数
      const diffData = this.parseDiffUri(uri)
      if (!diffData) {
        return '// 无法解析diff参数'
      }

      // 生成diff内容
      const diffContent = await this.generateDiffContent(diffData)

      return diffContent
    } catch (error) {
      console.error('Error generating diff content:', error)
      return `// 生成diff内容时出错: ${error}`
    }
  }

  private parseDiffUri(uri: vscode.Uri): DiffData | null {
    try {
      // 从URI的query中解析base64编码的数据
      const query = uri.query
      if (!query) {
        return null
      }

      const decodedData = Buffer.from(query, 'base64').toString('utf-8')
      const data = JSON.parse(decodedData) as DiffData

      return data
    } catch (error) {
      console.error('Error parsing diff URI:', error)
      return null
    }
  }

  private async generateDiffContent(data: DiffData): Promise<string> {
    const { repo, filePath, commit, exists } = data

    if (!exists) {
      return ``
    }

    try {
      // 使用git命令获取文件内容
      const gitCommand = `git show ${commit}:${filePath}`
      const result = await runCmdV2(repo, gitCommand)

      if (result.code === 0) {
        return (
          result.output ||
          `// Unable to retrieve file content: ${filePath}@${commit}`
        )
      } else {
        return `// Failed to retrieve file content: ${result.error}`
      }
    } catch (error) {
      console.error('Error getting file content:', error)
      return `// Failed to retrieve file content: ${error}`
    }
  }
}
