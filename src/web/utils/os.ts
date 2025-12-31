/**
 * Web Extension 版本的 os 工具函数
 */
export function homedir(): string {
  // 在 web 环境中，使用 workspace 文件夹作为 home 目录
  return '/workspace'
}

