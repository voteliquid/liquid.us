const Component = require('./Component')
const JoinForm = require('./JoinForm')

module.exports = class Join extends Component {
  oninit() {
    if (this.state.user) {
      return this.location.redirect('/')
    }
  }
  onpagechange(oldProps) {
    if (oldProps.url !== this.props.url && this.state.user) {
      return this.location.redirect('/')
    }
  }
  render() {
    return this.html`
      <div>
        <section class="section">
          <div class="container">
            ${JoinForm.for(this)}
          </div>
        </section>
        <div class="hero">
          <div class="hero-body">
            <h3 class="subtitle is-4 has-text-centered">Sign up in less than 5 minutes:</h3>
            <div class="container is-centered"><div class="columns">
              <div class="column has-text-centered">
                <h4 class="title is-4">
                  <span class="has-text-grey-light">&#9312;</span><br /><br />
                  <i class="fa fa-users" aria-hidden="true"></i>
                  Proxying
                </a></h4>
                <p>Choose optional personal representatives so your values will always be counted.</p>
              </div>
              <div class="column has-text-centered">
                <h4 class="title is-4">
                  <span class="has-text-grey-light">&#9313;</span><br /><br />
                  <i class="fa fa-address-card-o" aria-hidden="true"></i>
                  Verification
                </h4>
                <p>Confirm your identity to ensure 1-person-1-vote.</p>
              </div>
              <div class="column has-text-centered">
                <h4 class="title is-4">
                  <span class="has-text-grey-light">&#9314;</span><br /><br />
                  <i class="fa fa-check-square-o" aria-hidden="true"></i>
                  Legislation
                </h4>
                <p>Vote directly on bills to hold your elected reps accountable.</p>
              </div>
            </div></div>
          </div>
        </div>
      </div>
    `
  }
}
