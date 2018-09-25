const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_KEY } = process.env

module.exports = (req, res) => {
  const twilio = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_KEY)

  const phone_number = req.body.phone_number
  twilio.lookups.phoneNumbers(`+1${phone_number}`)
    .fetch({ countryCode: 'US' })
    .then(() => {
      res.status(204).end()
    })
    .catch((error) => {
      res.status(400).json(error)
    })
    .done()
}
