const Component = require('../Component')
const LoadingIndicator = require('./../LoadingIndicator')

module.exports = class VerificationRouter extends Component {
  oninit() {
    if (this.isServer) {
      return this.redirect()
    }
  }

  redirect() {
    const { user } = this.state
    const { redirect, query } = this.location

    if (!user) return redirect('/join')

    if (query.skip) return this.finishOrSkip()

    if (!user.address) {
      return redirect(`/get_started/basics`)
    } else if (!user.voter_status) {
      return redirect(`/get_started/voter_status`)
    } else if (!user.cc_verified) {
      return redirect(`/get_started/verification`)
    } else if (!user.username) {
      return redirect(`/get_started/profile`)
    }

    return this.finishOrSkip()
  }

  onpagechange(oldProps) {
    if (oldProps.url !== this.props.url) {
      this.redirect()
    }
  }

  finishOrSkip() {
    const { redirect } = this.location
    if (this.storage.get('proxied_user_id')) {
      return this.api(`/user_profiles?select=user_id,username&user_id=eq.${this.storage.get('proxied_user_id')}`)
        .then(users => {
          if (users[0]) {
            return redirect(`/${users[0].username}`)
          }
          return redirect('/legislation')
        })
    }

    if (this.storage.get('vote_bill_short_id')) {
      const bill_short_id = this.storage.get('vote_bill_short_id')
      this.storage.unset('vote_bill_short_id')
      return redirect(`/legislation/${bill_short_id}`)
    }

    return redirect('/legislation')
  }

  render() {
    return this.html`<section>${LoadingIndicator.for(this)}</section>`
  }
}
