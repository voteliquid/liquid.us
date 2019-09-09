const { NODE_ENV } = process.env
const { preventDefault, redirect, combineEffects } = require('../helpers')
const fetch = require('isomorphic-fetch')

module.exports = (event, state) => {
  switch (event.type) {
    case 'contactForm:toggled':
      return [{
        ...state,
        contactForm: {
          submitted: false,
          open: !state.contactForm.open,
        },
      }, preventDefault(event.event)]
    case 'contactForm:messageSent':
      return [{
        ...state,
        contactForm: { ...state.contactForm, submitted: true },
      }, sendMessage({ url: state.location.url, ...event, user: state.user })]
    case 'contactForm:submitCandidatePage':
      return [{
        ...state,
        contactForm: { ...state.contactForm, submitted: true },
      }, combineEffects([
        sendMessage({ ...event, user: state.user }), 
        redirect('/candidate_confirmation'),
      ])
    ]
    default:
      return [state]
  }
}

const sendMessage = ({ email, message, url, user, event }) => () => {
  if (event) event.preventDefault()

  if (message) {
    if (!user) user = { email }

    if (NODE_ENV === 'production') {
      fetch('https://blog-api.liquid.us/feedback', {
        body: JSON.stringify({
          text: message,
          user,
          url,
        }),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })
    } else {
      console.log('skipping sending of contact email', message, user, url)
    }
  }
}
