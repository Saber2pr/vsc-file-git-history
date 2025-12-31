// 直接使用原始文件，因为它不依赖 Node.js API
export const getArray = <T>(array: T[]) => (Array.isArray(array) ? array : [])

