const Component = require('../../Component')

module.exports = class IneligiblePage extends Component {
  render() {
    return this.html`
      <section class="section">
        <div class="columns is-centered">
          <div class="column is-half">
            <div class="content">
              <h2 class="subtitle">You said: <strong>I'm not eligible to vote.</strong></h2>
              <h4 class="subtitle is-5">
                You can still participate on United.
              </h4>
              <p>
                In the future, we plan to verify Voter Registration status, and unregistered people won't be included by default in <strong>Liquid Scorecards</strong>.
              </p>
              <p>
                But we would like to continue to offer a way for all residents, including ineligible voters, to have a meaningful voice in our communities. We will be transparent about this.
              </p>
              <p>
                For now, you are welcome to participate the same as any other resident.
              </p>
              <p>
                <div class="field is-grouped is-grouped-right">
                  <a class="button is-primary" href="/get_started/verification">Continue</a>
                </div>
              </p>
            </div>
          </div>
        </div>
      </div>
    `
  }
}
