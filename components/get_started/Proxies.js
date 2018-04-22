const Component = require('../Component')
const ProxySearch = require('../ProxySearch')
const ProxiesTable = require('../ProxiesTable')

module.exports = class ChooseFirstProxyPage extends Component {
  oninit() {
    const { proxies, user } = this.state
    if (proxies) return this.state
    if (!user) return this.location.redirect('/sign_in')

    return this.api(`/delegations_detailed?from_id=eq.${user.id}&order=delegate_rank.asc`)
    .then(proxies => {
      return { proxies }
    })
    .catch(error => console.log(error) || this.state)
  }

  render() {
    const { proxies = [] } = this.state
    return this.html`
      <section oninit=${this} class="section">
        <div class="container">
          <div class="content">
            <h2 class="subtitle">Who do you trust to represent your vote?</h2>
            <p>None of us can cast an informed vote on every bill before Congress.</p>
            <p>Choosing proxies ensures your voice is heard on all legislation and lets you focus on areas that you care about.</p>
            <p class="is-size-7">You can adjust your proxies at any time.</p>
          </div>
          <div class="columns">
            <div class="column">${ProxySearch.for(this)}</div>
            <div class="column">
              ${proxies.length ? ProxiesTable.for(this, { show_help: false }) : []}
              <div class="${`field is-grouped ${proxies.length ? 'is-grouped-right' : ''}`}">
                <div class="control">
                  ${proxies.length
                    ? [`<a class="button is-primary" href="/get_started/updates"><strong>Done</strong></a>`]
                    : [`<a style="margin-top: 6rem; margin-left: 3rem;" class="button" href="/get_started/updates?skipped_proxies=true">Skip</a>`]
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    `
  }
}
