const Component = require('./Component')
const fetch = require('isomorphic-fetch')
const GoogleAddressAutocompleteScript = require('./GoogleAddressAutocompleteScript')
const ordinalSuffix = require('ordinal-suffix')

module.exports = class YourLegislators extends Component {
  oninit() {
    return this.fetchElectedLegislators()
  }
  fetchElectedLegislators() {
    const { config, reps, user } = this.state
    const { NODE_ENV } = config

    if (reps) return

    const address = user && user.address

    if (address) {
      return this.api('/rpc/user_offices', {
        method: 'POST',
        body: JSON.stringify({ user_id: user.id }),
      })
      .then(reps => ({ reps, reps_loaded: true }))
    }

    let ip = this.location.ip || ''

    if (ip === '::1' && NODE_ENV !== 'production') ip = '198.27.235.190'

    // https://freegeoip.net 15,000 req per hour
    return fetch(`https://freegeoip.net/json/${ip}`, {
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-cache',
      mode: 'no-cors',
    })
    .then(response => response.json())
    .then((geoip) => {
      if (!geoip) return { reps: [], reps_loaded: true }
      return this.api('/rpc/point_to_offices', {
        method: 'POST',
        body: JSON.stringify({ lon: Number(geoip.longitude), lat: Number(geoip.latitude) }),
      })
      .then(reps => {
        if (!reps) reps = []
        this.storage.set('geoip_house_rep', reps[0] ? reps[0].user_id : 'not_found')
        return { reps, reps_loaded: true, geoip }
      })
    })
    .catch((error) => {
      console.error(error)
      return { reps: [], reps_loaded: true }
    })
  }
  render() {
    const { config, geoip, reps = [], reps_loaded, user } = this.state
    const { APP_NAME } = config

    return this.html`
      <div class="YourLegislators">
        <h2 class="title is-5">Your Elected Congress Members</h2>
        ${geoip && reps.length ? RepsList.for(this) : []}
        ${(reps_loaded && !reps.length) ? [`<div class="notification">We weren't able to detect your elected congress members using your location. <a href="/join">Join ${APP_NAME}</a> to set your address.</div>`] : []}
        <div class="columns">
          ${reps.map(rep => RepColumn.for(this, { rep }, `repcolumn-${rep.user_id}`))}
        </div>
        ${user && user.address && [`
          <div class="has-text-right has-text-grey is-size-7">
            <br />
            <p>Based on your address of <strong>${user.address.address}</strong>. <a href="/change_address?from=${this.location.path}">Change</a>
          </div>
        `]}
      </div>
    `
  }
}

class RepsList extends Component {
  render() {
    const { user } = this.state
    return this.html`
      ${user ? (user.address ? [] : AuthedAddressNotification.for(this)) : AnonAddressNotification.for(this)}
    `
  }
}

class RepColumn extends Component {
  render() {
    const { rep } = this.props
    return this.html`
      <div class="column">${RepCard.for(this, { rep }, `repcard-${rep.user_id}`)}</div>
    `
  }
}

class RepCard extends Component {
  render() {
    const { IMAGES_URL } = this.state.config
    const { rep } = this.props
    return this.html`
      <div class="media">
        <figure class="media-left">
          <p class="image is-96x96">
            <a href=${`/${rep.username}`}>
              <img src=${`${IMAGES_URL}/${rep.picture_id}`}>
            </a>
          </p>
        </figure>
        <div class="media-content">
          <style>
            .space-between {
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              min-height: 120px;
            }
          </style>
          <div class="content space-between">
            <p class="is-small">
              <a href=${`/${rep.username}`}>
                <strong>${rep.first_name} ${rep.last_name}</strong> <small>@${rep.twitter_username}</small>
              </a>
              <br />
              <span class="is-size-6">${rep.office_name}</span>
            </p>
            <p>
              <span class="tag is-size-6 is-dark has-text-weight-bold">${rep.score_grade || [`<span class="icon"><i class="fa fa-question"></i></span>`]}</span>
              <span class="is-size-7 has-text-grey">
                ${rep.score_grade ?
                  `${ordinalSuffix(rep.score_percentile)} percentile among ${rep.office_chamber} ${rep.party_affiliation}s` :
                  `Need more constituent votes to calculate grade`}
              </span>
            </p>
          </div>
        </div>
      </div>
    `
  }
}

class AnonAddressNotification extends Component {
  render() {
    const { config, geoip } = this.state
    const { APP_NAME } = config
    return this.html`
      <div class="notification">
        We selected your reps by guessing your location in <strong>${geoip.city}, ${geoip.region_code}.</strong> But this is only right about half the time. <strong><a href="/join">Join ${APP_NAME}</a></strong> to set your address.
      </div>
    `
  }
}

class AuthedAddressNotification extends Component {
  render() {
    const { geoip } = this.state
    return this.html`
      <div class="notification content">
        <p>We selected your reps by guessing your location in <strong>${geoip.city}, ${geoip.region_code}</strong>. But this is only right about half the time. Fix it by entering your address.</p>
        <div class="columns">
          <div class="column is-half">
            ${AddressAutocompleteForm.for(this)}
          </div>
        </div>
      </div>
    `
  }
}

class AddressAutocompleteForm extends Component {
  render() {
    return this.html`
      <form method="POST" onsubmit=${this} action=${this}>
        <div class="field has-addons" style="align-items: center;">
          <div class="control">
            <label>Address:&nbsp;</label>
          </div>
          <div class="control is-expanded">
            <input class="input" name="address[address]" id="address_autocomplete" placeholder="Enter your address of residence"/>
          </div>
          <div class="control">
            <button class="button is-primary">Set Representatives!</button>
          </div>
        </div>
        <input name="address[lat]" id="address_lat" type="hidden" />
        <input name="address[lon]" id="address_lon" type="hidden" />
      </form>
      ${GoogleAddressAutocompleteScript.for(this)}
    `
  }
}
