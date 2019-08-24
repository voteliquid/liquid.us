const { avatarURL: getAvatarURL, linkifyUrls, html } = require('../helpers')
const timeAgo = require('timeago.js')
const stateNames = require('datasets-us-states-abbr-names')

module.exports = (state, dispatch) => {
  const { key, displayTitle = false, measure, vote, parent, user } = state
  const {
    comment, author_username, updated_at, fullname, short_id, user_id, public:
    is_public, twitter_username, source_url, username, title
  } = vote
  const avatarURL = getAvatarURL(vote)
  const url = `${author_username}/${short_id}`
  const anonymousName = measure
    ? `${measure.legislature_name === 'U.S. Congress' ? 'American' : (stateNames[measure.legislature_name] || measure.legislature_name)} Resident`
    : 'Anonymous'

  return html`
    <div class="comment" style="margin-bottom: 1.5em;">
      <div class="media">
        <div class="media-left">
          <div class="image is-32x32">
            ${username || twitter_username
              ? html`<a href="${`/${username || `twitter/${twitter_username}`}`}">
                  <img src="${avatarURL}" alt="avatar" class="round-avatar-img" />
                </a>`
              : html`<img src="${avatarURL}" alt="avatar" class="round-avatar-img" />`}
          </div>
        </div>
        <div class="media-content">
          <div>
            <span class="has-text-weight-semibold">
              ${!is_public && user && user_id === user.id
                ? 'You'
                : username || twitter_username
                  ? html`<a href="${`/${username || `twitter/${twitter_username}`}`}">${fullname}</a>`
                  : anonymousName}
            </span>
            ${displayTitle ? html`<span>signed the petition <a href="${url}">${title}</a></span>` : html``}
            ${source_url ? html`<span class="is-size-7"> <a href="${source_url}" target="_blank">[source]</a></span>` : ''}
          </div>
          ${comment ? commentContent(key, vote, parent, dispatch) : ''}
          <div class="is-size-7">
            <a class="has-text-grey-light">${timeAgo().format(`${updated_at}Z`)}</a>
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
    <div class="content is-marginless">
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
