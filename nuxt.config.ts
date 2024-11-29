// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['@atoms-studio/nuxt-swiftsearch'],
  routeRules: {
    '/algolia-proxy/**': {
      proxy: {
        to: 'https://latency-dsn.algolia.net/**'
      },
      headers: {
        'Cache-Control': 'public,max-age=0,must-revalidate',
        'Netlify-CDN-Cache-Control': 'public,s-maxage=7200,durable,must-revalidate'
      }
    }
  },
  nitro: {
    experimental: {
      nodeFetchCompat: true
    }
  }
})
