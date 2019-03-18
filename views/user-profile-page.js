const { APP_NAME, WWW_DOMAIN } = process.env
const { avatarURL, handleForm, html, linkifyUrls } = require('../helpers')
const voteView = require('../views/vote')

module.exports = (state, dispatch) => {
  const { location, measures, proxied_name, profiles, user, votes } = state
  const p = profiles[location.params.username]

  return html`
    <section class="section">
      <div class="container is-widescreen">
        ${user && !user.verified ?
          unverifiedNotification() : []
        }
        ${proxied_name ? html`
          <div class="notification is-info">
            Your proxy to ${proxied_name} has been saved.
          </div>
        ` : ''}
        <div class="columns is-variable is-9">
          <div class="column is-one-third">
            <div class="columns is-mobile">
              <div class="column is-one-third is-one-quarter-mobile">
                <div class="image is-square">
                  ${user && p.username && user.username === p.username
                    ? html`<a href="https://gravatar.com" target="_blank"><img src=${avatarURL(p)} alt="avatar" class="round-avatar-img"></a>`
                    : html`<img src=${avatarURL(p)} alt="avatar" class="round-avatar-img">`
                  }
                </div>
              </div>
              <div class="column">
                <h1 class="title is-3">${p.name}</h1>
                ${p.username ? html`<h2 class="subtitle is-5 has-text-grey-light">@${p.username}</h2>` : ''}
              </div>
            </div>
            <div class="columns is-size-5 has-text-centered is-mobile icon-card">
              <div class="column icon-tooltip">
                <p>${p.public_votes.length}</p>
                ${iconTooltipButtonFa('check', `Votes`)}
                <br />
              </div>
              <div class="column icon-tooltip">
                <p>${commentCount(p.public_votes)}</p>
                ${iconTooltipButtonFa('comment', 'Comments', true)}
                <br />
              </div>
              <div class="column icon-tooltip">
                <p>${p.proposedMeasureCount || 0}</p>
                ${iconTooltipButtonFa('file', 'Proposals', true)}
                <br />
              </div>
              <div class="column icon-tooltip">
                <p>${p.direct_proxy_count || '1'}</p>
                ${iconTooltipButtonFa('handshake', `Voters directly represented`, true)}
              </div>
              <div class="column icon-tooltip">
                <p>${p.max_vote_power || '1'}</p>
                ${iconTooltipButtonFa('users', `Voters indirectly represented`)}
              </div>
            </div>
            <style>
              .icon-tooltip {
                position: relative;
              }
              .icon-tooltip .icon-tooltip-content {
                display: none;
                position: absolute;
                max-height: 222px;
              }
              .icon-tooltip:hover .icon-tooltip-content {
                display: block;
                background: hsl(0, 0%, 100%) !important;
                box-shadow: 0px 4px 15px hsla(0, 0%, 0%, 0.15);
                border: 1px solid hsl(0, 0%, 87%);
                color: #333;
                font-size: 14px;
                overflow: hidden;
                padding: .4rem;
                text-align: center;
                white-space: normal;
                width: 90px;
                z-index: 99999;
                top: auto;
                bottom: 0%;
                left: 0%;
                right: 0%;
                transform: translate(-0.5rem, 50%);
              }
              @media (max-width: 1086px) {
                .icon-card {
                  padding: 0rem 0.6rem;
                }
              }
            </style>
            <link rel="stylesheet" href="/assets/bulma-tooltip.min.css" type="text/css" />
            ${user && p.username && user.username === p.username
              ? html`
                  <a href="/edit_profile" class="button is-link is-outlined is-fullwidth is-medium tooltip is-tooltip-info fix-bulma-centered-text" data-tooltip="Add a bio, video, or picture">
                    <span class="icon is-small"><i class="far fa-user-circle"></i></span>
                    <span>Edit Profile</span>
                  </a>
                `
              : proxyButton(p, dispatch)
            }
            ${p.public_votes && p.public_votes.length && !user ? html`
              <div class="content is-size-7 has-text-left">
                <br />
                <p><strong>${APP_NAME}</strong> lets you vote on any legislative bill, but most of us won't have time to do that.</p>
                <p>Proxy to ${p.first_name} to vote for you whenever you don't vote directly yourself.</p>
             </div>
           ` : ''}
          </div>
          <div class="column">
            ${(!p.about && !p.public_votes.length)
              ? emptyProfileExplainer(p) : ''}
            ${p.about
              ? aboutUser(p) : ''}
            ${p.public_votes.length
              ? publicVotes(p.public_votes.map((id) => votes[id]), measures, user, dispatch) : ''}
            ${!p.username
              ? ghostProfileMessage(p) : ''}
          </div>
        </div>
      </div>
    </section>
  `
}

