import { createConsola } from 'consola'
import type { ConsolaInstance } from 'consola'
import defu from 'defu'
import type { JSONArray, JSONObject } from '.'

export type LoggerMessage = (JSONObject | JSONArray | Error | string | number | boolean | null | undefined)[]
export type Log = (...msg: LoggerMessage) => void

/**
 * A universal logger instance.
 */
export function useLogger(level: 'auto' | number = 'auto', withTag: string | boolean = true, options?: {
  useNative?: boolean
}): ConsolaInstance | Console {
  const defaultTag = '@blokwise/utils'

  options = defu({
    useNative: options?.useNative ?? false,
  }, {
    useNative: false,
  })

  // eslint-disable-next-line node/prefer-global/process
  const isProduction = process.env.NODE_ENV === 'production'

  // if level is auto, set it to 1 in production and 5 in development
  // otherwise use the provided level
  level = typeof level === 'string' && level === 'auto' ? (isProduction ? 1 : 5) : level

  // use native console in test environments
  // eslint-disable-next-line node/prefer-global/process
  if (process.env.NODE_ENV === 'test')
    options.useNative = true

  // create and instance
  const logger = createConsola({
    level,
  })

  // override the log method to use console.log if useNative flag is set
  if (options.useNative) {
    return Object.fromEntries(
      Object.entries(logger)
        .map(([name, _method]: [string, () => void]) => [
          name,
          // eslint-disable-next-line no-console
          (...msg: LoggerMessage) => console.log(...msg),
        ]),
    ) as Partial<ConsolaInstance> as ConsolaInstance
  }

  // return the logger instance if no tag is provided or useNative flag is set
  if (!withTag || options.useNative)
    return logger

  // return logger instance with tag
  return logger.withTag(typeof withTag === 'string' ? withTag : defaultTag)
}
