const Twitter = require('twitter')

module.exports = twitterUsernameSearch

function twitterUsernameSearch(req, res, next) {
  const client = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
  })

  const twitter_username = req.body.twitter_username

  client.get('users/search', { q: `@${twitter_username}` }, (error, users) => {
    if (error) return next(error)

    const first_result = users[0]

    if (first_result
      && first_result.screen_name
      && twitter_username
      && first_result.screen_name.toLowerCase() === twitter_username.toLowerCase()) {
      res.json({
        name: first_result.name,
        twitter_username: first_result.screen_name,
        location: first_result.location,
        description: first_result.description,
        avatar: first_result.profile_image_url_https.replace('normal', '200x200'),
      })
    } else {
      res.status(404).json({ message: `Can't find user @${twitter_username}` })
    }
  })
}
