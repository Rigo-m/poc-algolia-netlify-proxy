import { joinURL, stringifyQuery } from 'ufo'
import { createStorage } from 'unstorage'

const storage = createStorage()

async function readableStreamToString(readableStream: any) {
  const reader = readableStream.getReader();
  const chunks = [];
  let totalLength = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    totalLength += value.byteLength;
  }

  const combinedArray = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    combinedArray.set(chunk, offset);
    offset += chunk.byteLength;
  }

  const decoder = new TextDecoder();
  return decoder.decode(combinedArray);
}

function mergeHeaders(
  defaults: HeadersInit,
  ...inputs: (HeadersInit | undefined)[]
) {
  const _inputs = inputs.filter(Boolean) as HeadersInit[];
  if (_inputs.length === 0) {
    return defaults;
  }
  const merged = new Headers(defaults);
  for (const input of _inputs) {
    for (const [key, value] of Object.entries(input!)) {
      if (value !== undefined) {
        merged.set(key, value);
      }
    }
  }
  return merged;
}


async function customProxy(event, target, opts) {
  const body = await readRawBody(event, false).catch(() => undefined)
  console.log("req body", body)
  const method = event.method
  const headers = getProxyRequestHeaders(event)
  delete headers['content-length']

  return sendProxy(event, target, {
    ...opts,
    fetchOptions: {
      method,
      body,
      ...opts.fetchOptions,
      headers: headers,
    },
  });
}
export default defineEventHandler(async (event) => {
  // proxying to algolia
  const slug = getRouterParam(event, 'slug')
  const query = stringifyQuery(getQuery(event))
  // Caching logic

  // if (await storage.hasItem(stringifiedBody)) {
  //   console.log('reading from cache')
  //   return await storage.getItem(stringifiedBody)
  // }

  console.log(storage.getKeys(), 'keys')

  // end of cachign logic
  const proxyTarget = joinURL('https://latency-dsn.algolia.net', slug!) + `?${query}`
  console.log('proxy target', proxyTarget)
  let responseString
  try {
    await customProxy(event, proxyTarget, {
      async onResponse(evt, response) {
        const resp = await readableStreamToString(response.body)

        // await storage.setItem(stringifiedBody, resp).catch(e => {
        //   console.error(e, 'storage error')
        // })
        responseString = resp
      },
      headers: {
      }
    })
    console.log({ responseString })

    return responseString
  } catch (e: any) {
    console.error(e, 'errored here')
    // TODO: handle locking mechanism
    console.log({ responseString })

    return responseString
  }
})
