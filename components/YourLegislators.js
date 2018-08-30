const Component = require('./Component')
const fetch = require('isomorphic-fetch')
const RepCard = require('./RepCard')

module.exports = class YourLegislators extends Component {
  oninit() {
    return this.fetchElectedLegislators()
  }
  fetchElectedLegislators(refresh) {
    const { config, reps_loaded, user } = this.state
    const { NODE_ENV, WWW_URL } = config

    if (!refresh && reps_loaded) return

    const address = user && user.address

    if (address) {
      return this.api('/rpc/user_offices', {
        method: 'POST',
        body: JSON.stringify({ user_id: user.id }),
      })
      .then(reps => this.setState({ reps: reps || [], reps_loaded: true }))
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
      if (!geoip) {
        return this.setState({ reps: [], reps_loaded: true })
      }
      return this.api('/rpc/point_to_offices', {
        method: 'POST',
        body: JSON.stringify({ lon: Number(geoip.lon), lat: Number(geoip.lat) }),
      })
      .then(reps => {
        if (!reps) reps = []
        this.storage.set('geoip_house_rep', reps[0] ? reps[0].user_id : 'not_found')
        return this.setState({ reps, reps_loaded: true, geoip })
      })
    })
    .catch((error) => {
      console.error(error)
      return this.setState({ reps: [], reps_loaded: true })
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
