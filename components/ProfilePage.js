const Component = require('./Component')
const LegislatorProfilePage = require('./LegislatorProfilePage')
const LoadingIndicator = require('./LoadingIndicator')
const UserProfilePage = require('./UserProfilePage')

module.exports = class ProfilePage extends Component {
  oninit() {
    const { config, profiles = {} } = this.state
    const username = this.props.params.username.toLowerCase()
    const { path } = this.location

    if (profiles[username]) return

    let url = `/user_profiles?username=eq.${username}`
    if (path.slice(0, 8) === '/twitter') {
      url = `/user_profiles?twitter_username=eq.${username}`
    }

    this.setState({ loading_profile: true })

    return this.api(url).then((users = []) => {
      const user = profiles[username] = users[0]

      if (!user) return this.location.setStatus(404)

      user.name = `${user.first_name} ${user.last_name}`

      if (user.twitter_username && !user.username) {
        user.name = user.twitter_displayname
      }

      if (this.isBrowser) {
        const page_title = `${user.name} ★ ${config.APP_NAME}`
        window.document.title = page_title
        window.history.replaceState(window.history.state, page_title, document.location)
      }

      return this.setState({
        page_title: user.name,
        page_description: `Empower ${user.first_name} to represent you in our legislatures.`,
        profiles,
        selected_profile: { ...user, votes: [], public_votes: [] },
      })
    })
    .then(() => this.fetchIsProxyingToProfile())
    .then(() => this.fetchPublicVotes())
    .then(() => this.fetchLegislatorVotes())
    .then(() => this.fetchProxiedNameIfOwnProfile())
    .then(() => this.setState({ loading_profile: false }))
    .catch(error => {
      console.error(error)
      this.setState({ error, loading_profile: false })
    })
  }
  onpagechange() {
    return this.oninit()
  }
  fetchIsProxyingToProfile() {
    const { selected_profile, user } = this.state

    if (selected_profile && user) { // If logged in, check if already proxying
      return this.api(`/delegations?from_id=eq.${user.id}&to_id=eq.${selected_profile.user_id}`)
      .then((proxies) => {
        if (proxies[0]) {
          selected_profile.proxied = true
          this.setState({ selected_profile })
        }
      })
    }
  }
  fetchPublicVotes() {
    const { selected_profile } = this.state

    if (selected_profile && !selected_profile.elected_office_name) {
      return this.api(`/public_votes?user_id=eq.${selected_profile.user_id}&published=is.true&order=created_at.desc`).then(public_votes => {
        selected_profile.public_votes = public_votes
        this.setState({ selected_profile })
      })
    }
  }
  fetchLegislatorVotes() {
    const { selected_profile } = this.state

    if (selected_profile && selected_profile.elected_office_name) {
      const page_size = 20
      const page = Number(this.location.query.page || 1)

      const range_start = (page * page_size) - page_size
      const range_end = (page * page_size) - 1
      const query = this.location.query
      const order = (sort = 'desc') => ({
        date: `rollcall_occurred_at.${sort}.nullslast`,
        with_constituents: `with_constituents.${sort}.nullslast,rollcall_occurred_at.desc.nullslast`,
        against_constituents: `against_constituents.${sort}.nullslast,rollcall_occurred_at.desc.nullslast`,
        representation_delta: `representation_delta.${sort}.nullslast,rollcall_occurred_at.desc.nullslast`,
      })

      return this.api(`/legislator_votes?legislator_user_id=eq.${selected_profile.user_id}&order=${order(query.order)[query.order_by || 'date']}`, {
        headers: {
          'Range-Unit': 'items',
          'Range': `${range_start}-${range_end}`,
        },
      })
      .then(legislator_votes => {
        selected_profile.votes = legislator_votes
        this.setState({ selected_profile })
      })
    }
  }
  fetchProxiedNameIfOwnProfile() {
    const proxied_user_id = this.storage.get('proxied_user_id')

    if (proxied_user_id) {
      this.storage.unset('proxied_user_id')

      return this.api(`/user_profiles?select=user_id,first_name,last_name&user_id=eq.${proxied_user_id}`).then(users => {
        if (users[0]) {
          this.setState({
            proxied_name: `${users[0].first_name} ${users[0].last_name}`
          })
        }
      })
    }
  }
  render() {
    const { loading_profile, selected_profile } = this.state

    return this.html`
      <div>
        ${loading_profile
          ? LoadingIndicator.for(this)
          : selected_profile
            ? selected_profile.elected_office_name
              ? LegislatorProfilePage.for(this)
              : UserProfilePage.for(this)
            : UserNotFound.for(this, { username: this.props.params.username })
        }
      </div>
    `
  }
}

class UserNotFound extends Component {
  render() {
    const { username } = this.props
    return this.html`
      <section class="hero is-fullheight is-dark">
        <div class="hero-body">
          <div class="container has-text-centered">
            <h1 class="title">Can't find anyone with username ${[username]}</h1>
            <h2 class="subtitle">Maybe you mistyped the URL?</h2>
          </div>
        </div>
      </section>
    `
  }
}
