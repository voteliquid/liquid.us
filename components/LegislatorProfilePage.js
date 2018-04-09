const Component = require('./Component')
const ordinalSuffix = require('ordinal-suffix')
const YourLegislators = require('./YourLegislators')

module.exports = class LegislatorProfilePage extends Component {
  oninit() {
    return YourLegislators.prototype.fetchElectedLegislators.call(this)
  }
  onsubmit(event) {
    event.preventDefault()

    const { selected_profile, user } = this.state
    const { redirect } = this.location

    // Redirect to /join if they're not logged in
    if (!user) {
      this.storage.set('proxying_user_id', selected_profile.user_id)
      return redirect('/join')
    }

    if (!selected_profile.proxied) {
      return this.api('/delegations', {
        method: 'POST',
        headers: { Prefer: 'return=representation' }, // returns created delegation in response
        body: JSON.stringify({
          from_id: user.id,
          first_name: selected_profile.first_name.trim(),
          last_name: selected_profile.last_name.trim(),
          email: null,
          username: selected_profile.username.toLowerCase().trim(),
          delegate_rank: 0,
        }),
      })
      .then(() => {
        selected_profile.proxied = true
        return { selected_profile }
      })
      .catch((error) => {
        if (error.code === 'P0001') {
          this.storage.set('proxying_user_id', selected_profile.user_id)
          return redirect('/get_started/basics?notification=proxy_wo_name')
        }
      })
    }

    return this.api(`/delegations?id=eq.${selected_profile.proxied}`, {
      method: 'DELETE',
      headers: { Prefer: 'return=representation' }, // returns created delegation in response
    })
    .then(() => {
      selected_profile.proxied = false
      return { selected_profile }
    })
  }
  render() {
    const { proxied_name, selected_profile, user, reps } = this.state
    const { proxied } = selected_profile
    const isMyRep = reps && reps.some(rep => rep.username === selected_profile.username)

    return this.html`
      <section class="section">
        <div class="container">
          ${isMyRep && !user ? [`
            <div class="notification is-dark has-text-centered">
              This looks like one of your reps. <a href="/join"><strong>Join United</strong></a> to begin holding them accountable.
            </div>
          `] : []}
          ${isMyRep && user && !user.cc_verified ? [`
            <div class="notification is-dark has-text-centered">
              This is one of your reps. <a href="/get_started"><strong>Verify your identity</strong></a> to begin holding them accountable.
            </div>
          `] : []}
          ${proxied_name ? [`
            <div class="notification is-info has-text-centered">
              Your proxy to ${proxied_name} has been saved.
            </div>
          `] : []}
          <div class="columns">
            <div class="column">
              <div class="media">
                <div class="media-left">
                  <img src=${this.avatarURL(selected_profile)} alt="avatar" width="128">
                </div>
                <div class="media-content">
                  <h1 class="title">${selected_profile.first_name} ${selected_profile.last_name}</h1>
                  <h2 class="subtitle is-6 has-text-grey">${selected_profile.elected_office_name}</h2>
                  <form onsubmit=${this} action=${this} method="POST">
                    ${[`<button ${proxied ? "disabled" : ""} type="submit" class="button">
                      <span class="icon is-small"><i class="fa fa-handshake-o"></i></span>
                      <span>&nbsp;Prox${proxied ? 'ied' : 'y'} to ${selected_profile.first_name}</span>
                    </button>`]}
                    ${proxied ? [`
                      <div class="content is-size-7 has-text-left">
                        <p>Visit your <a href="/proxies">Proxies</a> page to manage.</p>
                      </div>
                    `] : ''}
                  </form>
                </div>
              </div>
            </div>
            <div class="column is-one-third-desktop is-half-tablet">
              <div class="box">
                <div class="content">
                  <p>
                    <span class="tag is-dark has-text-weight-bold is-size-4">${selected_profile.score_grade || [`<span class="icon"><i class="fa fa-question"></i></span>`]}</span>
                  </p>
                  ${selected_profile.score_grade ?
                    [`
                      <p class="is-size-6 has-text-grey">${ordinalSuffix(selected_profile.score_percentile)} percentile among ${selected_profile.elected_office_chamber} ${selected_profile.party_affiliation}s</p>
                      <p class="is-size-7 has-text-grey">Graded on how often ${selected_profile.first_name} votes the same way as verified constituents in ${selected_profile.elected_office_short_name}</p>
                    `] : [`
                      <p>Need more constituent votes to calculate a grade.<p>
                  `]}
                </div>
              </div>
            </div>
          </div>
          ${LatestVotesTable.for(this)}
        </div>
      </section>
    `
  }
}

function setQuery(query, values) {
  const q = Object.assign({}, query, values)
  return `?${Object.keys(q).map(k => `${k}=${q[k]}`).join('&')}`
}

