const Component = require('../Component')
const routes = require('../../routes')

module.exports = class PickUsernamePage extends Component {
  oninit() {
    if (this.isServer) {
      return this.redirectIfUnauthorized()
    }
  }

  onpagechange(oldProps) {
    if (this.props.url !== oldProps.url) {
      return this.redirectIfUnauthorized()
    }
  }

  redirectIfUnauthorized() {
    const { user } = this.state
    const { redirect } = this.location

    if (!user || !user.cc_verified) {
      return redirect('/get_started')
    }

    // Redirect to profile page if username already picked
    if (user.username) {
      return redirect(`/${user.username}`)
    }
  }

  onsubmit(event, formData) {
    if (event) event.preventDefault()

    const { username } = formData

    if (username.length < 5) {
      return { error: 'Minimum 5 characters' }
    }

    if (!(/^[a-zA-Z0-9_]*$/).test(username)) {
      return { error: 'Only letters, numbers, and underscore allowed' }
    }

    if (~username_blacklist.indexOf(username)) {
      return { error: `${username} is a reserved name. Please choose another.` }
    }

    return this.api(`/users?select=id&id=eq.${this.state.user.id}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ username }),
    })
    .then(() => {
      if (this.isBrowser && window._loq) window._loq.push(['tag', 'Created Public Profile'])
      this.setState({ user: { ...this.state.user, username } })
      this.location.redirect(`/${username}`)
    })
    .catch((api_error) => {
      return {
        error: (~api_error.message.indexOf('username_unique')) ? 'That username is already taken' : api_error.message,
      }
    })
  }

  render() {
    const { error } = this.state

    return this.html`
      <section class="section" >
        <div class="container is-widescreen">
          <div class="content">
            <h2 class="subtitle">
              Thank you for verifying
            </h2>
            <p class="is-size-7">* We will continue strengthening our verification system, and you may need to confirm another check in the future.</p>
            <br />
            <p>You can now create your own profile page, so that other people can easily proxy to you.</p>
            <p>
              <form method="POST" onsubmit=${this} action=${this}>
                <label><strong>Pick a username:</strong></label>
                <div class="field is-horizontal">
                  <div class="field-body">
                    <div class="field has-addons">
                      <p class="control">
                        <a class="button is-static">
                          united.vote/
                        </a>
                      </p>
                      <div class="control has-icons-left is-expanded">
                        <input name="username" class=${`input ${error ? 'is-danger' : ''}`} placeholder="username (at least 5 characters)" />
                        ${error
                          ? ['<span class="icon is-small is-left"><i class="fa fa-warning"></i></span>']
                          : ['<span class="icon is-small is-left"><i class="fa fa-user"></i></span>']
                        }
                        ${error ? [`<p class="help is-danger">${error}</p>`] : ''}
                      </div>
                    </div>
                  </div>
                </div>
                <div class="field is-grouped is-grouped-right">
                  <div class="control">
                    <a class="button has-text-grey" href="/get_started?skip=t">Skip</a>
                  </div>
                  <div class="control">
                    <button class="button is-primary" type="submit">Next</button>
                  </div>
                </div>
                <p class="has-text-right has-text-grey">
                  You can skip for now if you don&#39;t want a public profile page.
                </p>
              </form>
            <p>
          </div>
        </div>
      </section>
    `
  }
}

// username blacklist because profiles are accessed from /:username
const username_blacklist = Object.keys(routes) // TODO: Fix me, should reference routes object
  .map((route) => {
    return route.split('/')[1]
  })
  .filter(route => route)
