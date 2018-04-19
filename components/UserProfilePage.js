const Component = require('./Component')
const timeAgo = require('from-now')

const ago_opts = {
  seconds: 's',
  minutes: 'min',
  hours: 'h',
  days: 'd',
  weeks: 'w',
  months: { 1: 'month', 2: 'months' },
  years: 'y',
}

module.exports = class UserProfilePage extends Component {
  render() {
    const { proxied_name, selected_profile, user } = this.state
    const { public_votes } = selected_profile

    return this.html`
      <section class="section">
        <div class="container">
          <div class="columns">
            <div class="column is-one-quarters">
              ${user && !user.cc_verified ?
                UnverifiedNotification.for(this) : []
              }
              ${user && selected_profile.username && user.username === selected_profile.username ?
                YourProfileNotification.for(this) : []
              }
              ${proxied_name ? [`
                <div class="notification is-info">
                  Your proxy to ${proxied_name} has been saved.
                </div>
              `] : []}
              <div class="columns is-variable is-7">
                <div class="column is-one-third">
                  <div class="media">
                    <div class="media-left">
                      <div class="image is-128x128">
                        ${user && selected_profile.username && user.username === selected_profile.username
                          ? [`<a href="https://gravatar.com" target="_blank"><img src=${this.avatarURL(selected_profile)} alt="avatar" class="avatar"></a>`]
                          : [`<img src=${this.avatarURL(selected_profile)} alt="avatar" class="avatar square-img">`]
                        }
                        <style>
                          .square-img {
                            height: 100% !important;
                            object-fit: cover;
                          }
                        </style>
                      </div>
                    </div>
                    <div class="media-content">
                      <h1 class="title is-3">${selected_profile.name}</h1>
                      ${selected_profile.username ? [`<h2 class="subtitle is-5 has-text-grey-light">@${selected_profile.username}</h2>`] : ''}
                      <h3 class="subtitle is-6"><span class="icon"><i class="fa fa-users"></i></span>Represents ${selected_profile.max_vote_power || 0} ${selected_profile.max_vote_power === 1 ? 'person' : 'people'}</h3>
                    </div>
                  </div>
                  <br />
                  ${user && selected_profile.username && user.username === selected_profile.username
                    ? [`
                      <link rel="stylesheet" href="/assets/bulma-tooltip.min.css">
                      <style>
                        .tooltip:hover::before {
                          background: #000 !important;
                        }
                        .tooltip:hover::after {
                          border-color: #000 transparent transparent transparent !important;
                        }
                        .fix-bulma-centered-text {
                          display: inline-block; /* https://github.com/jgthms/bulma/issues/913 */
                        }
                      </style>
                      <button disabled class="button is-info is-outlined is-fullwidth is-medium tooltip fix-bulma-centered-text" data-tooltip="You can't proxy to yourself">
                        <span class="icon is-small"><i class="fa fa-handshake-o"></i></span>
                        <span>Proxy</span>
                      </button>
                      `]
                    : ProxyButton.for(this)
                  }
                  ${public_votes && public_votes.length && !user ? [`
                    <div class="content is-size-7 has-text-left">
                      <br />
                      <p><strong>United.vote</strong> lets you vote on any bill before Congress, but most of us won't have time to do that.</p>
                      <p>Proxy to ${selected_profile.first_name} to vote for you whenever you don't vote directly yourself.</p>
                   </div>
                 `] : []}
                </div>
                <div class="column">
                    <div class="content">
                      ${public_votes && public_votes.length ?
                        ['<h3>Public Votes</h3>']
                        : [`
                          <h3><strong>United.vote</strong> lets you pick anyone to represent you.</h3>
                          <p>You can vote on any bill before Congress, but most of us won't have time to do that.</p>
                          <p>Proxy to ${selected_profile.first_name} to vote for you whenever you don't vote directly yourself.</p>
                          ${!selected_profile.username ? `
                            <p>They haven't joined United yet, and will be sent <a href="https://twitter.com/united_notifs" target="_blank"><strong>a tweet</strong></a> for each new request.<br />
                              When ${selected_profile.first_name} signs up, they will immediately represent their proxiers.</p>
                          ` : []}
                          <p><a target="_blank" href="https://blog.united.vote/2017/11/06/announcing-united-vote/"><strong>Learn more about how we're building a democracy we can trust</strong>.</a></p>
                          ${!selected_profile.username ?
                            `<hr />
                            Are you ${selected_profile.name}? <a target="_blank" href="mailto:support@united.vote?subject=Claiming+twitter/${selected_profile.twitter_username}&body=I will send twitter.com/united_vote a DM from @${selected_profile.twitter_username}"><strong>Claim this profile</strong></a>.
                            <br />` : []
                          }
                        `]}
                      </h3>
                    </div>
                    ${public_votes && public_votes.length
                    ? public_votes.map(public_vote => VoteCard.for(this, public_vote, `vote-card-${public_vote.id}`))
                    : ''}
                  </div>
              </div>
            </div>
        </div>
      </section>
    `
  }
}

