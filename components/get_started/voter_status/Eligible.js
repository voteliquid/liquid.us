const Component = require('../../Component')

module.exports = class EligibleToRegisterPage extends Component {
  render() {
    return this.html`
      <section class="section">
        <div class="columns is-centered">
          <div class="column is-half">
            <div class="content">
              <h2 class="subtitle">You said: <strong>I'm eligible to vote, but not registered at this address.</strong></h2>
              <p>
                Not a problem.
              </p>
              <p>
                In the future, we will need to verify voter registration status to be included in your elected reps' <strong><a href="https://blog.united.vote/2017/12/08/give-your-rep-an-f-introducing-united-legislator-grades/" target="_blank">Scorecards</a></strong>.
              </p>
              <p>
                We can help you register at that time.
              </p>
              <p>
                Until then, you are welcome to participate the same as any one else.
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
