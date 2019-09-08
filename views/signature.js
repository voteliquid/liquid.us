const { avatarURL: getAvatarURL, handleForm, linkifyUrls, html } = require('../helpers')
const timeAgo = require('timeago.js')
const { icon } = require('@fortawesome/fontawesome-svg-core')
const { faSignature } = require('@fortawesome/pro-solid-svg-icons/faSignature')

module.exports = (state, dispatch) => {
  const { key, displayTitle = false, vote, parent, user, showIcon = false } = state
  const {
    comment, measure, public: is_public, source_url, updated_at, delegate_rank, delegate_name
  } = vote
  const avatarURL = getAvatarURL(vote.user)
  const url = `${measure.author.username}/${measure.short_id}`
  const ownVote = user && user.id === vote.user_id

  return html`
    <div class="comment" style="margin-bottom: 1.5em;">
      <div class="media">
        <div class="media-left">
          ${showIcon
            ? html`
                <span class="icon has-text-grey">
                  ${icon(faSignature)}
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
                  : '[Private]'}
            </span>
            ${displayTitle ? html`
              <span>
                ${delegate_rank !== -1 && delegate_name ? `inherited petition signature from ${delegate_name}` : 'signed petition'}
                ${!vote.public ? ' privately' : ''}
              </span>
            ` : html``}
            ${source_url ? html`<span class="is-size-7"> <a href="${source_url}" target="_blank">[source]</a></span>` : ''}
          </div>
          ${displayTitle ? html`<div><a class="has-text-weight-semibold" href="${url}">${measure.title}</a></div>` : ''}
          ${comment ? commentContent(key, vote, parent, dispatch) : ''}
          <div class="is-size-7" style="${ownVote ? 'margin-top: .75em;' : ''}">
            ${ownVote ? html`
              <form class="select is-small" style="margin-right: .5em;" onchange=${handleForm(dispatch, { type: 'vote:changedPrivacy', vote })}>
                <select name="public" class="has-text-grey is-light">
                  <option selected=${vote && vote.public} value="true">Public${measure && measure.votePower ? ` (Vote Power: ${measure.votePower || 1})` : ''}</option>
                  <option selected=${vote && !vote.public} value="false">Private${measure && measure.votePower ? ` (Vote Power: 1)` : ''}</option>
                </select>
              </form>
            ` : html``}
            <span class="has-text-grey-light">${timeAgo().format(`${updated_at}Z`)}</span>
            <span class="has-text-grey-light">
              ${user && comment ? reportLink(key, vote, url, dispatch) : ''}
            </span>
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
    <div class="content is-marginless" style="margin-top: .5em;">
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
