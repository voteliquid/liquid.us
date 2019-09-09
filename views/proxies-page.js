const { APP_NAME } = process.env
const { html } = require('../helpers')
const activityIndicator = require('./activity-indicator')
const proxiesTable = require('./proxies-table')
const proxySearch = require('./proxy-search')

// TODO fix animation
module.exports = (state, dispatch) => {
  const { loading, proxies = [], user } = state
  return html`
    <section class="section">
      <div class="container is-widescreen">
        ${user
          && user.voter_status !== 'Ineligible'
          && !user.phone_verified
          && proxies.length > 0 ? html`
          <div class="notification">
            You haven't verified yet. <strong><a href="/get_started">Finish verification</a></strong> so your proxies can represent you.
          </div>
        ` : ''}
        <div class="columns is-variable is-5">
          <div class="column">
            <h3 class="title is-5">Add Proxy</h3>
            ${proxySearch(state, dispatch)}
          </div>
          <div class="column">
            <h3 class="title is-5">Your Proxies</h3>
            ${proxies.length ? html`
              <p>The highest ranked gets your extra vote. If your 1st choice doesn't vote, it goes to your 2nd, then 3rd, and on.</p>
            ` : ''}
            ${loading.proxies
              ? activityIndicator()
              : proxies.length
                ? proxiesTable(state, dispatch)
                : html`
                  <div class="content">
                    <p>
                      You don't have any proxies yet.
                    </p>
                    <p>
                      ${APP_NAME} lets you pick <strong>anyone</strong> to
                      represent you. You can change at anytime, and you can always
                      override them and vote directly on bills.
                    </p>
                    <p>
                      For any item that you don't vote on, one of your proxies get an additional vote. This ensures that your values are still represented, even when you don't have the time to look into all the issues.
                    </p>
                  </div>
                `}
          </div>
        </div>
      </div>
    </section>
  `
}