class VoteCard extends Component {
  render() {
    const { comment, endorsements, position, updated_at, short_id, type, number, short_title } = this.props
    const { selected_profile } = this.state

    return this.html`
      <div class="card is-small">
        <div style="box-shadow: 0 1px 2px rgba(10,10,10,.1); padding: .75rem;">
          <div class="columns is-multiline">
            <div class="column">
              <span>${selected_profile.first_name} voted <strong>${position}</strong> on </span>
              <br />
              <span><a href="${`/legislation/${short_id}`}"><strong>${type.toUpperCase()} ${number}</strong>. ${short_title}</a></span>
            </div>
            <div class="column is-one-quarter has-text-right">
              ${ endorsements > 0 ? [`
                <span class="icon"><i class="fa fa-thumbs-o-up"></i></span>
                <span>${endorsements}</span>
                <span class="has-text-grey-light">&nbsp;&bullet;&nbsp;</span>
              `] : []}
              <span class="has-text-grey-light">${timeAgo(`${updated_at}Z`, ago_opts)} ago</span>
            </div>
          </div>
        </div>
        ${comment && [`<div class="card-content">${comment}</div>`]}
      </div>
      <br />
    `
  }
}

class ProxyButton extends Component {
  onsubmit(event) {
    event.preventDefault()

    const { selected_profile, user } = this.state

    // Redirect to /join if they're not logged in
    if (!user) {
      this.storage.set('proxying_user_id', selected_profile.user_id)
      return this.location.redirect('/join')
    }

    // Don't let them proxy to themselves
    if (!selected_profile.twitter_username && user && user.username === selected_profile.username) {
      return
    }

    if (!selected_profile.proxied) {
      return this.api('/delegations', {
        method: 'POST',
        headers: { Prefer: 'return=representation' }, // returns created delegation in response
        body: JSON.stringify({
          from_id: user.id,
          to_id: selected_profile.user_id,
          delegate_rank: 0,
        }),
      })
      .then(() => {
        selected_profile.max_vote_power += 1
        selected_profile.proxied = true
        return { selected_profile }
      })
      .catch((error) => {
        if (error.code === 'P0001') {
          this.storage.set('proxying_user_id', selected_profile.user_id)
          return this.location.redirect('/get_started/basics?notification=proxy_wo_name')
        }
      })
    }
    return this.api(`/delegations?id=eq.${selected_profile.proxied}`, {
      method: 'DELETE',
      headers: { Prefer: 'return=representation' }, // returns created delegation in response
    })
    .then(() => {
      selected_profile.max_vote_power -= 1
      selected_profile.proxied = false
      return { selected_profile }
    })
  }
  render() {
    const { selected_profile } = this.state
    const proxied = selected_profile.proxied
    return this.html`
      <form onsubmit=${this} action=${this} method="POST">
        <button disabled=${proxied} type="submit" class="${`button is-info is-medium is-fullwidth ${proxied ? '' : 'is-outlined'}`}" style="display: inline-block">&nbsp;<span class="icon is-small"><i class="fa fa-handshake-o"></i></span> <span>${proxied ? 'Proxied' : `Proxy to ${selected_profile.first_name}`}</span></button>
        ${proxied
          ? [`
              <div class="content is-size-7">
                <br />
                <p>You've proxied to ${selected_profile.name}. To unproxy or manage your proxies visit your <a href="/proxies">Proxies</a> page.</p>
              </div>
            `]
          : []
          }
      </form>
    `
  }
}

class UnverifiedNotification extends Component {
  render() {
    return this.html`
      <div class="notification">
        <span class="icon"><i class="fa fa-user"></i></span> Want a profile page of your own? <a href="/get_started"><strong>Finish verification</strong></a> to start to build your voting power.
      </div>
    `
  }
}

class YourProfileNotification extends Component {
  onclick(event) {
    event.preventDefault()
    return { isFeedbackWindowVisible: !this.state.isFeedbackWindowVisible }
  }
  render() {
    const { config, selected_profile } = this.state
    const { WWW_URL } = config

    return this.html`
      <div class="notification">
        <h4 class="title is-5">This is your profile page.</h4>
        <div class="content">
          <div class="columns">
            <div class="column">
              <p>
                <span class="icon"><i class="fa fa-users"></i></span> Share the URL <strong><a href="${`${WWW_URL}/${selected_profile.username}`}">united.vote/${selected_profile.username}</a></strong> with others to easily proxy to you.
              </p>
              <p>
                <span class="icon"><i class="fa fa-camera"></i></span> Change your photo by signing in to <a href="https://www.gravatar.com"><strong>Gravatar</strong></a> with your same email.
              </p>
            </div>
            <div class="column">
              <p>
                <span class="icon"><i class="fa fa-comment"></i></span> Check <em>Public</em> when you <a href="/legislation"><strong>vote</strong></a> to build your public voting record.
              </p>
              <p>
                <span class="icon"><i class="fa fa-envelope"></i></span> <a onclick=${this}><strong>Reach out</strong></a> if you'd like to change your username or display name.
              </p>
            </div>
          </div>
        </div>
      </div>
      <br />
    `
  }
}
