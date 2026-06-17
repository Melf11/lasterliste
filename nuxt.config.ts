// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: false },
  app: {
    head: {
      title: 'Lasterliste – Leergewichte',
      htmlAttrs: { lang: 'de' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'Filterbare Liste von LKW-Leergewichten (Allrad-LKW, Expeditionsmobile, Feuerwehr- und Militärfahrzeuge).'
        }
      ]
    }
  }
})
