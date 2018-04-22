const Component = require('./Component')
const fetch = require('isomorphic-fetch')

module.exports = class ContactWidget extends Component {
  render() {
    const { isContactWidgetVisible } = this.state

    return this.html`
      ${isContactWidgetVisible
        ? ContactWidgetForm.for(this)
        : ContactWidgetButton.for(this)
      }
      <style>
        .contact-btn, .contact-window {
          position: fixed;
          bottom: 0;
          right: 15px;
          margin-bottom: 0 !important;
          z-index: 99;
        }
      </style>
    `
  }
}

class ContactWidgetButton extends Component {
  onclick(event) {
    event.preventDefault()
    return { isContactWidgetVisible: !this.state.isContactWidgetVisible }
  }
  render() {
    return this.html`
      <p class="field contact-btn">
        <a class="button is-info is-small" onclick=${this}>
          <span class="icon is-small">
            <i class="fa fa-comment"></i>
          </span>
          <span>Contact</span>
        </a>
      </p>
    `
  }
}

class ContactWidgetForm extends Component {
  onclick(event) {
    event.preventDefault()
    return {
      contactSubmitted: false,
      isContactWidgetVisible: !this.state.isContactWidgetVisible,
    }
  }
  onsubmit(event, formData) {
    event.preventDefault()

    if (formData.message) {
      const user = this.state.user || { email: formData.email }

      fetch('https://api.liquid.vote/feedback', {
        body: JSON.stringify({
          text: formData.message,
          user,
          url: this.location.path,
        }),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      return { contactSubmitted: true }
    }
  }
  render() {
    const { contactSubmitted, user } = this.state

    return this.html`
      <article class="message is-info contact-window">
        <div class="message-header" onclick=${this}>
          <p>
            <span class="icon is-small">
              <i class="fa fa-comment"></i>
            </span>
            <span>&nbsp;Contact</span>
          </p>
          <button class="delete" aria-label="delete"></button>
        </div>
        <div class="message-body">
          <form method="POST" action="${this}" onsubmit=${this}>
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
                    <textarea class="textarea" name="message" placeholder="Comments? Questions?"></textarea>
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
}
