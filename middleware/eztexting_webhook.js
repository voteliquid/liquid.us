const valid_phone = /^\+?[1-9]\d{1,14}$/

module.exports = eztextingWebhook

function eztextingWebhook(req, res) {
  const phone_number = `+1${req.query.PhoneNumber}`
  const message = req.query.Message
  const proxy_re = message.match(/liquid +(\w+)/i)
  const proxy = (proxy_re ? proxy_re[1] : '').toLowerCase()

  if (
    valid_phone.test(phone_number) &&
    ~message.toLowerCase().indexOf('liquid')
  ) {
    const proxy_param = proxy ? `&proxy_to=${proxy}` : ''

    res.set('Content-Type', 'text/plain')
    res.write(`Sign up for healthier politics: https://united.vote/join?ph=${Buffer.from(phone_number).toString('base64')}${proxy_param}`)
    res.status(200).end()
  } else {
    res.status(400).end()
  }
}
