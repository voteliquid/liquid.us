const { APP_NAME } = process.env
const { handleForm, html } = require('../helpers')

module.exports = (state, dispatch) => {
  return html`
    <div>
      <style>
        .contact-btn, .contact-window {
          position: fixed;
          bottom: 0;
          right: 15px;
          margin-bottom: 0 !important;
          z-index: 10;
        }
        .contact-window {
          border: 1px solid #deeaf2;
        }
      </style>
      ${state.contactForm.open ? contactWidgetForm(state, dispatch) : contactWidgetButton(state, dispatch)}
    </div>
  `
}

const contactWidgetButton = (state, dispatch) => {
  return html`
    <p class="field contact-btn">
      <a
        class="button is-info is-small"
        onclick=${(event) => dispatch({ type: 'contactForm:toggled', event })}
      >
        <span class="icon is-small">
          <i class="fa fa-comment"></i>
        </span>
        <span>Help</span>
      </a>
    </p>
  `
}

const focusInput = (event) => {
  const email = event.target.querySelector('input[name="email"]')
  const message = event.target.querySelector('textarea')
  if (email) {
    email.focus()
  } else if (message) {
    message.focus()
  }
}

const contactWidgetForm = ({ contactForm: { submitted }, location: { url }, user }, dispatch) => {
  return html`
    <div class="message is-info contact-window">
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
      <div class="message-header" onclick=${(event) => dispatch({ type: 'contactForm:toggled', event })}>
        <p>
          <span class="icon is-small">
            <i class="fa fa-comment"></i>
          </span>
          <span>&nbsp;Help</span>
        </p>
        <button class="delete" aria-label="delete"></button>
      </div>
      <div class="message-body">
        <form onconnected=${focusInput} method="POST" onsubmit=${handleForm(dispatch, { type: 'contactForm:messageSent', user, url })}>
          ${submitted
            ? html`
              <p class="title is-5 has-text-centered">Thank you</p>
            ` : html`
              ${user ? '' : html`
                <div class="field">
                  <div class="control has-icons-left">
                    <input class="input" type="email" name="email" placeholder="Email (optional)" />
                    <span class="icon is-small is-left">
                      <i class="fa fa-envelope"></i>
                    </span>
                  </div>
                </div>
              `}
              <div class="field">
                <div class="control">
                  <textarea class="textarea" name="message" placeholder="${`Share any questions or comments. \n\nHow can we improve ${APP_NAME}?`}"></textarea>
                </div>
              </div>
              <div class="field">
                <div class="control">
                  <button class="button is-info is-fullwidth" style="display:block; width:100%;" type="submit">Submit</button>
                </div>
              </div>
            `
          }
        </form>
      </div>
    </div>
  `
}
