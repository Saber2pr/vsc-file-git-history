/**
 * Web Extension 版本的 process 工具函数
 */
export const process = {
  cwd: () => '/workspace',
  env: {} as Record<string, string>,
  platform: 'web' as 'darwin' | 'win32' | 'linux' | 'web',
}

