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
      cache: {
        name: 'test',
        base: 'algolia',
        maxAge: 7200,
      }
    }
  },
  nitro: {
    storage: {
      cache: {
        driver: "memory"
      }
    },
    experimental: {
      nodeFetchCompat: true
    }
  }
})
