const Component = require('./Component')
const { EndorsementCount, AfterEndorseSocialShare } = require('./EndorsementPageSidebar')

module.exports = class EndorsementPageMobileForm extends Component {
  render() {
    const measure = this.props

    return this.html`
      <div style="z-index: 30;" class=${`modal ${this.props.visible ? 'is-active' : ''} mobile-only`}>
        <div class="modal-background" onclick=${this.props.onclick}></div>
        <div class="modal-content">
          ${measure.user && measure.vote_position && !measure.comment.endorsed
            // logged in, voted differently
            ? VotedDifferentlyMessage.for(this, { measure }) : ''
          }

          <nav class="box">
            ${EndorsementCount.for(this, { measure })}
            ${RecentEndorsements.for(this, { measure })}
            ${!measure.user // logged out
              ? NewSignupEndorseForm.for(this, { measure })

              : measure.comment.endorsed // logged in, already endorsed
              ? AfterEndorseSocialShare.for(this, { measure })

              : // logged in, voted differently or haven't voted
              LoggedInForm.for(this, { measure })
            }
          </nav>
        </div>
        <button class="modal-close is-large" aria-label="close" onclick=${this.props.onclick}></button>
      </div>
      <style>
        @media (min-width: 1050px) {
          .mobile-only {
            display: none !important;
          }
        }
      </style>
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
        channel: 'endorsement',
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

          // Update users address
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
            // Update users name
            return this.api(`/users?select=id&id=eq.${user_id}`, {
              method: 'PATCH',
              headers: { Prefer: 'return=representation' },
              body: JSON.stringify({
                first_name,
                last_name,
              }),
              storage,
            })

            .then(() => { // fetch user
              return this.api(`/users?select=id,email,first_name,last_name,username,verified,voter_status,update_emails_preference,address:user_addresses(id,address)&id=eq.${user_id}`)
              .then((users) => users[0]).then((user) => {

                const { measure } = this.props
                const { comment, short_id } = measure
                const vote_id = comment.id

                // Store endorsement
                return this.api('/rpc/endorse', {
                  method: 'POST',
                  body: JSON.stringify({ user_id: user.id, vote_id, measure_id: measure.id, public: formData.is_public === 'on' }),
                })

                // Get new endorsement count
                .then(() => this.api(`/votes_detailed?id=eq.${vote_id}`))
                .then((votes) => {
                  // And finally re-render with with the newly registered user and updated count
                  this.setState({
                    measures: {
                      ...this.state.measures,
                      [short_id]: {
                        ...this.state.measures[short_id],
                        comment: votes[0] || this.state.measures[short_id].comment,
                      }
                    },
                    user: {
                      ...user,
                      first_name,
                      last_name,
                      address: { address, city, state },
                    },
                  })
                })
                .catch((error) => console.log(error))
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
    const { measure } = this.props

    let action = 'Endorse'; let color = 'is-success'
    if (measure.comment.position === 'nay') { action = 'Join opposition'; color = 'is-danger' }
    if (measure.comment.position === 'abstain') { action = 'Join abstention'; color = 'is-dark' }

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
            <input class=${`input ${error && error.address && 'is-danger'}`} autocomplete="off" name="address[address]" id="address_autocomplete_mobileform" placeholder="185 Berry Street, San Francisco, CA 94121" />
            <input name="address[lat]" id="address_lat_mobileform" type="hidden" />
            <input name="address[lon]" id="address_lon_mobileform" type="hidden" />
            <input name="address[city]" id="city_mobileform" type="hidden" />
            <input name="address[state]" id="state_mobileform" type="hidden" />
            ${''/* Uses EndorsementGoogleAddressAutocompleteScript.js, initialized in EndorsementPageSidebar */}
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
            <label class="checkbox">
              <input name="is_public" type="checkbox" checked />
              Share my name publicly
            </label>
          </div>
        </div>
        <div class="field">
          <div class="control">
            <button class=${`button ${color} is-fullwidth fix-bulma-centered-text has-text-weight-bold is-size-5`} type="submit">${action}</button>
          </div>
        </div>
      </form>
    `
  }
}

class VotedDifferentlyMessage extends Component {
  render() {
    const { measure } = this.props

    let previousVote = 'endorsed'
    if (measure.vote_position === 'nay') { previousVote = 'opposed' }
    if (measure.vote_position === 'abstain') { previousVote = 'abstained <span class="has-text-weight-normal">on</span>' }


    return this.html`
      <article class="notification is-warning is-marginless is-size-7">
          You previously <strong>${[previousVote]}</strong> this item.<br />
          This will switch your vote.
      </article>
    `
  }
}

class LoggedInForm extends Component {
  onsubmit(event, formData) {
    if (event) event.preventDefault()

    const { measure } = this.props
    const { comment, user, short_id } = measure
    const vote_id = comment.id

    return this.api('/rpc/endorse', {
      method: 'POST',
      body: JSON.stringify({ user_id: user.id, vote_id, measure_id: measure.id, public: formData.is_public === 'on' }),
    })
    .then(() => this.api(`/votes_detailed?id=eq.${vote_id}`))
    .then((votes) => {
      this.setState({
        measures: {
          ...this.state.measures,
          [short_id]: {
            ...this.state.measures[short_id],
            comment: votes[0] || this.state.measures[short_id].comment,
          }
        }
      })
    })
    .catch((error) => console.log(error))
  }
  render() {
    const { measure } = this.props
    const { last_vote_public } = this.state
    const { user } = measure

    let action = 'Endorse'; let color = 'is-success'
    if (measure.comment.position === 'nay') { action = 'Join opposition'; color = 'is-danger' }
    if (measure.comment.position === 'abstain') { action = 'Join abstention'; color = 'is-dark' }

    return this.html`
      <form method="POST" style="width: 100%;" method="POST" onsubmit=${this} action=${this}>
        <div class="field">
          <label class="label has-text-grey">Your Name *</label>
          <div class="control has-icons-right">
            <input name="name" autocomplete="off" class="input" placeholder="John Doe" value="${[user.first_name, user.last_name].filter(a => a).join(' ')}" required disabled />
            <span class="icon is-small is-right"><i class="fa fa-lock"></i></span>
          </div>
        </div>
        <div class="field">
          <label class="label has-text-grey">Your Email *</label>
          <div class="field has-addons join-input-field">
            <div class="control is-expanded has-icons-right">
              <input name="email" class="input" type="text" placeholder="you@example.com" value=${user.email} required disabled />
              <span class="icon is-small is-right"><i class="fa fa-lock"></i></span>
            </div>
          </div>
        </div>
        <div class="field">
          <label class="label has-text-grey">Your Address</label>
          <div class="control has-icons-right">
            <input class="input" autocomplete="off" name="address[address]" placeholder="185 Berry Street, San Francisco, CA 94121" value="${user.address ? user.address.address : ''}" disabled />
            <span class="icon is-small is-right"><i class="fa fa-lock"></i></span>
          </div>
          <p class="is-size-7" style="margin-top: .3rem;">So your reps know you're their constituent.</p>
        </div>
        <div class="field">
          <div class="control">
            <label class="checkbox">
              <input name="is_public" type="checkbox" checked=${last_vote_public} />
              Share my name publicly
            </label>
          </div>
        </div>
        <div class="field">
          <div class="control">
            <button class=${`button ${color} is-fullwidth fix-bulma-centered-text has-text-weight-bold is-size-5`} type="submit">${action}</button>
          </div>
        </div>
      </form>
    `
  }
}
