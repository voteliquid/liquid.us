const { combineEffects, html, preventDefault } = require('../helpers')
const fetch = require('isomorphic-fetch')

module.exports = {
  init: [{
    contactSubmitted: false,
    isOpen: false,
    url: '',
    user: null,
  }],
  update: (event, state) => {
    switch (event.type) {
      case 'buttonClicked':
        return [{ ...state, isOpen: !state.isOpen }, preventDefault(event.event)]
      case 'formSubmitted':
        return [state, combineEffects(
          preventDefault(event.event),
          submitMessage(event.event, state.user, state.url)
        )]
      case 'messageSent':
        return [{ ...state, contactSubmitted: true }]
      default:
        return [state]
    }
  },
  view: ({ isOpen }, dispatch) => {
    return html()`
      <style>
        .contact-btn, .contact-window {
          position: fixed;
          bottom: 0;
          right: 15px;
          margin-bottom: 0 !important;
          z-index: 99;
        }
        .contact-window {
          border: 1px solid #deeaf2;
        }
      </style>
      ${isOpen ? contactWidgetForm({}, dispatch) : contactWidgetButton({}, dispatch)}
    `
  },
}

const submitMessage = (event, user, url) => (dispatch) => {
  const message = event.target.querySelector('input[name="message"]')
  const email = event.target.querySelector('input[name="email"]')
  if (message) {
    if (!user) user = { email }

    fetch('https://api.liquid.vote/feedback', {
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

    dispatch({ type: 'messageSent' })
  }
}

const contactWidgetButton = (state, dispatch) => {
  return html()`
    <p class="field contact-btn">
      <a
        class="button is-info is-small"
        onclick=${(event) => dispatch({ type: 'buttonClicked', event })}
      >
        <span class="icon is-small">
          <i class="fa fa-comment"></i>
        </span>
        <span>Help</span>
      </a>
    </p>
  `
}

const contactWidgetForm = ({ contactSubmitted, user }, dispatch) => {
  return html()`
    <article class="message is-info contact-window">
      <div class="message-header" onclick=${(event) => dispatch({ type: 'buttonClicked', event })}>
        <p>
          <span class="icon is-small">
            <i class="fa fa-comment"></i>
          </span>
          <span>&nbsp;Help</span>
        </p>
        <button class="delete" aria-label="delete"></button>
      </div>
      <div class="message-body">
        <form method="POST" onsubmit=${(event) => dispatch({ type: 'formSubmitted', event })}>
          ${contactSubmitted
            ? [`
              <p class="title is-5 has-text-centered">Thank you</p>
            `] : [`
              ${user ? [] : [`
                <div class="field">
                  <div class="control has-icons-left">
                    <input class="input" type="email" name="email" placeholder="Email (optional)" />
                    <span class="icon is-small is-left">
                      <i class="fa fa-envelope"></i>
                    </span>
                  </div>
                </div>
              `]}
              <div class="field">
                <div class="control">
                  <textarea class="textarea" name="message" placeholder="Share any questions or comments. \n\nHow can we improve United?"></textarea>
                </div>
              </div>
              <div class="field">
                <div class="control">
                  <button class="button is-info is-fullwidth" style="display:block; width:100%;" type="submit">Submit</button>
                </div>
              </div>
            `]
          }
        </form>
      </div>
    </article>
    <style>
      .contact-window {
        width: 300px;
      }
      .contact-window .message-header {
        cursor: pointer;
      }
      .contact-window textarea {
        height: 300px;
      }
    </style>
  `
}
