const { APP_NAME, WWW_DOMAIN } = process.env
const { handleForm, html } = require('../helpers')

module.exports = ({ error, loading, location, user }, dispatch) => {
  return html`
    <section class="section">
      <div class="container is-widescreen">
        <div class="content" style="max-width: 650px;">
          ${location.query.notification === 'proxy_wo_name' ? html`
            <div class="notification is-info">You must set your first and last name before proxying.</div>
          ` : ''}
          ${error ? html`
            <div class="notification is-warning">${error.message}</div>
          ` : ''}
          <h2 class="subtitle">Welcome.</h2>
          <h3 class="subtitle is-5">
            Help us locate your elected representatives:
          </h3>
          <form method="POST" onsubmit=${handleForm(dispatch, { type: 'onboard:savedBasicInfo' })}>
            <div class="field">
              <label class="label">Your Name:</label>
              <div class="control has-icons-left">
                <input name="name" autocomplete="off" class=${`input ${error && error.name && 'is-danger'}`} placeholder="John Doe" required value="${[user.first_name, user.last_name].filter(a => a).join(' ')}" />
                ${error && error.name
                  ? html`<span class="icon is-small is-left"><i class="fas fa-exclamation-triangle"></i></span>`
                  : html`<span class="icon is-small is-left"><i class="fa fa-user"></i></span>`
                }
                ${error && error.name ? html`<p class="help is-danger">${error.message}</p>` : ''}
              </div>
            </div>
            <div class="field">
              <label class="label">Your Address:</label>
              <div class="control has-icons-left">
                <input onconnected=${initAutocomplete} class=${`input ${error && error.address && 'is-danger'}`} autocomplete="off" name="address" id="address_autocomplete" required placeholder="185 Berry Street, San Francisco, CA 94121" value="${user.address ? user.address.address : ''}" />
                ${error && error.address
                  ? html`<span class="icon is-small is-left"><i class="fa fas fa-exclamation-triangle"></i></span>`
                  : html`<span class="icon is-small is-left"><i class="fa fa-map-marker-alt"></i></span>`
                }
                ${error && error.address ? html`<p class="help is-danger">${error.message}</p>` : ''}
              </div>
            </div>
            <div class="field">
              <label class="label">Are you registered to vote at this address?</label>
              <div class="control">
                <div class="select">
                  <select name="voter_status" required>
                    <option>Pick one</option>
                    <option value="Registered" selected=${user.voter_status === 'Registered'}>Registered to vote</option>
                    <option value="Eligible" selected=${user.voter_status === 'Eligible'}>Not registered to vote</option>
                    <option value="Ineligible" selected=${user.voter_status === 'Ineligible'}>Not eligible to vote</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="field">
              <div class="control">
                <button class="${`button is-primary ${loading.user ? 'is-loading' : ''}`}" disabled=${!!loading.user} type="submit">Next</button>
              </div>
            </div>
            <p class="help is-small has-text-grey">All of your information is kept strictly private.</p>
            <div class="expandable">
              <a onclick=${expand} href="#" class="is-size-7">Not in the US?</a>
              <p>As Americans, we're focused on our own democracy first, but we've heard many international requests to bring ${APP_NAME} to other countries.</p>
              <p>We want to make this much easier in the future.</p>
              <p>Write to us at <a href="${`mailto:international@${WWW_DOMAIN}`}" >international@${WWW_DOMAIN}</a> and tell us where you're from. We'd love to hear from you.</p>
              <p />
            </div>
            <style>
              .expandable { list-style: none; }
              .expandable > a::after {
                content: '➤';
                font-size: 70%;
                position: relative;
                left: 6px;
                bottom: 2px;
              }
              .expandable.is-expanded > a::after { content: '▼'; }
              .expandable p, .expandable div, .expandable hr { display: none; }
              .expandable.is-expanded p, .expandable.is-expanded div, .expandable.is-expanded hr { display: block; }
            </style>
          </form>
        </div>
      </div>
    </section>
  `
}

const initAutocomplete = (event) => {
  if (window.initGoogleAddressAutocomplete) {
    window.initGoogleAddressAutocomplete(event.currentTarget.getAttribute('id'))
  }
}

function expand(event) {
  event.preventDefault()
  const target = event.currentTarget.parentNode
  if (target.className === 'expandable is-expanded') target.className = 'expandable'
  else if (target.className === 'expandable') target.className = 'expandable is-expanded'
}
