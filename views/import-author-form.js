const { APP_NAME } = process.env
const { avatarURL, handleForm, html } = require('../helpers')
const { icon } = require('@fortawesome/fontawesome-svg-core')
const { faUser } = require('@fortawesome/free-solid-svg-icons/faUser')
const { faLink } = require('@fortawesome/free-solid-svg-icons/faLink')
const { faTwitter } = require('@fortawesome/free-brands-svg-icons/faTwitter')
const { faExclamationTriangle } = require('@fortawesome/free-solid-svg-icons/faExclamationTriangle')
const { faEdit } = require('@fortawesome/free-solid-svg-icons/faEdit')
const { faEnvelope } = require('@fortawesome/free-solid-svg-icons/faEnvelope')
const { faPlus } = require('@fortawesome/free-solid-svg-icons/faPlus')

module.exports = (state, dispatch) => {
  const { location } = state
  const tab = location.query.tab || 'search'
  const path = location.path

  return html`
    <div>
      <div class="tabs">
        <ul>
          <li class=${tab === 'search' ? 'is-active' : ''}><a href=${`${path}?tab=search`}>Search Liquid Profiles</a></li>
          <li class=${tab === 'email' ? 'is-active' : ''}><a href=${`${path}?tab=email`}>Add by Email</a></li>
          <li class=${tab === 'twitter' ? 'is-active' : ''}><a href=${`${path}?tab=twitter`}>Add by Twitter</a></li>
        </ul>
      </div>
      ${tab === 'email' ? addAuthorByEmailForm(state, dispatch) : []}
      ${tab === 'twitter' ? addAuthorByTwitterForm() : []}
      ${tab === 'search' ? addAuthorBySearchForm(state, dispatch) : []}
    </div>
  `
}

const addAuthorByEmailForm = (state) => {
  const { error } = state

  return html`
      <div class="field is-horizontal">
        <div class="field-body">
          <div class="field">
            <div class="control has-icons-left">
              <input name="add_author[name]" required class="input" placeholder="First and Last Name" />
              <span class="icon is-small is-left">${icon(faUser)}</span>
            </div>
          </div>
          <div class="field">
            <div class="control has-icons-left">
              <input autocomplete="off" name="add_author[image_url]" class="input" type="text" placeholder="Profile image link" />
              <span class="icon is-small is-left">${icon(faLink)}</span>
            </div>
          </div>
          <div class="field">
            <div class="control has-icons-left">
              <input autocomplete="off" name="add_author[email]" class=${`input ${error && error.email ? 'is-danger' : ''}`} type="text" required placeholder="Email" />
              ${error && error.email
                ? html`<span class="icon is-small is-left">${icon(faExclamationTriangle)}</span>`
                : html`<span class="icon is-small is-left">${icon(faEnvelope)}</span>`
              }
              ${error && error.email ? html`<p class="help is-danger">${error.message}</p>` : ''}
            </div>
          </div>
        </div>
      </div>
      <p class="is-size-7">They'll be sent a <strong>notification email</strong>.</p>
  `
}

const addAuthorByTwitterForm = () => {
  return html`
      <div class="field">
        <div class="control has-icons-left">
          <input name="twitter_username" required class="input" placeholder="@username" />
            <span class="icon is-small is-left">${icon(faTwitter)}</span>
        </div>
      </div>
      <p class="is-size-7">They'll be sent an <a href="https://twitter.com/liquid_notifs" target="_blank"><strong>invitation tweet</strong></a>.</p>
  `
}

const addAuthorBySearchForm = (state, dispatch) => {
  const { error, loading, cookies, authorSearchResults = [], authorSearchTerms } = state

  return html`
    <script>
      var autoSubmitAuthorSearchTimeout;
      function autoSubmitAuthorSearch(event) {
        if (autoSubmitAuthorSearchTimeout) {
          clearTimeout(autoSubmitAuthorSearchTimeout);
        }
        autoSubmitAuthorSearchTimeout = setTimeout(function () {
          var el = document.getElementById('search_author_submit');
          if (el) el.click();
        }, 750);
      }
    </script>
    <form method="POST" onsubmit=${handleForm(dispatch, { type: 'import:authorSearched' })}>
      <label for="add_author[search]" class="label has-text-weight-normal">Search for author among public ${APP_NAME} profiles:</label>
      <div class="field has-addons">
        <div class="${`control is-expanded has-icons-left ${loading.authorSearch ? 'is-loading' : ''}`}">
          <input autocomplete="off" onkeypress="autoSubmitAuthorSearch()" name="add_author[search]" class=${`input ${error && error.email ? 'is-danger' : ''}`} type="text" placeholder="Name or @username'}" />
          ${error && error.message
            ? html`<span class="icon is-small is-left">${icon(faExclamationTriangle)}</span>`
            : html`<span class="icon is-small is-left">${icon(faUser)}</span>`
          }
          ${error && error.message ? html`<p class="help is-danger">${error.message}</p>` : ''}
        </div>
        <div class="control">
          <button id="search_author_submit" type="submit" class="button">
            <span>Search</span>
          </button>
        </div>
      </div>
    </form>
    <br />
    <div>
      ${authorSearchTerms && !authorSearchResults.length ? html`<p>No results for "<strong>${authorSearchTerms}</strong>"</p>` : ''}
      ${authorSearchResults.map(result => searchResult(cookies, result, dispatch))}
      ${authorSearchTerms ? html`<br /><p class="notification has-text-grey">Can't find who you're looking for?<br />Add them by <a href="?tab=email">email</a> or <a href="?tab=twitter">Twitter username</a>.</p>` : ''}
    </div>
  `
}

const searchResult = (cookies, result, dispatch) => {
  const { first_name, id, last_name, username, twitter_username } = result

  return html`
    <div class="media">
      <div class="media-left">
        <div class="image is-32x32">
          ${username || twitter_username
          ? html`
            <a href="${username ? `/${username}` : `/twitter/${twitter_username}`}" target="_blank">
              <img src=${avatarURL(result)} class="is-rounded" />
            </a>
          ` : html`
            <img src=${avatarURL(result)} class="is-rounded" />
          `}
        </div>
      </div>
      <div class="media-content">
        <a href="${username ? `/${username}` : `/twitter/${twitter_username}`}" target="_blank">
          <span>${first_name} ${last_name}</span>
          <span class="has-text-grey is-size-7">@${username || twitter_username}</span>
        </a>
      </div>
      <div class="media-right">
        ${cookies.author_id && cookies.author_id === id
        ? searchResultAdded({ id }, dispatch) : searchResultAdd(id, username, twitter_username, dispatch)}
      </div>
    </div>
  `
}

const searchResultAdd = (id, username, twitter_username, dispatch) => {
  return html`
    <form method="POST" onsubmit=${handleForm(dispatch, { type: 'import:addedAuthorViaSearch' })}>
      <input name="author_id" type="hidden" value="${id}" />
      <input name="author_username" type="hidden" value="${username || twitter_username}" />
      <button class="button is-outline is-small" type="submit">
        <span class="icon">${icon(faPlus)}</span>
        <span>Select author</span>
      </button>
    </form>
  `
}

const searchResultAdded = ({ id }) => {
  return html`
    <form style="display: inline;" method="POST">
      <input name="add_proxy[to_id]" type="hidden" value="${id}" />
      <button class="button is-small" disabled type="submit">
        <span class="icon">${icon(faEdit)}</span>
        <span>Current author</span>
      </button>
    </form>
  `
}
