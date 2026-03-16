const https = require('https')
const TOKEN = process.env.VERCEL_TOKEN
const TEAM_ID = 'team_DAsKFZRPY9DX2zdXuBuQ1SDH'
const PROJECT_ID = 'prj_IOwOenC9hxaIgoFb2ffxQwMeZKpR'

function check() {
  const req = https.request({
    hostname: 'api.vercel.com',
    path: '/v6/deployments?projectId=' + PROJECT_ID + '&teamId=' + TEAM_ID + '&limit=1',
    headers: { 'Authorization': 'Bearer ' + TOKEN }
  }, res => {
    let body = ''
    res.on('data', d => body += d)
    res.on('end', () => {
      const d = JSON.parse(body)
      const dep = d.deployments && d.deployments[0]
      if (!dep) { console.log('Nenhum deploy encontrado'); return }
      console.log(dep.state, '-', dep.url)
      if (dep.state === 'BUILDING' || dep.state === 'QUEUED' || dep.state === 'INITIALIZING') {
        setTimeout(check, 15000)
      }
    })
  })
  req.end()
}
check()
