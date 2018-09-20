const Component = require('./Component')
const LoadingIndicator = require('./LoadingIndicator')
const ProxySearch = require('./ProxySearch')
const ProxiesTable = require('./ProxiesTable')
const JoinForm = require('./JoinForm')

module.exports = class ProxiesPage extends Component {
  render(_, { user }) {
    return this.html`
      <section class="section">
        <div class="container is-widescreen">
          ${user ? AuthedProxies.for(this) : AnonProxies.for(this)}
        </div>
      </section>
    `
  }
}

class AnonProxies extends Component {
  render() {
    return this.html`
      <div class="columns is-variable is-6">
        <div class="column">
          <h3 class="title">Who do you trust to represent you?</h3>
          <div class="content">
            <p>
              United lets you pick <strong>anyone</strong> to represent you.
            </p><p>
              For any bill that you don't vote on directly, your personal proxy gets your extra vote. You can always override or replace them.
            </p><p>
              This ensures your values are always represented, even when you don't have time to look into all the issues.
            </p>
          </div>
        </div>
        <div class="column has-text-centered">
          ${JoinForm.for(this, { show_title: false })}
        </div>
      </div>
    `
  }
}

class AuthedProxies extends Component {
  oninit() {
    if (!this.state.proxies) {
      return this.fetchProxies()
    }
  }

  onconnected() {
    return this.fetchProxies()
  }

  fetchProxies() {
    const { user } = this.state
    this.setState({ loading_proxies: true })
    return this.api(`/delegations_detailed?from_id=eq.${user.id}&order=delegate_rank.asc`)
      .then(proxies => this.setState({ loading_proxies: false, proxies }))
      .catch(() => this.setState({ loading_proxies: false, proxies: [] }))
  }

  render() {
    const { loading_proxies, proxies = [], user } = this.state

    return this.html`
      <div onconnected=${this}>
        ${user
          && user.voter_status !== 'Ineligible'
          && !user.cc_verified
          && proxies.length > 0 ? [`
          <div class="notification">
            <span class="icon"><i class="fa fa-exclamation-triangle"></i></span>
            You haven't verified your identity yet. <strong><a href="/get_started">Finish verification</a></strong> so your proxies can represent you.
          </div>
          <br />
        `] : []}

        <div class="columns is-variable is-5">
          <div class="column">
            <h3 class="title is-5">Add Proxy</h3>
            ${ProxySearch.for(this)}
          </div>
          <div class="column">
            <h3 class="title is-5">Your Proxies</h3>
            ${proxies.length ? [`
              <p>The highest ranked gets your extra vote. If your 1st choice doesn't vote, it goes to your 2nd, then 3rd, and on.</p>
              <br />
            `] : []}
            ${loading_proxies
              ? LoadingIndicator.for(this)
              : proxies.length
                ? ProxiesTable.for(this, { show_help: false })
                : [`
                  <div class="content">
                    <p>
                      You don't have any proxies yet.
                    </p>
                    <p>
                      ${this.state.config.APP_NAME} lets you pick <strong>anyone</strong> to
                      represent you. You can change at anytime, and you can always
                      override them and vote directly on bills.
                    </p>
                    <p>
                      For any item that you don't vote on, one of your proxies get an additional vote. This ensures that your values are still represented, even when you don't have the time to look into all the issues.
                    </p>
                  </div>
                `]}
          </div>
        </div>
      </div>
    `
  }
}
