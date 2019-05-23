const { WWW_URL } = process.env
const { avatarURL: getAvatarURL, handleForm, linkifyUrls, html } = require('../helpers')
const timeAgo = require('timeago.js')
const stateNames = require('datasets-us-states-abbr-names')

module.exports = (state, dispatch) => {
  const { key, measure, vote, showBill, user } = state
  const {
    comment, author_username, endorsed, updated_at, fullname, id,
    number, proxy_vote_count, position, short_id, title, type,
    username, user_id, public: is_public, twitter_username,
    source_url, endorsement_public
  } = vote
  const avatarURL = getAvatarURL(vote)
  const measure_url = `${author_username ? `/${author_username}/` : '/'}${type === 'nomination' ? 'nominations' : 'legislation'}/${short_id}`
  const comment_url = `${measure_url}/votes/${id}`
  const share_url = `${WWW_URL}${comment_url}`
  const measure_title = number ? `${short_id.replace(/^[^-]+-/, '').toUpperCase()} — ${title}` : title
  const anonymousName = measure
    ? `${measure.legislature_name === 'U.S. Congress' ? 'American' : (stateNames[measure.legislature_name] || measure.legislature_name)} Resident`
    : 'Anonymous'
  let twitter_share_text = `Good argument! Click to show your support or explain why you disagree. ${share_url}`
  if (user && user.id === user_id) {
    twitter_share_text = `I'm voting ${position}. See why: ${share_url}`
  }
  const onBehalfOfCount = proxy_vote_count

  return html`
    <div class="comment" style="margin-bottom: 1.5em;">
      <div class="media">
        <div class="media-left">
          <div class="image is-32x32">
            ${username || twitter_username
              ? html`<a href="${`/${twitter_username ? `twitter/${twitter_username}` : username}`}">
                  <img src="${avatarURL}" alt="avatar" class="round-avatar-img" />
                </a>`
              : html`<img src="${avatarURL}" alt="avatar" class="round-avatar-img" />`}
          </div>
        </div>
        <div class="media-content" style="${`border-left: 1px solid ${position === 'yea' ? 'hsl(141, 71%, 87%)' : 'hsl(348, 100%, 93%)'}; margin-left: -2rem; padding-left: 2rem;`}">
          <div>
            <span class="has-text-weight-semibold">
              ${!is_public && user && user_id === user.id
                ? 'You'
                : username || twitter_username
                  ? html`<a href="${`/${twitter_username ? `twitter/${twitter_username}` : username}`}">${fullname}</a>`
                  : anonymousName}
            </span>
            ${html`<span>voted <strong style="${`color: ${position === 'yea' ? 'hsl(141, 80%, 38%)' : (position === 'abstain' ? 'default' : 'hsl(348, 80%, 51%)')};`}">${position}</strong>${onBehalfOfCount > 1 && is_public ? html` on behalf of <span class="has-text-weight-semibold">${onBehalfOfCount}</span> people` : ''}${is_public ? '' : ' privately'}</span>`}
            ${source_url ? html`<span class="is-size-7"> via <a href="${source_url}" target="_blank">${source_url.split('/')[2] || source_url}</a></span>` : ''}
          </div>
          ${showBill ? html`<div style="margin-bottom: .5rem;"><a href="${measure_url}">${measure_title}</a></div>` : ''}
          ${comment ? commentContent(key, vote, dispatch) : ''}
          <div class="${`${!is_public ? 'is-hidden' : ''} endorse-control is-size-7`}">
            <a href="#" onclick=${(event) => dispatch({ type: endorsed ? 'vote:unendorsed' : 'vote:endorsed', measure, vote, event })} class="${`endorse-btn has-text-weight-semibold has-text-grey button is-small ${endorsed ? 'is-light' : ''}`}">
              <span>${endorsed ? 'Backed' : 'Back this argument'}</span>
            </a>
            <form class="${`select ${endorsed ? '' : 'is-hidden'}`}" onchange=${handleForm(dispatch, { type: 'vote:changedPrivacy', vote })}>
              <select name="public" class="has-text-grey is-light">
                <option selected=${endorsement_public} value="true">Public${measure && measure.votePower ? ` (Vote Power: ${measure.votePower || 1})` : ''}</option>
                <option selected=${!endorsement_public} value="false">Private${measure && measure.votePower ? ` (Vote Power: 1)` : ''}</option>
              </select>
            </form>
          </div>
          <div class="is-size-7" style="position: relative; line-height: 25px; margin-top: 0.2rem;">
            <a class="has-text-grey-light" title="Permalink" href="${comment_url}">${timeAgo().format(`${updated_at}Z`)}</a>
            <span class="has-text-grey-light">
              ${user && user.id === user_id ? html`
                <span class="has-text-grey-lighter">&bullet;</span>
                <a href="${`${measure_url}#measure-vote-form`}" onclick=${(event) => dispatch({ type: 'measure:voteFormActivated', measure, event })} class="has-text-grey-light">
                  <span class="icon is-small"><i class="fas fa-pencil-alt"></i></span>
                  <span>Edit</span>
                </a>
              ` : ''}
              ${user && comment ? reportLink(key, vote, share_url, dispatch) : ''}
              ${is_public || !fullname ? html`
                <span class="has-text-grey-lighter">&bullet;</span>
                <a title="Share on Facebook" target="_blank" href="${`https://www.facebook.com/sharer/sharer.php?u=${share_url}`}" class="has-text-grey-light"><span class="icon is-small"><i class="fab fa-facebook"></i></span></a>
                <a target="_blank" title="Share on Twitter" href="${`https://twitter.com/intent/tweet?text=${twitter_share_text}`}" class="has-text-grey-light"><span class="icon is-small"><i class="fab fa-twitter"></i></span></a>
                <a target="_blank" title="Permalink" href="${share_url}" class="has-text-grey-light"><span class="icon is-small"><i class="fa fa-link"></i></span></a>
              ` : ''}
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

const commentContent = (key, vote, dispatch) => {
  const { expanded = false } = vote
  const comment = vote.comment || ''
  const { isTruncated: showExpander, truncated } = truncateOnWord(comment, 300)
  return html`
    <div class="content" style="margin: .25rem 0 .75rem;">
      ${{ html: linkifyUrls(expanded || !showExpander ? comment : truncated) }}
      <span class="${showExpander ? '' : 'is-hidden'}">
        <a href="#" onclick=${(event) => dispatch({ type: 'vote:toggledExpanded', event, vote })} class="is-size-7">
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
