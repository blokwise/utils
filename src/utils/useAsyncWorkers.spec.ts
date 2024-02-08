import { describe, expect, it } from 'vitest'
import { isDef, isNull } from '@antfu/utils'
import type { JSONObject } from './useJsonTraverser'
import { useJob } from './useJob'
import type { AsyncTask, JobLogger } from './useJob'
import { useAsyncWorkers } from './useAsyncWorkers'

describe('useAsyncWorkers', () => {
  describe('work', async () => {
    it('should queue items with workers and run concurrently and sequentially', async () => {
      const createData = (count: number): JSONObject[] => {
        const item: JSONObject = {
          foo: 'bar',
          arr: [1, 2, 3],
          subo: {
            foo2: 'bar2',
          },
        }

        return Array(count).fill(item).map((item, index) => ({
          index,
          ...item,
        }) as JSONObject)
      }

      const options = {
        something: true,
      }

      const job = useJob<JSONObject>()

      const createTasks = (count: number) => {
        // some helpers for the actual tasks
        const sleep = async (t: number) => new Promise(rs => setTimeout(rs, t))
        const runHeavyCalculation = async () => {
          const max = 300
          const duration = Math.floor(Math.random() * max)
          await sleep(duration)
        }
        const increment = (n: number | undefined) => isDef(n) && !isNull(n) ? +n + 1 : 1
        const incrementTaskCount = (item: JSONObject) => item.processed = increment(item.processed as number | undefined)
        const addTask = (item: JSONObject, name: string) => {
          item.tasks = [...(item.tasks as string[] | undefined ?? []), name]
        }

        return Array(count).fill(0).map((_: number, index: number) => ({
          start: async (item: JSONObject, options?: JSONObject, logger?: JobLogger) => {
            if (!item)
              return item

            logger?.start('Starting heavy calculation for data with index', item.index)

            // excessive heavy calculation
            await runHeavyCalculation()

            // some modifications
            incrementTaskCount(item)
            addTask(item, `task.${index}`)

            logger?.success('Heavy calculation finished')

            return item
          },
        } as AsyncTask<JSONObject>))
      }

      // add tasks
      job.add(...createTasks(20))

      // start async workers for folders
      const workers = useAsyncWorkers<JSONObject, JSONObject>(createData(50), job, options, {
        concurrency: 10,
        interval: 800,
      })

      for await (const [result] of workers.start())
        expect(result.processed).toEqual(20)
    }, {
      timeout: 30000,
    })
  })
})
