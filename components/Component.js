const { WWW_URL } = process.env
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
  avatarURL({ gravatar_hash, image, twitter_username }) {
    if (image) return `${WWW_URL}/rpc/image-proxy/${encodeURIComponent(image)}`
    if (twitter_username) return `${WWW_URL}/rpc/avatarsio/${twitter_username}`
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
      .replace(/&lt;(\/?)(i|p|br|ul|ol|li|strong|a|b)&gt;/gi, (match, p1, p2) => {
        return `<${p1}${p2}>`
      })
  }
  linkifyUrls(text = '') {
    return this.escapeHtml(text)
      .replace(/(\bhttps?:\/\/\S+)/ig, (url) => {
        const videoMatch = (url || '').match(/(http:|https:|)\/\/(player.|www.|media.)?(cityofmadison\.com|vimeo\.com|youtu(be\.com|\.be|be\.googleapis\.com))\/(Mediasite\/Showcase\/madison-city-channel\/Presentation\/|video\/|embed\/|watch\?v=|v\/)?([A-Za-z0-9._%-]*)(&\S+)?/)
        if (videoMatch) {
          if (videoMatch[3].slice(0, 5) === 'youtu') {
            url = `https://www.youtube.com/embed/${videoMatch[6]}`
          } else if (videoMatch[3].slice(0, 5) === 'vimeo') {
            url = `https://player.vimeo.com/video/${videoMatch[6]}`
          } else {
            url = `https://media.cityofmadison.com/Mediasite/Play/${videoMatch[6]}`
          }
          return `
            <div class="responsive-video-outer"><div class="responsive-video-inner"><iframe width="560" height="315" src="${url}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe></div></div>
          `
        }
        if (url.match(/\.(png|jpg|jpeg|gif)$/i)) {
          return `<div class="responsive-image" style="max-width: 560px;"><a href="${url}"><img alt="${url}" src="${url}" style="max-height: 315px; max-width: 100%; height: auto;" /></a></div>`
        }
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
