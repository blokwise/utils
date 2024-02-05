export type JSONPrimitive = string | number | boolean | null
export interface JSONObject { [member: string]: JSONValue }
export interface JSONArray extends Array<JSONValue> {}
export type JSONValue = JSONPrimitive | JSONObject | JSONArray

export function useJsonTraverser() {
  function* traverse<T extends JSONObject>(o: T, reviver?: (key: string, value: JSONValue, path: string[], parent: JSONValue) => JSONValue) {
    const memory = new Set()

    function* innerTraversal(o: JSONObject, path: string[] = []): Generator<[string, JSONValue, string[], JSONValue]> {
      if (memory.has(o)) {
        // we've seen this object before don't iterate it
        return
      }
      // add the new object to our memory.
      memory.add(o)

      for (const i of Object.keys(o)) {
        const itemPath = path.concat(i)

        // use the reviver to modify the value
        reviver && (o[i] = reviver(i, o[i], itemPath, o))

        yield [i, o[i], itemPath, o]

        if (o[i] !== null && typeof (o[i]) == 'object') {
          // going one step down in the object tree
          yield * innerTraversal(o[i] as JSONObject, itemPath)
        }
      }
    }

    yield * innerTraversal(o)
  }

  async function* traverseAsync<T extends JSONObject>(o: T, reviver?: (key: string, value: JSONValue, path: string[], parent: JSONValue) => Promise<JSONValue>) {
    const memory = new Set()

    async function* innerTraversal(o: JSONObject, path: string[] = []): AsyncGenerator<[string, JSONValue, string[], JSONValue]> {
      if (memory.has(o)) {
        // we've seen this object before don't iterate it
        return
      }
      // add the new object to our memory.
      memory.add(o)

      for (const i of Object.keys(o)) {
        const itemPath = path.concat(i)

        // use the reviver to modify the value
        reviver && (o[i] = await reviver(i, o[i], itemPath, o))

        yield [i, o[i], itemPath, o]

        if (o[i] !== null && typeof (o[i]) == 'object') {
          // going one step down in the object tree
          yield * innerTraversal(o[i] as JSONObject, itemPath)
        }
      }
    }

    yield * innerTraversal(o)
  }

  return {
    traverse,
    traverseAsync,
  }
}
