// Reports Cypress test results to PractiTest using the auto_create API.
// - Creates tests automatically if they don't exist
// - Creates runs in the configured Test Set
// - Attaches screenshots for failed tests

const fs = require('fs')
const path = require('path')
const { autoCreateRun, getConfig } = require('./practitest-client')

function toRunDuration(ms = 0) {
  const totalSeconds = Math.max(0, Math.round(ms / 1000))
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

function buildExecutionOutput(test) {
  const fullName = Array.isArray(test.title) ? test.title.join(' ') : 'Unnamed test'

  if (test.state === 'passed') {
    return `Cypress test passed: ${fullName}`
  }

  const displayError = test.displayError || 'No error details provided'
  return `Cypress test failed: ${fullName}\n\n${displayError}`
}

function fileToAttachment(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null

    return {
      filename: path.basename(filePath),
      content_encoded: fs.readFileSync(filePath).toString('base64'),
    }
  } catch (err) {
    console.error('Attachment error:', filePath)
    return null
  }
}

function getTestName(test) {
  return Array.isArray(test.title) ? test.title.join(' ') : 'Unnamed test'
}

async function reportSpecResults(spec, results) {
  if (!results || !Array.isArray(results.tests)) return

  const cfg = getConfig()

  for (const test of results.tests) {
    if (!['passed', 'failed'].includes(test.state)) {
      continue
    }

    // const testName = test.title[test.title.length - 1]
    // if we want the name of the test without the spec name before
    const testName = getTestName(test)

    // Cypress does not expose screenshots in results,
    // so we read them directly from the filesystem
    const specFolder = `cypress/screenshots/${spec.name}`

    let attachments = []
    const lastTitle = test.title[test.title.length - 1]

    if (fs.existsSync(specFolder)) {
      const files = fs.readdirSync(specFolder)
      // Attach screenshots only for failed tests
      if (test.state === 'failed') {
      attachments = files
        .filter((file) => file.includes(lastTitle))
        .map((file) => {
          const fullPath = `${specFolder}/${file}`
          return fileToAttachment(fullPath)
        })
        .filter(Boolean)
      }
    }

    // Build PractiTest auto_create payload
    const payload = {
      data: {
        type: 'instances',
        attributes: {
          'set-id': Number(cfg.setId),
          'exit-code': test.state === 'passed' ? 0 : 1,
          'run-duration': toRunDuration(test.duration),
          'automated-execution-output': buildExecutionOutput(test),
        },
        'test-attributes': {
          name: testName,
        },
      },
    }

    if (attachments.length > 0) {
      payload.data.files = {
        data: attachments,
      }
    }

    try {
      await autoCreateRun(payload)
      console.log(`PractiTest run created: ${testName}`)
    } catch (error) {
      console.error('PractiTest ERROR:')
      console.error(JSON.stringify(error.response?.data, null, 2))
      console.error(error.message)
      throw error
    }
  }
}

module.exports = {
  reportSpecResults,
}