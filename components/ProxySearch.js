const fetch = require('isomorphic-fetch')
const Component = require('./Component')

module.exports = class ProxySearch extends Component {
  render() {
    const show_tabs = this.props.show_tabs !== false
    const tab = this.location.query.tab || 'search'
    const path = this.location.path

    return this.html`
      <div>
        ${show_tabs ? [`
          <div class="tabs">
            <ul>
              <li class=${tab === 'search' ? 'is-active' : ''}><a href=${`${path}?tab=search`}>Search by Name</a></li>
              <li class=${tab === 'email' ? 'is-active' : ''}><a href=${`${path}?tab=email`}>Invite by Email</a></li>
              <li class=${tab === 'twitter' ? 'is-active' : ''}><a href=${`${path}?tab=twitter`}>Invite by Twitter</a></li>
            </ul>
          </div>
        `] : []}
        ${tab === 'email' ? AddProxyByEmailForm.for(this) : []}
        ${tab === 'twitter' ? AddProxyByTwitterForm.for(this) : []}
        ${tab === 'search' ? AddProxyBySearchForm.for(this) : []}
      </div>
    `
  }
}

class AddProxyByEmailForm extends Component {
  onsubmit(event, formData) {
    const { proxies, user } = this.state
    if (event) event.preventDefault()
    if (!formData.add_proxy) return this.state

    const name = formData.add_proxy.name.trim().split(' ')

    if (name.length < 2) {
      return { error: { name: true, message: 'Please enter a first and last name' } }
    } else if (name.length > 5) {
      return { error: { name: true, message: 'Please enter only a first and last name' } }
    }

    const first_name = formData.add_proxy.name.trim().split(' ')[0]
    const last_name = formData.add_proxy.name.trim().split(' ').slice(1).join(' ')

    return this.api('/delegations', {
      method: 'POST',
      headers: { Prefer: 'return=representation' }, // returns created delegation in response
      body: JSON.stringify({
        from_id: user.id,
        first_name,
        last_name,
        email: formData.add_proxy.email ? formData.add_proxy.email.toLowerCase().trim() : null,
        delegate_rank: 0,
      }),
    })
    .then((delegations) => {
      if (event) event.target.reset()
      if (this.isBrowser && window._loq) window._loq.push(['tag', 'Added Proxy'])
      return this.api(`/delegations_detailed?id=eq.${delegations[0].id}`).then(profiles => {
        return {
          error: false, typing: false, proxies: (proxies || []).concat(profiles[0] || delegations[0]),
        }
      })
    })
    .catch((error) => {
      if (error.code === 42501) return { error: { name: true, message: 'You cannot proxy to yourself' } }
      if (error.code === 23514) {
        if (~error.message.indexOf('delegations_check')) return { error: { name: true, message: 'You cannot proxy to yourself' } }
        if (~error.message.indexOf('email')) return { error: { email: true, message: 'Invalid email address' } }
      }
      if (error.code === 23505) return { error: { name: true, message: `You've already added ${name.first} ${name.last}` } }
      if (error.code === 'P0001') return this.location.redirect('/get_started/basics?notification=proxy_wo_name')
      return { error: { name: true, message: error.message } }
    })
  }

  render() {
    const { error = {} } = this.state

    return this.html`
      <form method="POST" onsubmit=${this} action=${this}>
        <label for="add_proxy[search]" class="label has-text-weight-normal">Proxy to someone not on United via email:</label>
        <div class="field is-horizontal">
          <div class="field-body">
            <div class="field">
              <div class="control has-icons-left">
                <input autocomplete="off" name="add_proxy[name]" class=${`input ${error.name ? 'is-danger' : ''}`} type="text" placeholder="First and Last Name" />
                ${error.name
                  ? [`<span class="icon is-small is-left"><i class="fa fa-warning"></i></span>`]
                  : [`<span class="icon is-small is-left"><i class="fa fa-user"></i></span>`]
                }
                ${error.name ? [`<p class="help is-danger">${error.message}</p>`] : ''}
              </div>
            </div>
            <div class="field">
              <div class="control has-icons-left">
                <input autocomplete="off" name="add_proxy[email]" class=${`input ${error.email ? 'is-danger' : ''}`} type="text" required placeholder="Email" />
                ${error.email
                  ? [`<span class="icon is-small is-left"><i class="fa fa-warning"></i></span>`]
                  : [`<span class="icon is-small is-left"><i class="fa fa-envelope"></i></span>`]
                }
                ${error.email ? [`<p class="help is-danger">${error.message}</p>`] : ''}
              </div>
            </div>
            <div class="field">
              <div class="control">
                <button class="button is-link is-outlined">
                  <span class="icon is-small" style="margin-left:0 !important;"><i class="fa fa-handshake-o"></i></span>
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <p class="is-size-7">They'll be sent an <strong>invitation email</strong>. You'll be BCC'd.</p>
      </form>
    `
  }
}

