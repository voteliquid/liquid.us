const Component = require('./Component')
const Comment = require('./Comment')

module.exports = class UserProfilePage extends Component {
  render() {
    const { config, proxied_name, selected_profile, user } = this.state
    const { public_votes } = selected_profile

    return this.html`
      <section class="section">
        <div class="container">
          <nav class="breadcrumb has-succeeds-separator is-left is-small" aria-label="breadcrumbs">
            <ul>
              <li><a class="has-text-grey" href="/">${config.APP_NAME}</a></li>
              <li><a class="has-text-grey" href="/proxies">Proxies</a></li>
              <li class="is-active"><a class="has-text-grey" href="#" aria-current="page">${selected_profile.name}</a></li>
            </ul>
          </nav>
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
          <div class="columns is-variable is-9">
            <div class="column is-one-third">
              <div class="columns is-mobile">
                <div class="column is-one-quarter-mobile">
                  <div class="image is-square">
                    ${user && selected_profile.username && user.username === selected_profile.username
                      ? [`<a href="https://gravatar.com" target="_blank"><img src=${this.avatarURL(selected_profile)} alt="avatar" class="round-avatar-img"></a>`]
                      : [`<img src=${this.avatarURL(selected_profile)} alt="avatar" class="round-avatar-img">`]
                    }
                  </div>
                </div>
                <div class="column">
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
                  <p><strong>United.vote</strong> lets you vote on any legislative bill, but most of us won't have time to do that.</p>
                  <p>Proxy to ${selected_profile.first_name} to vote for you whenever you don't vote directly yourself.</p>
               </div>
             `] : []}
            </div>
            <div class="column">
              ${(!selected_profile.about && !public_votes.length)
                ? EmptyProfileExplainer.for(this) : ''}
              ${selected_profile.about
                ? AboutUser.for(this) : ''}
              ${public_votes.length
                ? PublicVotes.for(this) : ''}
              ${!selected_profile.username
                ? GhostProfileMessage.for(this) : ''}
            </div>
          </div>
        </div>
      </section>
    `
  }
}

class GhostProfileMessage extends Component {
  render() {
    const { selected_profile } = this.state
    return this.html`
      <div class="content">
        <p>
          Are you ${selected_profile.name}? <a target="_blank" href="${`mailto:support@united.vote?subject=Claiming+twitter/${selected_profile.twitter_username}&body=I will send twitter.com/united_vote a DM from @${selected_profile.twitter_username}`}"><strong>Claim this profile</strong></a>.
        </p>
      </div>
    `
  }
}

class EmptyProfileExplainer extends Component {
  render() {
    const { selected_profile } = this.state
    return this.html`
      <div class="content">
        <h3><strong>United.vote</strong> lets you pick anyone to represent you.</h3>
        <p>You can vote on any legislative bill, but most of us won't have time to do that.</p>
        <p>Proxy to ${selected_profile.first_name} to vote for you whenever you don't vote directly yourself.</p>
        ${[!selected_profile.username ? `
          <p>They haven't joined United yet, and will be sent <a href="https://twitter.com/united_notifs" target="_blank"><strong>a tweet</strong></a> for each new request.<br />
            When ${selected_profile.first_name} signs up, they will immediately represent their proxiers.</p>
        ` : '']}
        <p><a target="_blank" href="https://blog.united.vote/2017/11/06/announcing-united-vote/"><strong>Learn more about how we're building a democracy we can trust</strong>.</a></p>
      </div>
    `
  }
}

class AboutUser extends Component {
  videoIframeSrc() {
    const { intro_video_url } = this.state.selected_profile
    const video_match = (intro_video_url || '').match(/(http:|https:|)\/\/(player.|www.)?(vimeo\.com|youtu(be\.com|\.be|be\.googleapis\.com))\/(video\/|embed\/|watch\?v=|v\/)?([A-Za-z0-9._%-]*)(&\S+)?/)
    let src = ''
    if (video_match) {
      if (video_match[3].slice(0, 5) === 'youtu') {
        src = `https://www.youtube.com/embed/${video_match[6]}`
      } else {
        src = `https://player.vimeo.com/video/${video_match[6]}`
      }
    }
    return src
  }
  render() {
    const about_text = this.linkifyUrls(this.state.selected_profile.about || '')
    const video_src = this.videoIframeSrc()

    return this.html`
      ${[video_src
        ? `<div class="responsive-video-wrapper">
            <iframe width="560" height="315" src="${video_src}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
          </div>
          <br />
          <style>
            .responsive-video-wrapper {
              position: relative;
              padding-bottom: 56.25%; /* 16:9 */
              height: 0;
            }
            .responsive-video-wrapper iframe {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
            }
          </style>`
        : '']}
      ${[about_text ? `<div class="content"><p class="is-size-5">${about_text}</p></div>` : '']}
      <br />
    `
  }
}

class PublicVotes extends Component {
  render() {
    const { selected_profile } = this.state
    const { public_votes } = selected_profile

    return this.html`
      ${public_votes.map(public_vote => Comment.for(this, { show_bill: true, ...public_vote, endorsements: false }, `vote-card-${public_vote.id}`))}
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
  render() {
    const { config, selected_profile } = this.state
    const { WWW_URL } = config

    return this.html`
      <div class="notification">
        <h4 class="title is-5">This is your profile page.</h4>
        <div class="columns is-multiline">
          <div class="column is-half">
            <span class="icon"><i class="fa fa-users"></i></span> Share the URL <strong><a href="${`${WWW_URL}/${selected_profile.username}`}">united.vote/${selected_profile.username}</a></strong> with others to easily proxy to you.
          </div>
          <div class="column is-half">
            <span class="icon"><i class="fa fa-camera"></i></span> Change your photo by signing in to <a href="https://www.gravatar.com"><strong>Gravatar</strong></a> with your same email.
          </div>
          <div class="column is-half">
            <span class="icon"><i class="fa fa-pencil-square-o"></i></span> Check <em>Public</em> when you <a href="/legislation"><strong>vote</strong></a> to build your public voting record.
          </div>
          <div class="column is-half">
            <span class="icon"><i class="fa fa-user-circle-o"></i></span> <a href="/edit_profile"><strong>Edit Profile</strong></a> to add an intro video or bio to your page.
          </div>
        </div>
      </div>
      <br />
    `
  }
}
