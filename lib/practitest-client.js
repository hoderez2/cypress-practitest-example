const axios = require('axios')

function getRequiredEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return value
}

function getConfig() {
  return {
    baseUrl: getRequiredEnv('PT_BASE_URL').replace(/\/$/, ''),
    email: getRequiredEnv('PT_EMAIL'),
    token: getRequiredEnv('PT_TOKEN'),
    projectId: getRequiredEnv('PT_PROJECT_ID'),
    setId: getRequiredEnv('PT_SET_ID'),
  }
}

function createClient() {
  const cfg = getConfig()

  return axios.create({
    baseURL: cfg.baseUrl,
    timeout: 30000,
    auth: {
      username: cfg.email,
      password: cfg.token,
    },
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

// Retries on 429 (Too Many Requests): waits 15s on first retry, 30s on second, then throws.
async function autoCreateRun(payload, retries = 3) {
  const cfg = getConfig()
  const client = createClient()
  // Wait 15s on first retry, 30s on second — rate limit resets every ~60s
  const retryDelays = [15000, 30000]

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await client.post(
        `/api/v2/projects/${cfg.projectId}/runs/auto_create.json`,
        payload
      )
      return response.data
    } catch (err) {
      // Retry only on rate limiting and only if attempts remain
      if (err.response?.status === 429 && attempt < retries) {
        const delay = retryDelays[attempt - 1]
        console.warn(`PractiTest rate limited (429). Retrying in ${delay / 1000}s... (attempt ${attempt}/${retries})`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      } else {
        throw err
      }
    }
  }
}

module.exports = {
  getConfig,
  autoCreateRun,
}