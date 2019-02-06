const Component = require('./Component')
const GoogleAddressAutocompleteScript = require('./GoogleAddressAutocompleteScript')

const milestones = [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000]
function nextMilestone(current) {
  return milestones.filter(ms => ms > current)[0]
}

module.exports = class EndorsementPageSidebar extends Component {
  render() {
    const measure = this.props
    console.log('measure:', measure)

    return this.html`
      <nav class="box">
        ${EndorsementCount.for(this, { measure, offices: this.state.offices })}
        ${RecentEndorsements.for(this, { measure })}
        ${NewSignupEndorseForm.for(this, { measure })}
      </nav>
    `
  }
}

class EndorsementCount extends Component {
  render() {
    const { measure } = this.props
    const { proxy_vote_count } = measure.comment

    const count = proxy_vote_count

    return this.html`
      <div>
        <p><span class="has-text-weight-bold">${count} ${count < 2 ? 'has' : 'have'} endorsed.</span> Let's get to ${nextMilestone(count)}!</p>
        <progress class="progress is-success" style="margin-top: 0.5rem; margin-bottom: 1.5rem" value=${count} max=${nextMilestone(count)}>15%</progress>
      </div>
    `
  }
}

class RecentEndorsements extends Component {
  render() {
    return this.html`<todo />
    `
  }
}

class NewSignupEndorseForm extends Component {
  onsubmit(event, formData) {
    if (event) event.preventDefault()
    console.log('formData:', formData)

    const name_pieces = formData.name.split(' ')
    const first_name = name_pieces[0]
    const last_name = name_pieces.slice(1).join(' ')

    if (!first_name || !last_name) {
      return { error: { name: true, message: 'First & last name required.' } }
    }

    if (!formData.email || !formData.email.includes('@')) {
      return { error: { email: true } }
    }
    const { address, lat, lon, city, state } = formData.address

    // Authenticate (sends OTP to email if existing user)
    const device_desc = this.location.userAgent || 'Unknown'
    const storage = this.storage

    return this.api('/totp?select=device_id,first_seen', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        email: formData.email,
        device_desc,
      }),
    })
    .then((results) => results[0])
    .then(({ device_id, first_seen }) => {
      if (event.target && event.target.reset) {
        event.target.reset()
      }

      if (first_seen) {
        // If new user, authenticate immediately without OTP
        return this.api('/sessions?select=refresh_token,user_id,jwt', {
          method: 'POST',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify({ device_id, device_desc }),
        }).then((results) => results[0]).then(({ jwt, refresh_token, user_id }) => {
          const oneYearFromNow = new Date(Date.now() + (365 * 24 * 60 * 60 * 1000))

          storage.set('jwt', jwt, { expires: oneYearFromNow })
          storage.set('refresh_token', refresh_token, { expires: oneYearFromNow })
          storage.set('user_id', user_id, { expires: oneYearFromNow })

          // Update users name, address, and email
          return this.api(`/user_addresses?select=id&user_id=eq.${user_id}`, {
            method: 'POST',
            headers: { Prefer: 'return=representation' },
            body: JSON.stringify({
              user_id,
              address,
              city,
              state,
              geocoords: `POINT(${lon} ${lat})`,
            })
          }).then(() => {
            // fetch user and re-render by setting state with the newly registered user
            return this.api(`/users?select=id,email,first_name,last_name,username,verified,voter_status,update_emails_preference,address:user_addresses(id,address)&id=eq.${user_id}`).then((users) => users[0]).then((user) => {
              this.setState({
                user: {
                  ...user,
                  first_name,
                  last_name,
                  address: { address, city, state },
                },
              })
            })
          })
        })
      }

      // set some cookie that gets read by SignIn and redirects
      this.storage.set('sign_in_email', formData.email)
      this.storage.set('device_id', device_id)
      this.storage.set('redirect_to', this.location.path)
      this.location.redirect(303, '/sign_in/verify')
    })

  }
  render() {
    const { error = {} } = this.state

    return this.html`
      <form method="POST" style="width: 100%;" method="POST" onsubmit=${this} action=${this}>
        <div class="field">
          <label class="label has-text-grey">Your Name *</label>
          <div class="control has-icons-left">
            <input name="name" autocomplete="off" class=${`input ${error && error.name && 'is-danger'}`} placeholder="John Doe" required />
            ${error && error.name
              ? [`<span class="icon is-small is-left"><i class="fas fa-exclamation-triangle"></i></span>`]
              : [`<span class="icon is-small is-left"><i class="fa fa-user"></i></span>`]
            }
            ${error && error.name ? [`<p class="help is-danger">${error.message}</p>`] : ''}
          </div>
        </div>
        <div class="field">
          <label class="label has-text-grey">Your Email *</label>
          <div class="field has-addons join-input-field">
            <div class="${`control is-expanded has-icons-left ${error && error.email ? 'has-icons-right' : ''}`}">
              <input name="email" class="${`input ${error && error.email ? 'is-danger' : ''}`}" type="text" placeholder="you@example.com" required />
              ${error && error.email
                ? [`<span class="icon is-small is-left"><i class="fas fa-exclamation-triangle"></i></span>`]
                : [`<span class="icon is-small is-left"><i class="fa fa-user"></i></span>`]
              }
              ${error && error.email ? [`<p class="help is-danger">This email is invalid.</p>`] : ''}
            </div>
          </div>
        </div>
        <div class="field">
          <label class="label has-text-grey">Your Address</label>
          <div class="control has-icons-left">
            <input class=${`input ${error && error.address && 'is-danger'}`} autocomplete="off" name="address[address]" id="address_autocomplete" placeholder="185 Berry Street, San Francisco, CA 94121" />
            <input name="address[lat]" id="address_lat" type="hidden" />
            <input name="address[lon]" id="address_lon" type="hidden" />
            <input name="address[city]" id="city" type="hidden" />
            <input name="address[state]" id="state" type="hidden" />
            ${GoogleAddressAutocompleteScript()}
            ${error && error.address
              ? [`<span class="icon is-small is-left"><i class="fa fas fa-exclamation-triangle"></i></span>`]
              : [`<span class="icon is-small is-left"><i class="fa fa-map-marker-alt"></i></span>`]
            }
            ${error && error.address ? [`<p class="help is-danger">${error.message}</p>`] : ''}
          </div>
          <p class="is-size-7" style="margin-top: .3rem;">So your reps know you're their constituent.</p>
        </div>
        <div class="field">
          <div class="control">
            <button class="button is-success is-fullwidth has-text-weight-bold is-size-5" type="submit">Endorse</button>
          </div>
        </div>
      </form>
    `
  }
}
