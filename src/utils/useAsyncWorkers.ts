import { useLogger } from './useLogger'
import type { LoggerMessage } from './useLogger'
import type { AsyncTask, Job, JobLogger } from './useJob'

export type AsyncWorkerJob<TReturnType> = ((Omit<Job<TReturnType>, 'start'> | Omit<AsyncTask<TReturnType>, 'start'>) & {
  start: () => ReturnType<Job<TReturnType>['start']>
})

export interface AsyncWorker<TData, TReturnType> {
  index: number
  items: TData[]
  jobs: AsyncWorkerJob<TReturnType>[]
}

export interface AsyncWorkerOptions {
  concurrency: number
  interval: number
}

export function useAsyncWorkers<TData, TOptions, TReturnType = TData>(
  items: TData[],
  job: Job<TReturnType> | AsyncTask<TReturnType>,
  options?: TOptions,
  {
    concurrency,
    interval,
  }: AsyncWorkerOptions = {
    interval: 1000,
    concurrency: 1,
  },
) {
  const logger = useLogger()

  const queue = {
    items: [] as AsyncWorker<TData, TReturnType>[],

    add: (...items: AsyncWorker<TData, TReturnType>[]) => {
      queue.items.push(...items)
    },

    isEmpty: () => queue.items.length === 0,

    wait: (t: number) => new Promise(rs => setTimeout(rs, t)),

    start: async () => {
      const worker = queue.items.shift()

      if (!worker || queue.items.length === 0)
        return

      logger.start(`Async worker # ${worker.index} started`)

      const result = await Promise.allSettled(
        worker.jobs
          .map((_job: AsyncWorkerJob<TReturnType>) => {
            return _job.start()
          }),
      )

      logger.success(`Async worker # ${worker.index} finished`)

      return result
    },
  }

  const worker = {
    create: (index: number, items: TData[], _job: typeof job) => {
      return {
        index,
        items,
        jobs: items.map((item: TData, index: number) => {
          const _logger: JobLogger = {
            start: (...msg: LoggerMessage) => logger.log(`Job # ${index} started:`, ...msg),
            success: (...msg: LoggerMessage) => logger.success(`Job # ${index} finished:`, ...msg),
          }

          return {
            ..._job,
            start: () => _job.start(item, options, _logger),
          }
        }),
      }
    },
  }

  const _init = () => {
    const iterations = Math.floor(items.length / concurrency) + 1

    for (let i = 0; i < iterations; i++) {
      const iterableItems = [...items].slice(i * concurrency, (i + 1) * concurrency)
      queue.add(worker.create(i, iterableItems, job))
    }
  }

  async function * start(): AsyncGenerator<[TReturnType]> {
    const results = [] as PromiseSettledResult<Awaited<TReturnType>>[]

    while (!queue.isEmpty()) {
      const workerResults = await queue.start()

      if (workerResults)
        results.push(...workerResults)

      await queue.wait(interval)
    }

    for (const result of results)
      yield [(result as PromiseFulfilledResult<TReturnType>).value]
  }

  _init()

  return {
    start,
  }
}