const ghostProfileMessage = (profile) => {
  return html`
    <div class="content">
      <p>
        Are you ${profile.name}? <a target="_blank" href="${`mailto:support@${WWW_DOMAIN}?subject=Claiming+twitter/${profile.twitter_username}&body=I will send twitter.com/VoteLiquid a DM from @${profile.twitter_username}`}"><strong>Claim this profile</strong></a>.
      </p>
    </div>
  `
}

const emptyProfileExplainer = (profile) => {
  return html`
    <div class="content">
      <h3><strong>${APP_NAME}</strong> lets you pick anyone to represent you.</h3>
      <p>You can vote on any legislative bill, but most of us won't have time to do that.</p>
      <p>Proxy to ${profile.first_name} to vote for you whenever you don't vote directly yourself.</p>
      ${!profile.username ? html`
        <p>They haven't joined ${APP_NAME} yet, and will be sent <a href="https://twitter.com/liquid_notifs" target="_blank"><strong>a tweet</strong></a> for each new request.<br />
          When ${profile.first_name} signs up, they will immediately represent their proxiers.</p>
      ` : ''}
      <p><a target="_blank" href="${`https://blog.${WWW_DOMAIN}/2017/11/06/announcing-united-vote/`}"><strong>Learn more about how we're building a democracy we can trust</strong>.</a></p>
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
    <div>
    ${video_src
      ? html`
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
      `
      : ''}
    ${about_text ? html`<div class="content"><p class="is-size-5">${{ html: about_text }}</p></div>` : ''}
    <br />
    </div>
  `
}

const publicVotes = (votes, measures, user, dispatch) => {
  return html`
    <div>
      <style>
        .comment {
          border-bottom: 1px solid #eee;
          margin-bottom: 1rem !important;
          padding-bottom: 1rem;
        }
      </style>
      ${votes.map((vote) => voteView({ show_bill: true, key: 'profile', vote, measure: measures[vote.short_id], user }, dispatch))}
    </div>
  `
}

const proxyButton = (profile, dispatch) => {
  const proxied = profile.proxied
  return html`
    <form onsubmit="${handleForm(dispatch, { type: 'proxy:addedProxyViaProfile', profile })}" method="POST">
      <button disabled=${proxied} type="submit" class="${`button is-link is-medium is-fullwidth fix-bulma-centered-text ${proxied ? '' : 'is-outlined'}`}">&nbsp;<span class="icon is-small"><i class="far fa-handshake"></i></span> <span>${proxied ? 'Proxied' : `Proxy to ${profile.first_name}`}</span></button>
      ${proxied
        ? html`
            <div class="content is-size-7">
              <br />
              <p>You've proxied to ${profile.name}. To unproxy or manage your proxies visit your <a href="/proxies">Proxies</a> page.</p>
            </div>
          `
        : []
        }
    </form>
  `
}

const unverifiedNotification = () => {
  return html`
    <div class="notification">
      <span class="icon"><i class="fa fa-user"></i></span> Want a profile page of your own? <a href="/get_started"><strong>Finish verification</strong></a> to start to build your voting power.
    </div>
  `
}

const iconTooltipButtonFa = (icon, text, far) => html`
  <span class="icon has-text-link">
    <i class="${`fa${far ? 'r' : ''} fa-${icon}`}"></i>
    <span class="icon-tooltip-content">${text}</span>
  </span>
`

const commentCount = (votes) => votes.filter(({ comment }) => comment).length
