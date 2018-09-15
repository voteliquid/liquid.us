const Component = require('./Component')
const JoinForm = require('./JoinForm')
const atob = require('atob')

module.exports = class Join extends Component {
  oninit() {
    if (this.state.user) {
      if (this.location.query.ph) {
        // If they followed an SMS signup link, update their account to include their phone number
        return this.api(`/users?id=eq.${this.state.user.id}`, {
          method: 'PATCH',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify({ phone_number: atob(this.location.query.ph) }),
        })
        .then(() => this.location.redirect('/'))
      }

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
                  <i class="far fa-address-card" aria-hidden="true"></i>
                  Verification
                </h4>
                <p>Confirm your identity to ensure 1-person-1-vote.</p>
              </div>
              <div class="column has-text-centered">
                <h4 class="title is-4">
                  <span class="has-text-grey-light">&#9314;</span><br /><br />
                  <i class="far fa-check-square" aria-hidden="true"></i>
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