class AddProxyByTwitterForm extends Component {
  onsubmit(event, formData) {
    const { proxies, user } = this.state
    if (event) event.preventDefault()
    if (!formData.add_proxy) return this.state

    let twitter_username = null
    if (formData.add_proxy.twitter_username) {
      twitter_username = formData.add_proxy.twitter_username.trim().replace(/@/g, '')
    }

    return fetch('/rpc/twitter_username_search', {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({ twitter_username }),
    })
    .then(res => {
      if (res.status === 404) {
        return res.json().then(json => {
          return Promise.reject(new Error(json.message))
        })
      }
      return res.json()
    })
    .then(twitter_user => {
      return this.api('/delegations', {
        method: 'POST',
        headers: { Prefer: 'return=representation' }, // returns created delegation in response
        body: JSON.stringify({
          from_id: user.id,
          twitter_username: twitter_user.twitter_username.replace(/@/g, ''),
          twitter_displayname: twitter_user.name,
          twitter_avatar: twitter_user.avatar,
          bio: twitter_user.description,
          delegate_rank: 0,
        }),
      })
      .then((newProxies) => {
        if (event) event.target.reset()
        if (this.isBrowser && window._loq) window._loq.push(['tag', 'Added Proxy'])
        return this.api(`/delegations_detailed?id=eq.${newProxies[0].id}`).then(profiles => {
          return {
            error: false, typing: false, proxies: (proxies || []).concat(profiles[0] || newProxies[0]),
          }
        })
      })
      .catch((error) => {
        if (error.code === 42501) return { error: { name: true, message: 'You cannot proxy to yourself' } }
        if (error.code === 23514) {
          if (~error.message.indexOf('delegations_check')) return { error: { name: true, message: 'You cannot proxy to yourself' } }
          if (~error.message.indexOf('email')) return { error: { email: true, message: 'Invalid email address' } }
        }
        if (error.code === 23505) return { error: { name: true, message: `You've already added @${twitter_username}` } }
        if (error.code === 'P0001') return this.location.redirect('/get_started/basics?notification=proxy_wo_name')
        return { error: { name: true, message: error.message } }
      })
    })
  }

  render() {
    const { error = {} } = this.state
    return this.html`
      <form method="POST" onsubmit=${this} action=${this}>
        <label for="add_proxy[search]" class="label has-text-weight-normal">Proxy to someone not on United by adding their Twitter username:</label>
        <div class="field is-horizontal">
          <div class="field-body">
            <div class="field is-grouped">
              <div class="control is-expanded has-icons-left">
                <input autocomplete="off" name="add_proxy[twitter_username]" class=${`input ${error.email ? 'is-danger' : ''}`} type="text" required placeholder="Twitter @username" />
                ${error.message
                  ? [`<span class="icon is-small is-left"><i class="fa fa-warning"></i></span>`]
                  : [`<span class="icon is-small is-left"><i class="fa fa-twitter"></i></span>`]
                }
                ${error.message ? [`<p class="help is-danger">${error.message}</p>`] : ''}
              </div>
              <div class="control">
                <button class="button is-link is-outlined" type="submit">
                  <span class="icon is-small" style="margin-left:0 !important;"><i class="fa fa-handshake-o"></i></span>
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <p class="is-size-7">They'll be sent an <a href="https://twitter.com/united_notifs" target="_blank"><strong>invitation tweet</strong></a>.</p>
      </form>
    `
  }
}

class AddProxyBySearchForm extends Component {
  onsubmit(event, formData) {
    if (event) event.preventDefault()

    const terms = formData.add_proxy && formData.add_proxy.search && formData.add_proxy.search

    if (!terms) return { search_results: [], terms }

    this.setState({ loading_proxies: true })

    return this.api(`/user_search_profiles?tsv=fts(simple).${encodeURIComponent(terms.replace(/ /g, ':* & ').replace(/$/, ':*'))}&order=num_delegations.desc&limit=5`)
      .then(search_results => {
        return {
          loading_proxies: false,
          search_results: search_results.filter(({ twitter_username }) => twitter_username !== 'dsernst'),
          terms,
        }
      })
      .catch(error => console.log(error))
  }

