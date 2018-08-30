const { GOOGLE_GEOCODER_KEY } = process.env
const Component = require('./Component')
const fetch = require('isomorphic-fetch')
const GoogleAddressAutocompleteScript = require('./GoogleAddressAutocompleteScript')
const fetchElectedLegislators = require('./YourLegislators').prototype.fetchElectedLegislators

module.exports = class ChangeAddressPage extends Component {
  onsubmit(event, formData) {
    if (event) event.preventDefault()

    const { address, lat, lon } = formData.address

    if (!lat || !lon) {
      return fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${formData.address.address}&key=${GOOGLE_GEOCODER_KEY}`)
        .then(response => response.json())
        .then(({ results }) => {
          if (results[0] && results[0].geometry && results[0].geometry.location) {
            const { location } = results[0].geometry
            return this.upsertAddressAndContinue({
              address: results[0].formatted_address || address,
              lat: location.lat,
              lon: location.lng,
            })
          }
          return { error: { address: true, message: 'There was a problem processing your address. Please contact support@united.vote and let us know.' } }
        })
        .catch(error => {
          console.log(error)
          return { error: { address: true, message: 'There was a problem processing your address. Please contact support@united.vote and let us know.' } }
        })
    }

    return this.upsertAddressAndContinue({ address, lat, lon })
  }

  upsertAddressAndContinue({ address, lat, lon }) {
    const { user } = this.state

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

    return addressUpsert
      .then(() => {
        return fetchElectedLegislators.call(this, true)
      })
      .then(() => {
        this.setState({ user: { ...user, address: { address } } })
        this.location.redirect(303, this.location.query.from || '/legislators')
      })
      .catch((api_error) => {
        return {
          error: (~api_error.message.indexOf('constraint "email')) ? 'Invalid email address' : api_error.message,
        }
      })
  }

  render() {
    const error = this.state.error || {}
    return this.html`
      <section class="section">
        <div class="columns is-centered">
          <div class="column is-half">
            <div class="content">
              <h2 class="subtitle">
                Change your address.
              </h2>
              <p>
                <form method="POST" onsubmit=${this} action=${this}>
                  <div class="field is-horizontal">
                    <div class="field-body">
                      <div class="field">
                        <label>Your Address</label>
                        <div class="control has-icons-left">
                          <input class=${`input ${error.address && 'is-danger'}`} name="address[address]" id="address_autocomplete" placeholder="185 Berry Street, San Francisco, CA 94121" />
                          <input name="address[lat]" id="address_lat" type="hidden" />
                          <input name="address[lon]" id="address_lon" type="hidden" />
                          ${GoogleAddressAutocompleteScript.for(this)}
                          ${error.address
                            ? [`<span class="icon is-small is-left"><i class="fa fa-warning"></i></span>`]
                            : [`<span class="icon is-small is-left"><i class="fa fa-map-marker"></i></span>`]
                          }
                          ${error.address && [`<p class="help is-danger">${error.message}</p>`]}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="field is-grouped is-grouped-right">
                    <div class="control is-expanded">
                      <span class="help has-text-right is-small has-text-grey">All of your information is kept strictly private.</span>
                    </div>
                    <div class="control">
                      <button class="button is-primary" type="submit">Next</button>
                    </div>
                  </div>
                  <br />
                </form>
              <p>
            </div>
          </div>
        </div>
      </section>
    `
  }
}
