const { APP_NAME, WWW_DOMAIN } = process.env
const { avatarURL, handleForm, html, linkifyUrls } = require('../helpers')
const endorsedVoteView = require('../views/endorsed-vote')
const signatureView = require('../views/signature')
const { icon } = require('@fortawesome/fontawesome-svg-core')
const { faUser } = require('@fortawesome/free-solid-svg-icons/faUser')
const { faPencilAlt } = require('@fortawesome/free-solid-svg-icons/faPencilAlt')
const { faHandshake } = require('@fortawesome/free-solid-svg-icons/faHandshake')

module.exports = (state, dispatch) => {
  const { location, proxied_name, profiles, user, votes } = state
  const p = profiles[location.params.username]

  return html`
    <section class="section">
      <div class="container is-widescreen">
        ${user && !user.phone_verified ?
          unverifiedNotification() : []
        }
        ${proxied_name ? html`
          <div class="notification is-info">
            Your proxy to ${proxied_name} has been saved.
          </div>
        ` : ''}
          <div class="columns is-centered">
            <div class="column is-two-thirds-tablet is-half-desktop has-text-centered">
              <div class="image is-64x64 is-inline-block">
                ${user && p.username && user.username === p.username
                  ? html`<a href="https://gravatar.com" target="_blank"><img src=${avatarURL(p)} alt="avatar" class="is-rounded"></a>`
                  : html`<img src=${avatarURL(p)} alt="avatar" class="is-rounded">`
                 }
              </div>
              <h1 class="title is-3">${p.name}</h1>
              ${p.username ? html`<h2 class="subtitle is-5 has-text-grey-light">@${p.username}</h2>` : ''}
              ${proxyButton(p, state, dispatch)}
              ${user && p.id === user.id ? editProfileButton() : html``}
              ${p.about ? aboutUser(p) : html``}
              <div class="has-text-left">
                ${(!p.about && !p.public_votes.length) || (p.public_votes && p.public_votes.length && !user)
                  ? emptyProfileExplainer(p) : html``}
                 <hr />
                 ${p.public_votes.length
                   ? publicVotes(p.public_votes.map((id) => votes[id]), state, dispatch) : ''}
                 ${!p.username ? ghostProfileMessage(p) : ''}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
}

const editProfileButton = () => {
  return html`
    <a class="button" href="/edit_profile">
      <span class="icon">${icon(faPencilAlt)}</span>
      <span>Edit Profile</span>
    </a>
  `
}

const ghostProfileMessage = (profile) => {
  return html`
    <div class="content">
      <p>
        Are you ${profile.name}? <a target="_blank" href="${`mailto:support@${WWW_DOMAIN}?subject=Claiming+twitter/${profile.twitter_username}&body=I will send twitter.com/Liquid_US a DM from @${profile.twitter_username}`}"><strong>Claim this profile</strong></a>.
      </p>
    </div>
  `
}

const emptyProfileExplainer = (profile) => {
  return html`
    <div class="content">
      <hr />
      <h3><strong>${APP_NAME}</strong> lets you pick anyone to represent you.</h3>
      <p>
        You can vote on any bill or petition, but most of us won't have time to do that.
        Proxy to ${profile.first_name} to vote for you whenever you don't vote directly yourself.
      </p>
      ${!profile.username ? html`
        <p>They haven't joined ${APP_NAME} yet, and will be sent <a href="https://twitter.com/liquid_notifs" target="_blank"><strong>a tweet</strong></a> for each new request.<br />
          When ${profile.first_name} signs up, they will immediately represent their proxiers.</p>
      ` : ''}
    </div>
  `
}

const videoIframeSrc = ({ intro_video_url }) => {
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

const aboutUser = (profile) => {
  const about_text = linkifyUrls(profile.about || '')
  const video_src = videoIframeSrc(profile)

  return html`
    <div style="margin-top: 1em;">
      ${video_src ? html`
        <div>
          <div class="responsive-video-wrapper">
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
          </style>
        </div>
      ` : ''}
      ${about_text ? html`
        <div class="${`content ${~about_text.indexOf(`<br /><br />`) ? 'has-text-left' : ''}`}">
          <p class="is-size-5">${{ html: about_text }}</p>
        </div>
      ` : ''}
    </div>
  `
}

const publicVotes = (votes, { user }, dispatch) => {
  return votes.map((vote) => {
    if (vote.measure.type === 'petition') {
      return signatureView({ showIcon: true, key: 'profile', displayTitle: true, vote, measure: vote.measure, user }, dispatch)
    }
    return endorsedVoteView({ showIcon: true, key: 'profile', vote, measure: vote.measure, user }, dispatch)
  })
}

const proxyButton = (profile, { user }, dispatch) => {
  const ownProfile = user && profile.id === user.id
  const proxied = profile.proxied
  return html`
    <form class="is-inline-block" onsubmit="${handleForm(dispatch, { type: 'proxy:addedProxyViaProfile', profile })}" method="POST">
      <div class="buttons has-addons is-centered is-marginless">
        <span class="button is-static">
          <span class="icon is-small">${icon(faHandshake)}</span>
          <span>${profile.max_vote_power || 1}</span>
        </span>
        ${ownProfile || proxied
          ? html`
              <a href="/proxies" class="button fix-bulma-centered-text is-outlined">
                ${proxied ? 'Proxied' : 'Vote Power'}
              </a>
            `
          : html`
              <button type="submit" class="button fix-bulma-centered-text is-outlined">
                Proxy to ${profile.first_name}
              </button>
          `}
      </div>
    </form>
  `
}

const unverifiedNotification = () => {
  return html`
    <div class="notification">
      <span class="icon">${icon(faUser)}</span> Want a profile page of your own? <a href="/get_started"><strong>Finish verification</strong></a> to start to build your voting power.
    </div>
  `
}
