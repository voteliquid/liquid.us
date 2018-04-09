const Component = require('./Component')

module.exports = class ProxyRequests extends Component {
  oninit() {
    const { user } = this.state

    if (!user) return this.location.redirect('/sign_in')

    if (!this.state.proxy_requests) {
      return this.api(`/delegation_requests_detailed?to_id=eq.${user.id}`)
      .then(proxy_requests => ({ proxy_requests }))
    }
  }
  render() {
    const { proxy_requests } = this.state

    let unresponded = []
    let approved = []
    let denied = []

    if (proxy_requests) {
      unresponded = proxy_requests.filter(dr => dr.approved === null)
      approved = proxy_requests.filter(dr => dr.approved)
      denied = proxy_requests.filter(dr => dr.approved === false)
    }

    return this.html`
      <section class="section">
      <div class="columns is-centered">
        <div class="column is-5">
          <h2 class="title is-5">Proxy Requests</h2>
          <div class="content">
            <p>Your votes are private by default. Before someone can proxy to you, you have to allow them to see how you vote.</p>
            <p>Feel free to <strong>Deny</strong> someone you don't recognize. Your public votes will still gain voting power from them, but they won't be able to see your (default) private votes.</p>
            <p>You can change permissions at any time, without notifying them.</p>
          </div>
          <h5 class="title is-6">Requests: (${unresponded.length})</h5>
          ${unresponded.length
            ? unresponded.map(u => RequestRow.for(this, u, `request-unresp-${u.id}`))
            : [`<p><em>Invite new people to proxy to you by sending them <a href="/get_started/profile"><strong>your profile link</strong></a>.</em></p>`]
          }
          <br />
          <h5 class="title is-6">Approved: (${approved.length})</h5>
          ${approved.length
            ? approved.map(u => RequestRow.for(this, u, `request-approved-${u.id}`))
            : [`<p>None</p>`]
          }
          <p></p>
          <br />
          <h5 class="title is-6">Denied: (${denied.length})</h5>
          ${denied.length
            ? denied.map(u => RequestRow.for(this, u, `request-denied-${u.id}`))
            : [`<p>None</p>`]
          }
          <br />
        </div>
      </div>
      </section>
    `
  }
}

class RequestRow extends Component {
  render() {
    const { approved, id, first_name, last_name, username, twitter_username } = this.props

    return this.html`
      <div class="field is-grouped">
      <div class="media">
        <div class="media-left">
          <div class="image is-32x32">
            ${username || twitter_username
            ? [`<a href="${username ? `/${username}` : `/twitter/${twitter_username}`}" target="_blank">
                <img src=${this.avatarURL(this.props)} />
              </a>`]
            : [`
              <img src=${this.avatarURL(this.props)} />
            `]}
          </div>
        </div>
        <div class="media-content">
          ${username || twitter_username
          ? [`<a href="${username ? `/${username}` : `/twitter/${twitter_username}`}" target="_blank">
              <span>${first_name} ${last_name}</span>
              <span class="has-text-grey is-size-7">@${username || twitter_username}</span>
            </a>`]
          : [`
            <span>${first_name} ${last_name}</span>
          `]}
        </div>
        <div class="media-right">
          ${approved !== true ? [ApproveBtn.for(this, this.props, `approvebtn-${id}`)] : []}
          ${approved !== false ? [DenyBtn.for(this, this.props, `denybtn-${id}`)] : []}
        </div>
      </div>
    `
  }
}

class ApproveBtn extends Component {
  onclick(event) {
    event.preventDefault()

    return this.api(`/delegation_requests?id=eq.${this.props.id}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' }, // returns created delegation in response
      body: JSON.stringify({
        approved: true,
      }),
    })
    .then(() => ({
      proxy_requests: this.state.proxy_requests.map((request) => {
        if (request.id === this.props.id) {
          request.approved = true
        }
        return request
      })
    }))
  }
  render() {
    return this.html`
      <div class="control">
        <button class="button is-small" onclick=${this}>
          <span class="icon has-text-grey"><i class="fa fa-check"></i></span>
          <span>Approve</span>
        </button>
      </div>
    `
  }
}

class DenyBtn extends Component {
  onclick(event) {
    event.preventDefault()

    return this.api(`/delegation_requests?id=eq.${this.props.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        approved: false,
      }),
    })
    .then(() => ({
      proxy_requests: this.state.proxy_requests.map((request) => {
        if (request.id === this.props.id) {
          request.approved = false
        }
        return request
      })
    }))
  }
  render() {
    return this.html`
      <div class="control">
        <button class="button is-small" onclick=${this}>
          <span class="icon has-text-grey"><i class="fa fa-times"></i></span>
          <span>Deny</span>
        </button>
      </div>
    `
  }
}
