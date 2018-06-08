const { API_URL } = process.env
const fetch = require('node-fetch')

const valid_phone = /^\+?[1-9]\d{1,14}$/

module.exports = eztextingWebhook

function eztextingWebhook(req, res, next) {
  const phone_number = `+${req.query.PhoneNumber}`
  const message = req.query.Message

  if (
    valid_phone.test(phone_number) &&
    ~message.toLowerCase().indexOf('liquid')
  ) {
    fetch(`${API_URL}/rpc/register_with_phone_number`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        phone_number,
        signup_channel: 'sms',
      }),
    })
    .then(api_res => api_res.json())
    .then(({ user_id }) => {
      res.set('Content-Type', 'text/plain')
      res.write(`Sign up for healthier politics: united.vote/join?sms=${user_id}`)
      res.status(200).end()
    })
    .catch(next)
  } else {
    res.status(400).end()
  }
}
