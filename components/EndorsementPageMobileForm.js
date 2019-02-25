const Component = require('./Component')
const { EndorsementCount, AfterEndorseSocialShare, AfterEndorseComment, LoggedInForm, NewSignupEndorseForm } = require('./EndorsementPageSidebar')

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
            ${!measure.user // logged out
              ? NewSignupEndorseMobileForm.for(this, { measure })

              : measure.comment.endorsed // logged in, already endorsed
                ? AfterEndorseSocialShare.for(this, { measure })

              : // logged in, voted differently or haven't voted
              LoggedInMobileForm.for(this, { measure })
            }
            ${measure.user && measure.comment.endorsed && !measure.reply
              ? AfterEndorseComment.for(this, { measure })
              : ''}
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

class NewSignupEndorseMobileForm extends NewSignupEndorseForm {
  render() {
    const { error = {} } = this.state
    const { measure } = this.props

    let action = 'Endorse'; let color = 'is-success'
    if (measure.comment.position === 'nay') { action = 'Join opposition'; color = 'is-danger' }
    if (measure.comment.position === 'abstain') { action = 'Weigh in'; color = 'is-success' }

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

class LoggedInMobileForm extends LoggedInForm {
  render() {
    const { measure } = this.props
    const { last_vote_public, user } = this.state

    let action = 'Endorse'; let color = 'is-success'
    if (measure.comment.position === 'nay') { action = 'Join opposition'; color = 'is-danger' }
    if (measure.comment.position === 'abstain') { action = 'Weigh in'; color = 'is-success' }

    const name = [user.first_name, user.last_name].filter(a => a).join(' ')
    const address = user.address ? user.address.address : ''

    return this.html`
      <form method="POST" style="width: 100%;" method="POST" onsubmit=${this} action=${this}>
        <div class="field">
          <label class="label has-text-grey">Your Name *</label>
          <div class="control has-icons-right">
            <input name="name" autocomplete="off" class="input" placeholder="John Doe" required value="${name}" required disabled=${!!name} />
            <span class="icon is-small is-right"><i class="${`fa fa-${name ? 'lock' : 'user'}`}"></i></span>
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
            <input id="address_autocomplete_mobileform" class="input" autocomplete="off" name="address[address]" placeholder="185 Berry Street, San Francisco, CA 94121" value="${address}" disabled=${!!address} />
            <span class="icon is-small is-right"><i class="${`fa fa-${address ? 'lock' : 'map-marker-alt'}`}"></i></span>
            <input name="address[lat]" id="address_lat_mobileform" type="hidden" />
            <input name="address[lon]" id="address_lon_mobileform" type="hidden" />
            <input name="address[city]" id="city_mobileform" type="hidden" />
            <input name="address[state]" id="state_mobileform" type="hidden" />
            ${''/* Uses EndorsementGoogleAddressAutocompleteScript.js, initialized in EndorsementPageSidebar */}
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
