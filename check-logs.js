const https = require('https')
const TOKEN = process.env.VERCEL_TOKEN
const TEAM_ID = 'team_DAsKFZRPY9DX2zdXuBuQ1SDH'
const PROJECT_ID = 'prj_IOwOenC9hxaIgoFb2ffxQwMeZKpR'

function request(path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.vercel.com',
      path,
      headers: { 'Authorization': 'Bearer ' + TOKEN }
    }, res => {
      let body = ''
      res.on('data', d => body += d)
      res.on('end', () => resolve(JSON.parse(body)))
    })
    req.on('error', reject)
    req.end()
  })
}

async function main() {
  const deps = await request('/v6/deployments?projectId=' + PROJECT_ID + '&teamId=' + TEAM_ID + '&limit=1')
  const dep = deps.deployments && deps.deployments[0]
  if (!dep) { console.log('Nenhum deploy'); return }
  console.log('Status:', dep.state, dep.uid)

  const logs = await request('/v2/deployments/' + dep.uid + '/events?teamId=' + TEAM_ID + '&limit=100&direction=backward')
  const events = Array.isArray(logs) ? logs : (logs.events || [])

  // Show last 50 lines
  const lines = events.slice(-50)
  lines.forEach(e => {
    const text = e.text || e.payload && e.payload.text || ''
    if (text) console.log(text)
  })
}

main().catch(console.error)
