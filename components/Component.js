const fetch = require('isomorphic-fetch')
const { hyperloopComponent } = require('../helpers')

module.exports = class Component extends hyperloopComponent {
  api(path, params = {}) {
    const API_URL = this.state.config.API_URL
    const jwt = this.storage.get('jwt') || params.jwt

    params.headers = params.headers || {}

    return fetch(`${API_URL}${path}`, {
      ...params,
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': jwt ? `Bearer ${jwt}` : undefined,
        ...params.headers,
      },
    })
    .then((res) => {
      if (res.status === 201 && !params.headers.Prefer) return res
      if (res.status < 400 && params.headers.Prefer === 'return=minimal') return res
      if (res.status === 204) return res
      if (res.status >= 400 && res.status < 500) {
        return res.json().then((json) => {
          const refresh_token = this.storage.get('refresh_token')

          if (json.message === 'JWT expired' && refresh_token) {
            return fetch(`${API_URL}/sessions?select=jwt,refresh_token`, {
              method: 'POST',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Prefer': 'return=representation',
              },
              body: JSON.stringify({ refresh_token }),
            })
            .then(res => res.json())
            .then(results => results[0])
            .then(({ jwt }) => {
              this.storage.set('jwt', jwt, { expires: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)) })

              return fetch(`${API_URL}${path}`, {
                ...params,
                credentials: 'include',
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${jwt}`,
                  ...params.headers,
                },
              })
              .then(res => {
                if (res.status === 204) return {}
                if (res.status >= 400 && res.status < 500) {
                  return res.json().then(json => {
                    const error = new Error(json.message)
                    error.details = json.details
                    error.status = res.status
                    error.code = isNaN(json.code) ? json.code : Number(json.code)
                    error.hint = json.hint
                    throw error
                  })
                }
                return res.json()
              })
            })
            .catch(error => {
              console.log(error)
              this.storage.unset('refresh_token')
              return this.location.redirect('/sign_out')
            })
          }
          const error = new Error(json.message)
          error.details = json.details
          error.status = res.status
          error.code = isNaN(json.code) ? json.code : Number(json.code)
          error.hint = json.hint
          throw error
        })
      }
      return res.json()
    })
  }
  isLiquidTeam(user) {
    return ~[
      'talk@alexmingoia.com',
      'david@dsernst.com',
      'joshua.krafchin@gmail.com',
      'dallasjcole@gmail.com',
    ].indexOf(user && user.email)
  }
  avatarURL({ gravatar_hash, bioguide_id, twitter_avatar, twitter_username }) {
    if (twitter_avatar) return `https://avatars.io/twitter/${twitter_username}`
    if (bioguide_id) return `https://theunitedstates.io/images/congress/225x275/${bioguide_id}.jpg`
    return `https://www.gravatar.com/avatar/${gravatar_hash}?d=mm&s=200`
  }
  capitalize(str = '') {
    return str.slice(0, 1).toUpperCase() + str.slice(1)
  }
  escapeHtml(unsafe, opts = {}) {
    return (unsafe || '')
      .replace(/[<>"'&]/g, (char) => {
        if (char === '<') return '&lt;'
        if (char === '>') return '&gt;'
        if (char === '"') return '&quot;'
        if (char === "'") return '&#039;'
        if (opts.replaceAmp && char === '&') return '&amp;'
        return char
      })
      .replace(/&lt;(\/?)(p|br|ul|ol|li|strong|a|b)&gt;/gi, (match, p1, p2) => {
        return `<${p1}${p2}>`
      })
  }
  linkifyUrls(text = '') {
    return this.escapeHtml(text)
      .replace(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/ig, (url) => {
        return `<a href="${url}">${url}</a>`
      })
      .replace(/\n/g, '<br />')
  }
  possessive(str) {
    if (typeof str === 'string' && str[str.length - 1] === 's') {
      return `${str}'`
    }
    return `${str}'s`
  }
}
