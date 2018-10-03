const request = require('request')

module.exports = (req, res) => {
  request.get(`https://avatars.io/twitter/${req.params.username}`).pipe(res)
}
