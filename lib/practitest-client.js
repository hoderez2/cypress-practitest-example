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

async function autoCreateRun(payload) {
  const cfg = getConfig()
  const client = createClient()

  const response = await client.post(
    `/api/v2/projects/${cfg.projectId}/runs/auto_create.json`,
    payload
  )

  return response.data
}

module.exports = {
  getConfig,
  autoCreateRun,
}