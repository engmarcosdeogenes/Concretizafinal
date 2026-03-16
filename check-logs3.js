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
  console.log('Status:', dep.state, dep.uid)

  const data = await request('/v3/deployments/' + dep.uid + '/events?teamId=' + TEAM_ID)
  const events = Array.isArray(data) ? data : (data.events || [])

  // Find lines around errors
  let printing = false
  events.forEach((e, i) => {
    const t = e.text || (e.payload && e.payload.text) || ''
    if (t.toLowerCase().includes('error') || t.toLowerCase().includes('failed') || t.includes('Type error') || t.includes('type error')) {
      // Print surrounding context
      for (let j = Math.max(0, i-2); j <= Math.min(events.length-1, i+5); j++) {
        const line = events[j].text || (events[j].payload && events[j].payload.text) || ''
        if (line.trim()) console.log(line)
      }
      console.log('---')
      printing = false
    }
  })
}

main().catch(console.error)
