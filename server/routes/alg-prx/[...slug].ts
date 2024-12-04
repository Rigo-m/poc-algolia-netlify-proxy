import { joinURL, stringifyQuery } from 'ufo'
import { createStorage } from 'unstorage'

// TODO: change with appropriate one
const storage = createStorage()

// convert response stream to string
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

// custom proxy based on h3 v1 proxy, because it breaks on netlify
// this fixes UNDICI content length mismatch error
// and also handles caching logic
// returns a string
async function customProxy(event: any, target: string, opts: any) {
  // get raw body to give to proxy
  const body = await readRawBody(event, false).catch(() => undefined)
  // get stringified body to act as cache key
  const strbody = JSON.stringify(await readBody(event))
  const method = event.method
  const headers = getProxyRequestHeaders(event)
  // delete problematic header
  delete headers['content-length']
  // if stringified body exists as key, return from cache
  if (await storage.hasItem(strbody)) {
    console.log('handled by cache')
    return await storage.getItem(strbody)
  }
  let toStringRet
  await sendProxy(event, target, {
    ...opts,
    async onResponse(evt: any, response: any) {
      const resp = await readableStreamToString(response.body)
      toStringRet = resp
    },
    fetchOptions: {
      method,
      body,
      ...opts.fetchOptions,
      headers: headers,
    },
  }).catch(() => { });

  await storage.setItem(strbody, toStringRet!).catch(e => {
    console.error(e, 'storage error')
  })
  return toStringRet
}
export default defineEventHandler(async (event) => {
  // proxying to algolia
  const slug = getRouterParam(event, 'slug')
  const query = stringifyQuery(getQuery(event))
  const proxyTarget = joinURL('https://latency-dsn.algolia.net', slug!) + `?${query}`
  return await customProxy(event, proxyTarget, {})
})
