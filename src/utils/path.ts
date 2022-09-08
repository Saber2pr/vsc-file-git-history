import { isAbsolute, join } from 'path';

export const safe_join = (basePath: string, path: string) => {
  return isAbsolute(path) ? path : join(basePath, path)
}