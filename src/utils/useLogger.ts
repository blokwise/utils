import { consola } from 'consola'
import defu from 'defu'
import { isNumber, isString } from '@antfu/utils'
import { env } from 'std-env'
import type { JSONArray, JSONObject } from '.'

export type LoggerMessage = (JSONObject | JSONArray | Error | string | number | boolean | null | undefined)[]
export type Log = (...msg: LoggerMessage) => void

/**
 * The log levels to use in different environments when `level` is set to `auto`.
 */
export interface AutoLogLevels {
  production: number
  development: number
  test: number
}

export interface LoggerOptions {
  /**
   * The log level to use.
   *
   * If set to `auto`, the level will be set to `1` in production and `5` in development and test if not configured differently via `autoLevels`.
   *
   * @default
   * ```typescript
   * const level = 'auto'
   * ```
   */
  level: 'auto' | number
  /**
   * Whether to wrap all console methods calls and stdout/stderr outputs.
   *
   * @default true
   */
  wrapAll: boolean
  /**
   * Whether to set a tag for the logger instance or not.
   *
   * If set to `true`, the default tag is `@blokwise/utils`.
   *
   * @default true
   */
  withTag: string | boolean
  /**
   * The log levels to use in different environments when `level` is set to `auto`.
   *
   * @default
   * ```typescript
   * const autoLevels: AutoLogLevels = {
   *   production: 1,
   *   development: 5,
   *   test: 5
   * }
   * ```
   */
  autoLevels: AutoLogLevels
}

/**
 * Provides a logger instance.
 *
 * Configures the logger instance with the provided options.
 *
 * If no tag is provided, the default tag is `@blokwise/utils`.
 * If no level is provided, the default level is `auto`.
 * If level is `auto`, the level will be set to `1` in production and `5` in development and test if not configured differently via `autoLevels`.
 *
 * @param options The options to configure the logger instance.
 * @returns a logger instance.
 */
export function useLogger(options?: Partial<LoggerOptions>): ReturnType<typeof consola.withTag> {
  const defaultTag = '@blokwise/utils'

  // merge defaults
  options = defu<Partial<LoggerOptions>, LoggerOptions[]>(options, {
    level: 'auto',
    wrapAll: true,
    withTag: true,
    autoLevels: {
      production: 1,
      development: 5,
      test: 5,
    },
  })

  // type guards for auto level
  const isAutoLevel = (level: 'auto' | number | undefined): level is 'auto' => level === 'auto'
  const hasEnvAutoLevel = (env: string | undefined): env is 'production' | 'development' | 'test' => isString(env) && ['production', 'development', 'test'].includes(env)

  // get auto level for current environment
  const autoLevel: number | undefined = hasEnvAutoLevel(env.NODE_ENV) ? options?.autoLevels?.[env.NODE_ENV] : undefined

  // if level is auto, set it to 0 in production and 5 in development and test
  if (isAutoLevel(options.level) && autoLevel)
    consola.level = autoLevel

  // otherwise use the provided level
  else if (isNumber(options.level))
    consola.level = options.level

  // wrap all console methods calls and stdout/stderr outputs if wrapAll is true
  if (options.wrapAll)
    consola.wrapAll()

  // return the logger instance if no tag should be set
  if (!options.withTag)
    return consola

  // return logger instance with tag
  return consola.withTag(isString(options.withTag) ? options.withTag : defaultTag)
}
