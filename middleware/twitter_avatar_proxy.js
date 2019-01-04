const request = require('request')

module.exports = (req, res, next) => {
  const str = request.get(`https://avatars.io/twitter/${req.params.username}`)
  str.on('response', (response) => {
    const contentType = response.headers['content-type'] || ''
    if (response.statusCode === 404 || response.statusCode === 403 || ~contentType.indexOf('html')) {
      request.get('https://www.gravatar.com/avatar/default?d=mm&s=200').pipe(res)
    } else {
      str.pipe(res)
    }
  })
  str.on('error', next)
}
