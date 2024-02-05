import { describe, expect, it } from 'vitest'
import { useJsonTraverser } from './useJsonTraverser'
import type { JSONObject, JSONValue } from './useJsonTraverser'

describe('useJsonTraverser', () => {
  describe('traverseAsync', async () => {
    it('should traverse the object and modify it', async () => {
    // the object
      const o: JSONObject = {
        foo: 'bar',
        arr: [1, 2, 3],
        subo: {
          foo2: 'bar2',
        },
      }

      const traverser = useJsonTraverser()

      const reviver = async (key: string, value: JSONValue, path: string[], parent: JSONValue) => {
        await new Promise(resolve => setTimeout(resolve, 250))
        // eslint-disable-next-line no-console
        console.log('traversing', key, value, path, parent)

        // replace all 1s with 100
        return value === 1 ? 100 : value
      }

      for await (const [key, value, path, parent] of traverser.traverseAsync(o, reviver)) {
        // eslint-disable-next-line no-console
        console.log('modified', key, value, path, parent)
      }

      expect(o).toEqual({
        foo: 'bar',
        arr: [100, 2, 3],
        subo: {
          foo2: 'bar2',
        },
      })
    })

    it('should traverse self-referencing object', async () => {
      // the object
      const o: JSONObject = {
        foo: 'bar',
        arr: [1, 2, 3],
        subo: {
          foo2: 'bar2',
        },
      }

      /// this self-referential property assignment is the only real logical difference
      // from the above original example which makes more naive traversals
      // non-terminating (i.e. it makes it infinite loop)
      o.o = o

      const traverser = useJsonTraverser()

      const reviver = async (key: string, value: JSONValue, path: string[], parent: JSONValue) => {
        await new Promise(resolve => setTimeout(resolve, 250))
        // eslint-disable-next-line no-console
        console.log('traversing', key, value, path, parent)

        // replace all 1s with 100
        return value === 1 ? 100 : value
      }

      for await (const [key, value, path, parent] of traverser.traverseAsync(o, reviver)) {
        // eslint-disable-next-line no-console
        console.log('modified', key, value, path, parent)
      }
    })
  })
})
