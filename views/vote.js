const { WWW_URL } = process.env
const { avatarURL: getAvatarURL, handleForm, linkifyUrls, html } = require('../helpers')
const timeAgo = require('timeago.js')
const { icon } = require('@fortawesome/fontawesome-svg-core')
const { faPencilAlt } = require('@fortawesome/free-solid-svg-icons/faPencilAlt')
const { faStar } = require('@fortawesome/free-solid-svg-icons/faStar')
const { faStar: faStarOutline } = require('@fortawesome/free-regular-svg-icons/faStar')
const { faVoteYea } = require('@fortawesome/free-solid-svg-icons/faVoteYea')
const { faVoteNay } = require('@fortawesome/pro-solid-svg-icons/faVoteNay')
const { faBoxBallot } = require('@fortawesome/pro-solid-svg-icons/faBoxBallot')

module.exports = (state, dispatch) => {
  const { key, vote, parent, padded = true, displayTitle = false, user, showIcon = false, measures = {} } = state
  const measure = measures[vote.measure.short_id] || state.measure || vote.measure
  const {
    id, comment, endorsement, position, vote_power, public:
    is_public, source_url, updated_at, delegate_name, delegate_rank
  } = vote
  const avatarURL = getAvatarURL(vote.user)
  let measure_url = `${measure.type === 'nomination' ? '/nominations' : '/legislation'}/${measure.short_id}`
  if (measure.author) {
    measure_url = `/${measure.author.username}/${measure.short_id}`
  }
  const comment_url = `${measure_url}/votes/${id}`
  const share_url = `${WWW_URL}${comment_url}`
  const measure_title = measure.number ? `${measure.short_id.replace(/^[^-]+-/, '').toUpperCase()} — ${measure.title}` : measure.title

  return html`
    <div class="comment" style=${padded ? 'padding-bottom: 2em;' : ''}>
      <div class="media">
        <div class="media-left">
          ${showIcon
            ? html`
                <span class="icon has-text-grey">
                  ${icon(position === 'yea' ? faVoteYea : position === 'nay' ? faVoteNay : faBoxBallot)}
                </span>
              `
            : html`
              <div class="image is-32x32">
                ${vote.user && vote.user.public_profile
                  ? html`<a href="${`/${vote.user.username || `twitter/${vote.user.twitter_username}`}`}">
                      <img src="${avatarURL}" alt="avatar" class="is-rounded" />
                    </a>`
                  : html`<img src="${avatarURL}" alt="avatar" class="is-rounded" />`}
              </div>
            `}
        </div>
        <div class="media-content">
          <div>
            <span class="has-text-weight-semibold">
              ${!is_public && user && vote.user_id === user.id
                ? 'You'
                : vote.user
                  ? vote.user.public_profile
                    ? html`<a href="${`/${vote.user.username || `twitter/${vote.user.twitter_username}`}`}">${vote.user.first_name} ${vote.user.last_name}</a>`
                    : html`<span>${vote.user.first_name} ${vote.user.last_name}</span>`
                  : '[private]'}
            </span>
            ${html`<span>${delegate_name && delegate_rank !== -1 ? 'inherited' : 'voted'} <strong style="${`color: ${position === 'yea' ? 'hsl(141, 80%, 38%)' : (position === 'abstain' ? 'default' : 'hsl(348, 80%, 51%)')};`}">${position}</strong>${delegate_rank !== -1 ? ` vote from ${delegate_name}` : ''}${delegate_rank === -1 && vote_power > 1 && is_public ? html` on behalf of <span class="has-text-weight-semibold">${vote_power}</span> people` : ''}${is_public ? '' : ' privately'}</span>`}
            ${source_url ? html`<span class="is-size-7"> <a href="${source_url}" target="_blank">[source]</a></span>` : ''}
          </div>
          ${displayTitle ? html`<div><a class="has-text-weight-semibold" href="${measure_url}">${measure_title}</a></div>` : ''}
          ${commentContent(key, vote, parent, dispatch)}
          <div class="${`field is-grouped ${!is_public ? 'is-hidden' : ''}`}">
            <div class="control">
              <div class="field has-addons">
                <div class="control is-size-7">
                  <a title="${endorsement ? 'Endorsed' : 'Endorse'}" href="#" onclick=${(event) => dispatch({ type: endorsement ? 'vote:unendorsed' : 'vote:endorsed', measure, vote, event })} class="${`endorse-btn has-text-weight-semibold has-text-grey button is-small ${endorsement ? 'has-background-light' : ''}`}">
                    <span class="icon is-small">${icon(endorsement ? faStar : faStarOutline)}</span>
                    <span>${vote_power || 1}</span>
                  </a>
                </div>
                <div class="${`control is-size-7 ${endorsement ? '' : 'is-hidden'}`}">
                  <form class="select" onchange=${handleForm(dispatch, { type: 'vote:changedPrivacy', vote })}>
                    <select name="public" class="has-text-grey is-light">
                      <option selected=${endorsement && endorsement.public} value="true">Public${measure && measure.votePower ? ` (Vote Power: ${measure.votePower || 1})` : ''}</option>
                      <option selected=${endorsement && !endorsement.public} value="false">Private${measure && measure.votePower ? ` (Vote Power: 1)` : ''}</option>
                    </select>
                  </form>
                </div>
              </div>
            </div>
            <div class="control is-size-7">
              <a class="has-text-grey-light is-inline-flex" title="Permalink" href="${comment_url}">${timeAgo().format(`${updated_at}Z`)}</a>
              <span class="has-text-grey-light is-inline-flex">
                ${user && user.id === vote.user_id ? html`
                  <span class="has-text-grey-lighter">&bullet;</span>
                  <a href="${`${measure_url}#measure-vote-form`}" onclick=${(event) => dispatch({ type: 'measure:voteFormActivated', measure, event })} class="has-text-grey-light">
                    <span class="icon is-small">${icon(faPencilAlt)}</span>
                    <span>Edit</span>
                  </a>
                ` : ''}
                ${user && comment ? reportLink(key, vote, share_url, dispatch) : ''}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}

const truncateOnWord = (str, max = 300) => {
  const { length, truncated } = str.split(' ').reduce(({ length, truncated }, word) => {
    const newLength = length + word.length + 1
    if (newLength >= max) return { length: newLength, truncated }
    return { length: newLength, truncated: `${truncated} ${word}` }
  }, { length: 0, truncated: '' })

  const isTruncated = length >= max
  return { isTruncated, truncated: isTruncated ? `${truncated}...` : truncated }
}

const commentContent = (key, vote, parent, dispatch) => {
  const { expanded = false } = vote
  const comment = vote.comment || ''
  const { isTruncated: showExpander, truncated } = truncateOnWord(comment, 300)
  return html`
    <div class="content" style="margin-top: .5em;">
      ${{ html: linkifyUrls(expanded || !showExpander ? comment : truncated) }}
      <span class="${showExpander ? '' : 'is-hidden'}">
        <a href="#" onclick=${(event) => dispatch({ type: 'vote:toggledExpanded', event, vote: parent || vote })} class="is-size-7">
          <span>show ${expanded ? 'less' : 'more'}</span>
        </a>
      </span>
    </div>
  `
}

const reportLink = (key, vote, share_url, dispatch) => {
  const report_url = `${share_url}?action=report`
  return html`
    <span>
      <span class="has-text-grey-lighter">&bullet;</span>
      <a onclick="${(event) => dispatch({ type: 'vote:reported', vote, event })}" class="has-text-grey-light" href="${report_url}">${vote.reported ? 'Reported' : 'Report'}</a>
    </span>
  `
}