  render() {
    const { error = {}, loading_proxies, search_results = [], terms } = this.state

    return this.html`
      <script>
        var autoSubmitProxySearchTimeout;
        function autoSubmitProxySearch(event) {
          if (autoSubmitProxySearchTimeout) {
            clearTimeout(autoSubmitProxySearchTimeout);
          }
          autoSubmitProxySearchTimeout = setTimeout(function () {
            var el = document.getElementById('search_proxy_submit');
            if (el) el.click();
          }, 750);
        }
      </script>
      <form method="POST" onsubmit=${this} action=${this}>
        <label for="add_proxy[search]" class="label has-text-weight-normal">Search for new proxies among public United profiles:</label>
        <div class="field has-addons">
          <div class="${`control is-expanded has-icons-left ${loading_proxies ? 'is-loading' : ''}`}">
            <input autocomplete="off" onkeypress="autoSubmitProxySearch()" name="add_proxy[search]" class=${`input ${error.email ? 'is-danger' : ''}`} type="text" placeholder="Name or @username" />
            ${error.message
              ? [`<span class="icon is-small is-left"><i class="fa fa-warning"></i></span>`]
              : [`<span class="icon is-small is-left"><i class="fa fa-user"></i></span>`]
            }
            ${error.message ? [`<p class="help is-danger">${error.message}</p>`] : ''}
          </div>
          <div class="control">
            <button id="search_proxy_submit" type="submit" class="button">
              <span>Search</span>
            </button>
          </div>
        </div>
      </form>
      <br />
      <div>
        ${terms && !search_results.length ? [`<p>No results for "<strong>${terms}</strong>"</p>`] : ''}
        ${search_results.map(result => SearchResult.for(this, result, `result-${result.id}`))}
        ${terms ? [`<br /><p class="notification has-text-grey">Can't find who you're looking for?<br />Invite them by <a href="?tab=email">email</a> or <a href="?tab=twitter">Twitter username</a>.</p>`] : ''}
      </div>
    `
  }
}

class SearchResult extends Component {
  render() {
    const { first_name, id, last_name, username, twitter_username } = this.props
    const { proxies } = this.state

    return this.html`
      <div class="media">
        <div class="media-left">
          <div class="image is-32x32">
            ${username || twitter_username
            ? [`
              <a href="${username ? `/${username}` : `/twitter/${twitter_username}`}" target="_blank">
                <img src=${this.avatarURL(this.props)} class="round-avatar-img" />
              </a>
            `] : [`
              <img src=${this.avatarURL(this.props)} class="round-avatar-img" />
            `]}
          </div>
        </div>
        <div class="media-content">
          <a href="${username ? `/${username}` : `/twitter/${twitter_username}`}" target="_blank">
            <span>${first_name} ${last_name}</span>
            <span class="has-text-grey is-size-7">@${username || twitter_username}</span>
          </a>
        </div>
        <div class="media-right">
          ${proxies.some(({ to_id }) => to_id === id)
          ? SearchResultAdded.for(this, { id }, `result-add-${id}`) : SearchResultAdd.for(this, { id }, `result-added-${id}`)}
        </div>
      </div>
    `
  }
}

class SearchResultAdd extends Component {
  onsubmit(event, form) {
    if (event) event.preventDefault()

    const { proxies, user } = this.state
    const { redirect } = this.location
    const to_id = form.add_proxy && form.add_proxy.to_id

    return this.api('/delegations', {
      method: 'POST',
      headers: { Prefer: 'return=representation' }, // returns created delegation in response
      body: JSON.stringify({
        from_id: user.id,
        to_id,
        delegate_rank: 0,
      }),
    })
    .then((newProxies) => {
      if (event) event.target.reset()
      if (this.isBrowser && window._loq) window._loq.push(['tag', 'Added Proxy'])
      return this.api(`/delegations_detailed?id=eq.${newProxies[0].id}`).then(profiles => {
        return {
          error: false,
          typing: false,
          proxies: (proxies || []).concat(profiles[0] || newProxies[0]),
        }
      })
    })
    .catch((error) => {
      if (error.code === 42501) return { error: { name: true, message: 'You cannot proxy to yourself' } }
      if (error.code === 23514) {
        if (~error.message.indexOf('delegations_check')) return { error: { name: true, message: 'You cannot proxy to yourself' } }
        if (~error.message.indexOf('email')) return { error: { email: true, message: 'Invalid email address' } }
      }
      if (error.code === 23505) return { error: { name: true, message: `You've already added them` } }
      if (error.code === 'P0001') return redirect('/get_started/basics?notification=proxy_wo_name')
      return { error: { name: true, message: error.message } }
    })
  }

