const fetch = require('isomorphic-fetch')
const hyperloop = require('hyperloop')

module.exports = class Component extends hyperloop.Component {
  api(path, params = {}) {
    const API_URL = this.state.config.API_URL
    const jwt = this.storage.get('jwt') || params.jwt

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
      if (res.status < 400 && params.headers && params.headers.Prefer === 'return=minimal') return {}
      if (res.status === 204) return {}
      if (res.status >= 400 && res.status < 500) {
        return res.json().then((json) => {
          const refresh_token = this.storage.get('refresh_token')

          if (json.message === 'JWT expired' && refresh_token) {
            return fetch(`${API_URL}/rpc/refresh_jwt`, {
              method: 'POST',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ refresh_token }),
            })
            .then(res => res.json())
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
  avatarURL({ gravatar_hash, picture_id, twitter_avatar, twitter_username }) {
    const { IMAGES_URL } = this.state.config
    if (twitter_avatar) return `https://avatars.io/twitter/${twitter_username}`
    if (picture_id) return `${IMAGES_URL}/${picture_id}`
    return `https://www.gravatar.com/avatar/${gravatar_hash}?d=mm&s=200`
  }
  linkifyUrls(text) {
    this.htmlTagsToReplace = this.htmlTagsToReplace || {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;'
    }
    this.htmlRegex = this.htmlRegex || /[&<>]/g
    this.urlRegex = this.urlRegex || /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/ig
    return text.replace(this.htmlRegex, (char) => {
      return this.htmlTagsToReplace[char] || char
    }).replace(this.urlRegex, (url) => {
      return `<a href="${url}">${url}</a>`
    }).replace(/\n/g, '<br />')
  }
}
