import fs from 'fs-extra'
import { homedir } from 'os'
import { dirname, join, resolve } from 'path'

const readFile = fs.readFile
const writeFile = fs.writeFile
const mkdir = fs.mkdir

const mkDirPath = async (path: string): Promise<void> => {
  if (fs.existsSync(path)) {
    return
  } else {
    await mkDirPath(dirname(path))
    await mkdir(path)
  }
}

const mkDirPathSync = (path: string) => {
  if (fs.existsSync(path)) {
    return
  } else {
    mkDirPathSync(dirname(path))
    fs.mkdirSync(path)
  }
}

export const isJSON = (str: string) => {
  if (typeof str == 'string') {
    try {
      const obj = JSON.parse(str)
      if (typeof obj === 'object' && obj) {
        return true
      } else {
        return false
      }
    } catch (e) {
      return false
    }
  } else {
    return false
  }
}

export const SafeJSON: Pick<typeof JSON, 'parse' | 'stringify'> = {
  parse(text, ...args) {
    if (isJSON(text)) {
      return JSON.parse(text, ...args)
    } else {
      return {}
    }
  },
  stringify(obj: object, ...args: any[]) {
    if (obj) {
      return JSON.stringify(obj, ...args)
    } else {
      return ''
    }
  },
}

const prepareSync = (preparePath: string) => {
  if (fs.existsSync(preparePath)) {
  } else {
    mkDirPathSync(dirname(resolve(preparePath)))
    fs.writeFileSync(preparePath, SafeJSON.stringify({}))
  }
}
const prepareAsync = async (preparePath: string) => {
  if (fs.existsSync(preparePath)) {
  } else {
    await mkDirPath(dirname(resolve(preparePath)))
    await writeFile(preparePath, SafeJSON.stringify({}))
  }
}

export class RCManager {
  private path: string
  constructor(configPath: string) {
    this.path = join(homedir(), configPath)
  }

  async get(key?: string) {
    await prepareAsync(this.path)

    const buf = await readFile(this.path, 'utf8')
    const data = SafeJSON.parse(buf)
    return key ? data[key] : data
  }
  getSync(key?: string) {
    prepareSync(this.path)

    const buf = fs.readFileSync(this.path, 'utf8')
    const data = SafeJSON.parse(buf)
    return key ? data[key] : data
  }

  async mergeSet(value: any) {
    await prepareAsync(this.path)

    const data = await this.get()
    const newData = {
      ...(data || {}),
      ...(value || {}),
    }
    await writeFile(this.path, SafeJSON.stringify(newData, null, 2))
    return newData
  }

  async set(key: string, value: any) {
    await prepareAsync(this.path)

    const data = await this.get()
    data[key] = value
    await writeFile(this.path, SafeJSON.stringify(data, null, 2))
  }
  setSync(key: string, value: any) {
    prepareSync(this.path)

    const data = this.getSync()
    data[key] = value
    fs.writeFileSync(this.path, SafeJSON.stringify(data, null, 2))
  }

  async delete(key: string) {
    await prepareAsync(this.path)

    const data = await this.get()

    delete data[key]
    await writeFile(this.path, SafeJSON.stringify(data, null, 2))
  }
  deleteSync(key: string) {
    prepareSync(this.path)

    const data = this.getSync()
    delete data[key]
    fs.writeFileSync(this.path, SafeJSON.stringify(data, null, 2))
  }
}
