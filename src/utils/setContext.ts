import { commands } from 'vscode'
import { RCManager } from '../store/rc'
import { CONFIG_PATH } from '../constants'

const rc = new RCManager(CONFIG_PATH)

export const setContext = async (key: string, value: string) => {
  try {
    await commands.executeCommand('setContext', key, value)
    await rc.set(key, value)
  } catch (error) {
    console.log(error)
  }
}

export const getContext = async (key: string) => {
  try {
    const value = await rc.get(key)
    await commands.executeCommand('setContext', key, value)
    return value
  } catch (error) {
    console.log(error)
    return 'no support'
  }
}
