const Component = require('./Component')
const fetch = require('isomorphic-fetch')

module.exports = class FeedbackWidget extends Component {
  render() {
    const { isFeedbackWindowVisible } = this.state

    return this.html`
      ${isFeedbackWindowVisible
        ? FeedbackWidgetForm.for(this)
        : FeedbackWidgetButton.for(this)
      }
      <style>
        .feedback-btn, .feedback-window {
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

class FeedbackWidgetButton extends Component {
  onclick(event) {
    event.preventDefault()
    return { isFeedbackWindowVisible: !this.state.isFeedbackWindowVisible }
  }
  render() {
    return this.html`
      <p class="field feedback-btn">
        <a class="button is-info" onclick=${this}>
          <span class="icon is-small">
            <i class="fa fa-comment"></i>
          </span>
          <span>Feedback</span>
        </a>
      </p>
    `
  }
}

class FeedbackWidgetForm extends Component {
  onclick(event) {
    event.preventDefault()
    return {
      feedbackSubmitted: false,
      isFeedbackWindowVisible: !this.state.isFeedbackWindowVisible,
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

      return { feedbackSubmitted: true }
    }
  }
  render() {
    const { feedbackSubmitted, user } = this.state

    return this.html`
      <article class="message is-info feedback-window">
        <div class="message-header" onclick=${this}>
          <p>
            <span class="icon is-small">
              <i class="fa fa-comment"></i>
            </span>
            <span>&nbsp;Feedback</span>
          </p>
          <button class="delete" aria-label="delete"></button>
        </div>
        <div class="message-body">
          <form method="POST" action="${this}" onsubmit=${this}>
            ${feedbackSubmitted
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
                    <textarea class="textarea" name="message" placeholder="Your message"></textarea>
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
        .feedback-window {
          width: 300px;
        }
        .feedback-window .message-header {
          cursor: pointer;
        }
        .feedback-window textarea {
          height: 300px;
        }
      </style>
    `
  }
}
