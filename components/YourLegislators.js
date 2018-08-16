const Component = require('./Component')
const fetch = require('isomorphic-fetch')
const ordinalSuffix = require('ordinal-suffix')

module.exports = class YourLegislators extends Component {
  oninit() {
    return this.fetchElectedLegislators()
  }
  fetchElectedLegislators() {
    const { config, reps_loaded, user } = this.state
    const { NODE_ENV, WWW_URL } = config

    if (reps_loaded) return

    const address = user && user.address

    if (address) {
      return this.api('/rpc/user_offices', {
        method: 'POST',
        body: JSON.stringify({ user_id: user.id }),
      })
      .then(reps => ({ reps: reps || [], reps_loaded: true }))
    }

    let ip = this.location.ip || ''

    if (ip === '::1' && NODE_ENV !== 'production') ip = '198.27.235.190'

    return fetch(`${WWW_URL}/rpc/geoip/${ip}`, {
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
        body: JSON.stringify({ lon: Number(geoip.lon), lat: Number(geoip.lat) }),
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
    const { geoip, reps = [], reps_loaded, user } = this.state

    return this.html`
      <div class="YourLegislators">
        <h2 class="title is-5">Your Elected Congress Members</h2>
        ${(reps_loaded && (!reps || !reps.length)) ? [`<div class="notification">We weren't able to detect your elected congress members using your location. <a href="/join">Join to set your address</a>.</div>`] : []}
        <div class="columns">
          ${reps.map(rep => RepColumn.for(this, { rep }, `repcolumn-${rep.user_id}`))}
        </div>
        ${geoip && reps && reps.length ? AddAddressNotification.for(this) : []}
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

class AddAddressNotification extends Component {
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
    const { rep } = this.props
    return this.html`
      <div class="media">
        <figure class="media-left">
          <p class="image is-96x96">
            <a href=${`/${rep.username}`}>
              <img src=${this.avatarURL(rep)}>
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
              <span class="tag is-size-6 is-dark has-text-weight-bold">${rep.representation_grade || [`<span class="icon"><i class="fa fa-question"></i></span>`]}</span>
              <span class="is-size-7 has-text-grey">
                ${rep.representation_grade ?
                  `${ordinalSuffix(rep.representation_percentile)} percentile among ${rep.office_chamber === 'Lower' ? 'House' : 'Senate'} ${rep.party_affiliation}s` :
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
    const { geoip } = this.state
    return this.html`
      <div class="notification">
        We selected your reps by guessing your location in <strong>${geoip.city}, ${geoip.regionName}.</strong> But this is only right about half the time. <strong><a href="/join">Set your address</a></strong>.
      </div>
    `
  }
}

class AuthedAddressNotification extends Component {
  render() {
    const { geoip } = this.state
    return this.html`
      <div class="notification content">
        <p>We selected your reps by guessing your location in <strong>${geoip.city}, ${geoip.regionName}</strong>. But this is only right about half the time. <a href="/get_started/basics">Enter your address</a> to fix it.</p>
      </div>
    `
  }
}
