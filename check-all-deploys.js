const https = require('https')
const TOKEN = process.env.VERCEL_TOKEN
const TEAM_ID = 'team_DAsKFZRPY9DX2zdXuBuQ1SDH'
const PROJECT_ID = 'prj_IOwOenC9hxaIgoFb2ffxQwMeZKpR'

const req = https.request({
  hostname: 'api.vercel.com',
  path: '/v6/deployments?projectId=' + PROJECT_ID + '&teamId=' + TEAM_ID + '&limit=5',
  headers: { 'Authorization': 'Bearer ' + TOKEN }
}, res => {
  let body = ''
  res.on('data', d => body += d)
  res.on('end', () => {
    const d = JSON.parse(body)
    d.deployments.forEach(dep => {
      console.log(dep.state, new Date(dep.createdAt).toLocaleTimeString(), dep.uid, dep.url)
    })
  })
})
req.end()
