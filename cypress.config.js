const { defineConfig } = require('cypress')
require('dotenv').config()

const { reportSpecResults } = require('./lib/practitest-reporter')

module.exports = defineConfig({
  video: false,
  screenshotOnRunFailure: true,
  allowCypressEnv: false,

  e2e: {
    setupNodeEvents(on, config) {
      on('after:spec', async (spec, results) => {
        if (!results) return

        try {
          await reportSpecResults(spec, results)
          console.log(`PractiTest reporting completed for ${spec.relative}`)
        } catch (error) {
          console.error(`PractiTest reporting failed for ${spec.relative}`)
          console.error(error.message)
          throw error
        }
      })

      return config
    },
  },
})