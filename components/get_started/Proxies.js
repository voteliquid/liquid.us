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
        <div class="columns is-centered">
          <div class="column is-two-thirds">
            <div class="content">
              <h2 class="subtitle">Who do you trust to vote for you when you choose not to?</h2>
              <p class="is-size-6">None of us can cast an informed vote on every bill before Congress. Choosing proxies ensures your voice is heard on all legislation and lets you focus on areas that you care about.</p>
              <p class="is-size-6">It's optional, and you can adjust your proxies at any time. They're private.</p>
            </div>
            <div class="columns">
              <div class="column">${ProxySearch.for(this, { show_tabs: !!this.location.query.tab })}</div>
              <div class="column">
                ${proxies.length ? ProxiesTable.for(this, { show_help: false }) : []}
                <div class="${`field is-grouped ${proxies.length ? 'is-grouped-right' : ''}`}">
                  <div class="control">
                    ${proxies.length
                      ? [`<a class="button is-primary" href="/get_started"><strong>Done</strong></a>`]
                      : [`<a style="margin-top: 2rem;" class="button" href="/get_started?skip=true">Skip</a>`]
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    `
  }
}
