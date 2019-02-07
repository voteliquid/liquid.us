const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_KEY } = process.env

module.exports = (req, res) => {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_KEY) {
    return res.status(400).json({ message: 'Missing phone_verification keys (process.env)' })
  }
  const twilio = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_KEY)


  const phone_number = req.body.phone_number
  twilio.lookups.phoneNumbers(`+1${phone_number}`)
    .fetch({ countryCode: 'US', type: 'carrier' })
    .then((result) => {
      if (result.carrier && result.carrier.type !== 'mobile') {
        return Promise.reject(new Error('Non-US, toll-free, or VoIP numbers cannot be used to verify.'))
      }
      res.status(204).end()
    })
    .catch((error) => {
      console.log(error)
      res.status(400).json({ message: error.message })
    })
    .done()
}
