// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: true,
  modules: ['@nuxt/ui', '@nuxtjs/tailwindcss'],
  css: ['~/assets/css/tailwind.css'],
  routeRules: {
    '/': { prerender: true }
  },
  tailwindcss: {
    viewer: false
  },
  ui: {
    icons: ['heroicons', 'material-symbols']
  },
  typescript: {
    typeCheck: false
  }
})
