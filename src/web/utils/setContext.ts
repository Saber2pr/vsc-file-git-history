/**
 * Web Extension 版本的 setContext
 */
import { commands } from 'vscode'
import { RCManager } from '../store/rc'
import {
  CONFIG_KEY_SHOWAUTH,
  CONFIG_KEY_SHOWTIME,
  CONFIG_PATH,
} from '../../constants'

const rc = new RCManager(CONFIG_PATH)

export const setContextOnly = async (key: string, value: string) => {
  try {
    await commands.executeCommand('setContext', key, value)
  } catch (error) {
    console.log(error)
  }
}

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
    let value = await rc.get(key)
    if (!value && key === CONFIG_KEY_SHOWTIME) {
      value = 'off'
    }
    if (!value && key === CONFIG_KEY_SHOWAUTH) {
      value = 'off'
    }
    await commands.executeCommand('setContext', key, value)
    return value
  } catch (error) {
    console.log(error)
    return 'no support'
  }
}

export const getContexts = async (...keys: string[]) => {
  try {
    return await Promise.all(keys.map(getContext))
  } catch (error) {
    console.log(error)
    return keys.map(() => 'no support')
  }
}

