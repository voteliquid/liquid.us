const Component = require('../Component')
const fetch = require('isomorphic-fetch')
const GoogleAddressAutocompleteScript = require('../GoogleAddressAutocompleteScript')
const YourLegislators = require('../YourLegislators')

module.exports = class PageOrRedirect extends Component {
  oninit() {
    if (!this.state.user) return this.location.redirect('/sign_in')
  }

  render() {
    return this.html`
      <div>
        ${this.state.user ? GetStartedBasicsPage.for(this) : ''}
      </div>
    `
  }
}

class GetStartedBasicsPage extends Component {
  onsubmit(event, formData) {
    if (event) event.preventDefault()

    this.setState({ loading: true })

    const { GOOGLE_GEOCODER_KEY } = this.state.config
    const { address, lat, lon, voter_status } = formData.address

    const name_pieces = formData.address.name.split(' ')
    const first_name = name_pieces[0]
    const last_name = name_pieces.slice(1).join(' ')

    if (formData.address.name.split(' ').length < 2) {
      return { loading: false, error: { name: true, message: 'Please enter a first and last name' } }
    } else if (formData.address.name.split(' ').length > 5) {
      return { loading: false, error: { name: true, message: 'Please enter only a first and last name' } }
    }

    if (!lat || !lon) {
      return fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${formData.address.address}&key=${GOOGLE_GEOCODER_KEY}`)
        .then(response => response.json())
        .then(({ results }) => {
          if (results[0] && results[0].geometry && results[0].geometry.location) {
            const { location } = results[0].geometry
            return this.upsertAddressAndContinue({
              first_name,
              last_name,
              address: results[0].formatted_address || address,
              voter_status,
              lat: location.lat,
              lon: location.lng,
            })
          }
          return { loading: false, error: { address: true, message: 'There was a problem processing your address. Please contact support@united.vote and let us know.' } }
        })
        .catch(error => {
          console.log(error)
          return { loading: false, error: { address: true, message: 'There was a problem processing your address. Please contact support@united.vote and let us know.' } }
        })
    }

    return this.upsertAddressAndContinue({ first_name, last_name, address, voter_status, lat, lon })
  }

  upsertAddressAndContinue({ first_name, last_name, address, voter_status, lat, lon }) {
    const { user } = this.state
    const { redirect } = this.location
    const storage = this.storage

    let addressUpsert

    if (user.address) {
      addressUpsert = this.api(`/user_addresses?select=id&user_id=eq.${user.id}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({
          address,
          geocoords: `POINT(${lon} ${lat})`,
        }),
      })
    } else {
      addressUpsert = this.api('/user_addresses', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({
          user_id: user.id,
          address,
          geocoords: `POINT(${lon} ${lat})`,
        }),
      })
    }

    return addressUpsert.then(() => this.api(`/users?select=id&id=eq.${user.id}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        first_name,
        last_name,
        voter_status,
      }),
    }))
    .then(() => {
      this.setState({ reps: [], user: { ...user, voter_status, first_name, last_name, address: { address } } })
      return Promise.resolve(YourLegislators.prototype.fetchElectedLegislators.call(this, true))
    })
    .then(() => {
      if (!storage.get('proxying_user_id')) {
        return redirect(303, '/get_started/proxies')
      }

      return this.api('/delegations', {
        method: 'POST',
        headers: { Prefer: 'return=representation' }, // returns created delegation in response
        body: JSON.stringify({
          from_id: user.id,
          to_id: storage.get('proxying_user_id'),
          delegate_rank: 0,
        }),
      })
      .then(() => {
        storage.set('proxied_user_id', storage.get('proxying_user_id'))
        storage.unset('proxying_user_id')
        return redirect(303, '/get_started/proxies')
      })
      .catch(error => {
        console.log(error)
        return redirect(303, '/get_started/proxies')
      })
    })
    .catch((api_error) => {
      console.log(api_error)
      this.setState({ loading: false })
      return redirect(303, '/get_started/proxies')
    })
  }

  render() {
    const { error = {}, loading, user } = this.state
    const { location } = this

    return this.html`
      <section class="section">
        <div class="container is-widescreen">
          <div class="content" style="max-width: 650px;">
            ${location.query.notification === 'proxy_wo_name' ? [`
              <div class="notification is-info">You must set your first and last name before proxying.</div>
            `] : []}
            ${error && typeof error === 'string' ? [`
              <div class="notification is-warning">${error}</div>
            `] : []}
            <h2 class="subtitle">Welcome.</h2>
            <h3 class="subtitle is-5">
              Help us locate your elected representatives:
            </h3>
            <form method="POST" onsubmit=${this}>
              <div class="field">
                <label class="label">Your Name:</label>
                <div class="control has-icons-left">
                  <input name="address[name]" autocomplete="off" class=${`input ${error.name && 'is-danger'}`} placeholder="John Doe" required value="${[user.first_name, user.last_name].filter(a => a).join(' ')}" />
                  ${error.name
                    ? [`<span class="icon is-small is-left"><i class="fa fa-warning"></i></span>`]
                    : [`<span class="icon is-small is-left"><i class="fa fa-user"></i></span>`]
                  }
                  ${error.name && [`<p class="help is-danger">${error.message}</p>`]}
                </div>
              </div>
              <div class="field">
                <label class="label">Your Address:</label>
                <div class="control has-icons-left">
                  <input class=${`input ${error.address && 'is-danger'}`} autocomplete="off" name="address[address]" id="address_autocomplete" required placeholder="185 Berry Street, San Francisco, CA 94121" value="${user.address ? user.address.address : ''}" />
                  <input name="address[lat]" id="address_lat" type="hidden" />
                  <input name="address[lon]" id="address_lon" type="hidden" />
                  ${GoogleAddressAutocompleteScript.for(this)}
                  ${error.address
                    ? [`<span class="icon is-small is-left"><i class="fa fa-warning"></i></span>`]
                    : [`<span class="icon is-small is-left"><i class="fa fa-map-marker-alt"></i></span>`]
                  }
                  ${error.address && [`<p class="help is-danger">${error.message}</p>`]}
                </div>
              </div>
              <div class="field">
                <label class="label">Are you registered to vote at this address?</label>
                <div class="control">
                  <div class="select">
                    <select name="address[voter_status]" required>
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
                  <button class="${`button is-primary ${loading ? 'is-loading' : ''}`}" disabled=${!!loading} type="submit">Next</button>
                </div>
              </div>
              <p class="help is-small has-text-grey">All of your information is kept strictly private.</p>
              <div class="expandable">
                <a onclick=${expand} href="#" class="is-size-7">Not in the US?</a>
                <p>As Americans, we're focused on our own democracy first, but we've heard many international requests to bring United to other countries.</p>
                <p>We want to make this much easier in the future.</p>
                <p>Write to us at <a href="mailto:international@united.vote" >international@united.vote</a> and tell us where you're from. We'd love to hear from you.</p>
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
}

function expand(event) {
  event.preventDefault()
  const target = event.currentTarget.parentNode
  if (target.className === 'expandable is-expanded') target.className = 'expandable'
  else if (target.className === 'expandable') target.className = 'expandable is-expanded'
}