  render() {
    const { id } = this.props

    return this.html`
      <form method="POST" onsubmit=${this} action=${this}>
        <input name="add_proxy[to_id]" type="hidden" value="${id}" />
        <button class="button is-outline is-small" type="submit">
          <span class="icon"><i class="fa fa-plus"></i></span>
          <span>Add</span>
        </button>
      </form>
    `
  }
}

class RemoveProxyButton extends Component {
  onsubmit(event, formData) {
    const { proxies, user } = this.state

    if (event) event.preventDefault()
    if (!formData || !formData.remove_delegation) return this.state

    const { to_id } = formData.remove_delegation

    const proxy = proxies.filter(d => d.to_id === to_id).pop()
    if (typeof window === 'object' && !window.confirm(`Are you sure you want to remove ${proxy.first_name} ${proxy.last_name}?`)) return this.state

    // reset ranks of other proxies without refetching
    proxies.forEach(d => {
      if (d.delegate_rank > proxy.delegate_rank) d.delegate_rank -= 1
    })

    return this.api(`/delegations?from_id=eq.${user.id}&to_id=eq.${to_id}`, {
      method: 'DELETE',
    })
    .then(() => {
      if (this.storage.get('proxied_user_id') === to_id) this.storage.unset('proxied_user_id')
      return {
        error: false,
        proxies: (proxies || []).filter(d => d.to_id !== to_id),
      }
    })
    .catch((error) => {
      console.log(error)
      if (error.code === 42501) return { error: 'You cannot proxy to yourself' }
      if (error.code === 23514) return { error: 'Invalid email address' }
      if (error.code === 23505) return { error: `You've already added ${formData.add_proxy.first_name} ${formData.add_proxy.last_name}` }
      return { error: error.message }
    })
  }

  render() {
    const { id } = this.state
    return this.html`
      <form style="display: inline;" method="POST" onsubmit=${this} action=${this}>
        <input value="${id}" name="remove_delegation[to_id]" type="hidden" />
        <button class="button is-small" type="submit">
          <span class="icon has-text-grey"><i class="fa fa-times"></i></span>
        </button>
      </form>
    `
  }
}

class SearchResultAdded extends Component {
  onsubmit(event, formData) {
    if (event) event.preventDefault()

    const { proxies, user } = this.state
    const to_id = formData.add_proxy && formData.add_proxy.to_id

    return this.api('/delegations', {
      method: 'POST',
      headers: { Prefer: 'return=representation' }, // returns created delegation in response
      body: JSON.stringify({
        from_id: user.id,
        to_id,
        delegate_rank: 0,
      }),
    })
    .then((newProxies) => {
      if (event) event.target.reset()
      return this.api(`/delegations_detailed?id=eq.${newProxies[0].id}`).then(profiles => {
        return {
          error: false,
          typing: false,
          proxies: (proxies || []).concat(profiles[0] || newProxies[0]),
        }
      })
    })
    .catch((error) => {
      if (error.code === 42501) return { error: { name: true, message: 'You cannot proxy to yourself' } }
      if (error.code === 23514) {
        if (~error.message.indexOf('delegations_check')) return { error: { name: true, message: 'You cannot proxy to yourself' } }
        if (~error.message.indexOf('email')) return { error: { email: true, message: 'Invalid email address' } }
      }
      if (error.code === 23505) return { error: { name: true, message: `You've already added them` } }
      if (error.code === 'P0001') return this.location.redirect('/get_started/basics?notification=proxy_wo_name')
      return { error: { name: true, message: error.message } }
    })
  }

  render() {
    const { id, proxies } = this.state
    return this.html`
      <form style="display: inline;" method="POST" onsubmit=${this} action=${this}>
        <input name="add_proxy[to_id]" type="hidden" value="${id}" />
        <button class="button is-small" disabled type="submit">
          <span class="icon"><i class="fa fa-handshake-o"></i></span>
          <span>Added</span>
        </button>
      </form>
      ${proxies.some(d => d.to_id === id) ? RemoveProxyButton.for(this, `remove-proxy-button-${id}`) : []}
    `
  }
}
