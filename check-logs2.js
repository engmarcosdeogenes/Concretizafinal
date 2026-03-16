const https = require('https')
const TOKEN = process.env.VERCEL_TOKEN
const TEAM_ID = 'team_DAsKFZRPY9DX2zdXuBuQ1SDH'
const DEP_UID = 'dpl_8AVefQpYLJFmYqrpjofAhg8AFjjz'

const req = https.request({
  hostname: 'api.vercel.com',
  path: '/v3/deployments/' + DEP_UID + '/events?teamId=' + TEAM_ID,
  headers: { 'Authorization': 'Bearer ' + TOKEN }
}, res => {
  let body = ''
  res.on('data', d => body += d)
  res.on('end', () => {
    try {
      const data = JSON.parse(body)
      const events = Array.isArray(data) ? data : (data.events || [])
      // Find error lines
      const errorLines = events.filter(e => {
        const t = (e.text || (e.payload && e.payload.text) || '').toLowerCase()
        return t.includes('error') || t.includes('failed') || t.includes('type error')
      })
      console.log('=== ERROR LINES ===')
      errorLines.forEach(e => console.log(e.text || (e.payload && e.payload.text)))
    } catch(err) {
      // Try NDJSON
      const lines = body.split('\n').filter(l => l.trim())
      const errors = lines.filter(l => {
        try {
          const p = JSON.parse(l)
          const t = (p.text || p.message || '').toLowerCase()
          return t.includes('error') || t.includes('failed') || t.includes('type error')
        } catch { return l.toLowerCase().includes('error') }
      })
      errors.forEach(e => {
        try { console.log(JSON.parse(e).text || e) } catch { console.log(e) }
      })
    }
  })
})
req.end()
