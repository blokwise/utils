import type { Log } from './useLogger'

export interface JobLogger {
  start: Log
  success: Log
}

export interface ITask<TReturnType> {
  start: <TData, TOptions>(data: TData, options?: TOptions, logger?: JobLogger) => TReturnType
}

export interface SyncTask<TReturnType> extends ITask<TReturnType> {}

export interface AsyncTask<TReturnType> extends ITask<Promise<TReturnType>> {}

export type Task<TReturnType> = AsyncTask<TReturnType> | SyncTask<TReturnType>

export interface Job<TReturnType> extends AsyncTask<TReturnType> {
  add: <T extends TReturnType>(...tasks: Task<T>[]) => void
}

export function isAsyncTask<TReturnType>(task: Task<TReturnType>): task is AsyncTask<TReturnType> {
  // eslint-disable-next-line ts/no-unsafe-member-access
  return 'start' in task && task.start instanceof Function && (task.start as any)[Symbol.toStringTag] === 'AsyncFunction'
}

export function isSyncTask<TReturnType>(task: Task<TReturnType>): task is SyncTask<TReturnType> {
  // eslint-disable-next-line ts/no-unsafe-member-access
  return 'start' in task && task.start instanceof Function && (task.start as any)[Symbol.toStringTag] !== 'AsyncFunction'
}

export function useJob<TReturnType>(): Job<TReturnType> {
  const queue: Task<TReturnType>[] = [] as Task<TReturnType>[]

  const add = <T extends TReturnType>(...tasks: Task<T>[]) => {
    queue.push(...tasks)
  }

  const start = async <TData, TOptions>(data: TData, options?: TOptions, logger?: JobLogger): Promise<TReturnType> => {
    let result: TData | Awaited<TReturnType> | undefined = data

    // run all tasks sequentially
    // sync and async ones
    for (const task of queue) {
      if (isAsyncTask(task))
        result = await task.start(result, options, logger)
      else
        result = await Promise.resolve(task.start(result, options, logger))
    }

    return result as TReturnType
  }

  return {
    add,
    start,
  }
}
