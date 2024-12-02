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

export default defineEventHandler(async (event) => {
  console.log(process.version, 'node version')
  // proxying to algolia
  const slug = getRouterParam(event, 'slug')
  const query = stringifyQuery(getQuery(event))
  // Caching logic
  const stringifiedBody = JSON.stringify(await readBody(event))

  if (await storage.hasItem(stringifiedBody)) {
    console.log('reading from cache')
    return await storage.getItem(stringifiedBody)
  }

  // end of cachign logic
  const proxyTarget = joinURL('https://latency-dsn.algolia.net', slug!) + `?${query}`
  console.log('proxy target', proxyTarget)
  let responseString
  try {
    const resp = await proxyRequest(event, proxyTarget, {
      async onResponse(evt, response) {
        const resp = await readableStreamToString(response.body)

        await storage.setItem(stringifiedBody, resp).catch(e => {
          console.error(e, 'storage error')
        })
        responseString = resp
      }
    })
    return responseString
  } catch (e: any) {
    console.error(e, 'errored here')
    // TODO: handle locking mechanism
    return responseString
  }
})