class LatestVotesTable extends Component {
  render() {
    const { selected_profile, user } = this.state
    const { query } = this.location
    const page_size = 20
    const page = Number(query.page || 1)
    const has_prev_page = page > 1
    const has_next_page = selected_profile.votes.length === page_size
    const order_by = query.order_by || 'date'
    const order = query.order || 'desc'
    const opposite_order = order === 'desc' ? 'asc' : 'desc'

    return this.html`
      <h3 class="title is-5">Latest Votes</h3>
      <table class="table is-responsive is-narrow is-fullwidth is-bordered is-striped">
        <thead>
          <tr>
            <th style="vertical-align: bottom;" rowspan="2">
              <a href=${setQuery(query, { order_by: 'date', order: order_by === 'date' ? opposite_order : 'desc' })}>
                <span>Date&nbsp;${order_by === 'date' ? [`<i class="fa ${order === 'asc' ? `fa-sort-asc` : `fa-sort-desc`}" style="display:inline;"></i></span>`] : ''}
              </a>
            </th>
            <th style="vertical-align: bottom;" rowspan="2">Bill</th>
            <th style="vertical-align: bottom;" rowspan="2">Title</th>
            <th style="vertical-align: bottom;" class="has-text-centered" rowspan="2">Their Vote</th>
            <th class="has-text-centered" colspan="3">Constituents</th>
            ${user ? [`
              <th style="vertical-align: bottom;" class="has-text-centered" rowspan="2">Your Vote</th>
              <th style="vertical-align: bottom;" class="has-text-centered" rowspan="2">Your Proxy</th>
            `] : []}
          </tr>
          <tr>
            <th class="has-text-centered">
              <a href=${setQuery(query, { order_by: 'with_constituents', order: order_by === 'with_constituents' ? opposite_order : 'desc' })}>
                <span>With&nbsp;${order_by === 'with_constituents' ? [`<i class="fa ${order === 'asc' ? `fa-sort-asc` : `fa-sort-desc`}" style="display:inline;"></i></span>`] : ''}
              </a>
            </th>
            <th class="has-text-centered">
              <a href=${setQuery(query, { order_by: 'against_constituents', order: order_by === 'against_constituents' ? opposite_order : 'desc' })}>
                <span>Against&nbsp;${order_by === 'against_constituents' ? [`<i class="fa ${order === 'asc' ? `fa-sort-asc` : `fa-sort-desc`}" style="display:inline;"></i></span>`] : ''}
              </a>
            </th>
            <th class="has-text-centered">
              <a href=${setQuery(query, { order_by: 'representation_delta', order: order_by === 'representation_delta' ? opposite_order : 'desc' })}>
                <span>Delta&nbsp;${order_by === 'representation_delta' ? [`<i class="fa ${order === 'asc' ? `fa-sort-asc` : `fa-sort-desc`}" style="display:inline;"></i></span>`] : ''}
              </a>
            </th>
          </tr>
        </thead>
        <tbody>
          ${selected_profile.votes.length
            ? selected_profile.votes.map(vote => LatestVotesTableRow.for(this, { vote, user }, `latest-votes-row-${vote.rollcall_id}`))
            : [`<tr><td colspan="9">No legislation to display.</td></tr>`]
          }
        </tbody>
      </table>
      <div class="has-text-right-tablet has-text-left-mobile">
        ${has_prev_page ? [`<a href=${setQuery(query, { page: page - 1 })} class="button">Previous page</a>`] : ''}
        ${has_next_page ? [`<a href=${setQuery(query, { page: page + 1 })} class="button">Next page</a>`] : ''}
      </div>
    `
  }
}

class LatestVotesTableRow extends Component {
  render() {
    const { user, vote } = this.props
    const { selected_profile } = this.state

    return this.html`
      <tr>
        <td>${vote.rollcall_occurred_at_formatted}</td>
        <td>
          <a href=${`/legislation/${vote.legislation_short_id}`}>
            <span class="responsive-bold">${formatBillTitle(vote.legislation_short_id)}</span>
          </a>
        </td>
        <td>
          <a href=${`/legislation/${vote.legislation_short_id}`}>
            ${vote.legislation_short_title}
          </a>
        </td>
        <td class="has-text-centered"><span class="responsive-label">${selected_profile.name} voted </span>${vote.legislator_position}</td>
        <td class="has-text-centered responsive-inline-block">
          <span class="responsive-label">With: </span>
          <span class=${vote.with_constituents === 0 && 'has-text-grey-lighter'}>${vote.with_constituents}</span>
        </td>
        <td class="has-text-centered responsive-inline-block">
          <span class="responsive-label">Against: </span>
          <span class=${vote.against_constituents === 0 && 'has-text-grey-lighter'}>${vote.against_constituents}</span>
        </td>
        <td class="has-text-centered responsive-inline-block">
          <span class="responsive-label">Delta: </span>
          <span class=${vote.representation_delta < 0 ? 'has-text-danger' : (vote.representation_delta === 0 && 'has-text-grey-lighter')}>${vote.representation_delta}</span>
        </td>
        ${user ? [`
          <td class="has-text-centered">
            <span class="responsive-label">${vote.current_user_vote_position ? 'You voted' : 'You did not vote'} </span>
            <span>${vote.current_user_vote_position || ''}</span>
          </td>
          <td style="white-space: nowrap;" class="has-text-centered responsive-inline-block">${
            vote.current_user_vote_delegate_name
              ? `
                <span class="responsive-label">${vote.current_user_vote_delegate_name ? 'Your vote was inherited from' : ''} </span>
                <span>${vote.current_user_vote_delegate_name || ''}</span>
                `
              : ''
          }</td>
        `] : []}
      </tr>
    `
  }
}

function formatBillTitle(short_id) {
  return short_id.slice(6).toUpperCase()
}
