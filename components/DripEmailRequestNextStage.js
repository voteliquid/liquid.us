const Component = require('./Component')

const titles = {
  // TODO: Disabling because of new drip order (1b4f8d3)
  //       Should always return an error.
  //       These /next links have been removed from future drips.

  // '1': 'What Is Liquid Democracy, and Why Is It Important?',
  '2': 'Path to Liquid Democracy: Liquid Candidates',
  // '3': 'Liquid Scorecards',
  // '4': 'Representation by Trusted Personal Proxies',
  // '5': 'Liquid Democracy Can Make Our Legislatures Much Less Corrupt',
  // '6': 'How to Move Past a Two Party System',
  // '7': 'Restoring the Original Vision for an American Republic'
}

module.exports = class RequestNextDripStage extends Component {
  oninit() {
    const { stage_requested } = this.state
    const { location } = this

    if (!stage_requested) {
      return this.api('/drip_emails', {
        method: 'POST',
        headers: { 'Prefer': 'return=minimal' },
        body: JSON.stringify({
          previous_drip_email_id: location.query.id,
          stage: location.query.stage,
        }),
      })
      .then(() => {
        return { stage_requested: location.query.stage }
      })
      .catch(error => {
        console.log(error)
        return { error }
      })
    }
  }

  onclick(event) {
    event.preventDefault()
    return { isFeedbackWindowVisible: !this.state.isFeedbackWindowVisible }
  }

  render() {
    const { error, stage_requested } = this.state

    return this.html`
      <section class="section">
        <div class="columns is-centered">
          <div class="column is-half">
            <div class="content">
              <p class="title is-4">
                ${error || !titles[stage_requested]
                  ? 'There was a problem requesting the next email.'
                  : "Check your inbox! We're sending you the next email."
                }
              </p>
              <p class="subtitle is-4" style="margin-top: -10px">
                ${error || !titles[stage_requested]
                  ? ''
                  : `"${titles[stage_requested]}"`
                }
              </p>
              <br />
              <br />
              <p>
                Please <a onclick=${this}>send us a message</a> if this is an error.
              </p>
            </div>
          </div>
        </div>
      </section>
    `
  }
}
