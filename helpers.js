const { API_URL, WWW_URL } = process.env
const server = typeof window !== 'object'
const fetch = require('isomorphic-fetch')
const pathToRegexp = require('path-to-regexp')
const routes = require('./routes')

exports.handleForm = (dispatch, appEvent) => (domEvent) => {
  const data = require('parse-form').parse(domEvent.currentTarget).body
  Object.keys(data).forEach((key) => {
    if (data[key] === 'on' || data[key] === 'true') data[key] = true
    if (data[key] === 'false') data[key] = false
    if (data[key] === '') data[key] = null
  })
  dispatch({ ...data, ...appEvent, event: domEvent })
}

exports.makePoint = (lon, lat) => {
  if (lon && lat) {
    return `POINT(${lon} ${lat})`
  }
  return null
}


const routeStack = Object.keys(routes).map((path) => {
  const keys = []
  const regexp = pathToRegexp(path, keys)
  return { keys, loader: routes[path], path, regexp }
})

const match = (url) => {
  for (let i = 0, l = routeStack.length; i < l; i++) {
    const route = routeStack[i]
    if (route.regexp.test(url)) {
      const matches = route.regexp.exec(url)
      route.params = matches.slice(1).reduce((b, a, i) => {
        b[route.keys[i].name] = a.toLowerCase()
        return b
      }, {})
      return route
    }
  }

  return { loader: routes['not-found'], path: 'not-found', status: 404 }
}

exports.loadPage = (url, status = 200, dispatch, scroll = true) => {
  const urlWithoutHash = url.split('#')[0]
  const hash = url.split('#')[1] || ''
  const pathname = urlWithoutHash.split('?')[0]
  const search = urlWithoutHash.split('?')[1]
  const matched = match(pathname)
  const location = {
    params: matched.params || {},
    path: pathname,
    route: matched.path,
    query: (search || '').split('&').reduce((b, a) => {
      const [key, val] = a.split('=')
      b[key] = val
      return b
    }, {}),
    status: matched.status || status,
    url,
    hash,
  }

  if (typeof window === 'object') {
    location.userAgent = window.navigator.userAgent || 'Unknown'
    if (pathname === window.location.pathname) {
      window.history.replaceState({}, null, url)
    }
  }

  dispatch({
    type: 'pageChanged',
    location,
    scroll: hash ? false : scroll,
    loader: matched.loader,
  })
}

exports.avatarURL = ({ image, gravatar_hash, twitter_username }) => {
  if (image) return `${WWW_URL}/rpc/image-proxy/${encodeURIComponent(image)}`
  if (twitter_username) return `${WWW_URL}/rpc/avatarsio/${twitter_username}`
  return `https://www.gravatar.com/avatar/${gravatar_hash}?d=mm&s=200`
}

exports.capitalize = (str = '') => {
  return str.slice(0, 1).toUpperCase() + str.slice(1)
}

exports.linkifyUrls = (text = '') => {
  const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/ig
  return exports.escapeHtml(text)
    .replace(urlRegex, (url) => {
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
        return `<div class="responsive-image" style="max-width: 100%; background: hsla(0, 0%, 87%, 0.25); text-align: center;"><a href="${url}"><img alt="${url}" src="${url}" style="max-height: 380px; max-width: 100%; height: auto;" /></a></div>`
      }
      let displayedUrl = url.replace(/https?:\/\/(www\.)?/, '')
      if (displayedUrl.length > 25) {
        displayedUrl = `${displayedUrl.slice(0, 25)}...`
      }
      return `<a href="${url}" target="_blank" rel="nofollow">${displayedUrl}</a>`
    })
    .replace(/\n/g, '<br />')
    .replace(/[a-z0-9.+_-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)*/ig, (email) => {
      return `<a href="mailto:${email}">${email}</a>`
    })
}

exports.escapeHtml = (unsafe, opts = { replaceApos: true }) => {
  return (unsafe || '')
    .replace(/[<>"'&]/g, (char) => {
      if (char === '<') return '&lt;'
      if (char === '>') return '&gt;'
      if (char === '"') return '&quot;'
      if (opts.replaceApos && char === "'") return '&#039;'
      if (opts.replaceAmp && char === '&') return '&amp;'
      return char
    })
    .replace(/&lt;(\/?)(i|p|br|ul|ol|li|strong|s|strike|a|b)&gt;/gi, (match, p1, p2) => {
      return `<${p1}${p2}>`
    })
    .replace(/\bhttps?:\/\/\S+\.(png|jpg|jpeg|gif)\b/gi, (match) => {
      return opts.stripImages ? '' : match
    })
}

exports.redirect = (url, code) => (dispatch) => {
  if (typeof window === 'object') {
    window.history.replaceState({}, null, url)
  }
  exports.loadPage(url, code || 303, dispatch)
}

exports.preventDefault = (event) => () => {
  if (event) event.preventDefault()
}

exports.possessive = (str) => {
 if (typeof str === 'string' && str[str.length - 1] === 's') return `${str}'`
 return `${str}'s`
}

exports.mapEffect = (type, effect) => (dispatch) => {
  if (effect) {
    return effect((event) => {
      dispatch({ type, event })
    })
  }
}

exports.mapEvent = (type, dispatch) => (event) => dispatch({ type, event })

exports.combineEffects = (effects) => (dispatch) => {
  effects.forEach((effect) => effect && effect(dispatch))
}

exports.combineEffectsInSeries = (effects) => (dispatch) => {
  effects.reduce((promise, effect) => promise.then(() => Promise.resolve(effect && effect(dispatch))), Promise.resolve())
}

exports.api = (dispatch, url, params = {}) => {
  params.headers = params.headers || {}
  if (params.user && params.user.jwt) {
    params.headers.Authorization = `Bearer ${params.user.jwt}`
  }
  return fetch(`${API_URL}${url}`, {
    ...params,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...params.headers,
    },
  }).then((res) => {
    if (res.status === 201 && !params.headers.Prefer) return res
    if (res.status < 400 && params.headers.Prefer === 'return=minimal') return res
    if (res.status === 204) return res
    if (res.status >= 400 && res.status < 500) {
      return res.json().then((json) => {
        const refresh_token = params.user && params.user.refresh_token

        if (json.message === 'JWT expired') {
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
            const oneYearFromNow = new Date(Date.now() + (365 * 24 * 60 * 60 * 1000))
            dispatch({ type: 'cookieSet', key: 'jwt', value: jwt, opts: { expires: oneYearFromNow } })
            dispatch({ type: 'user:updated', user: { ...params.user, jwt } })

            return fetch(`${API_URL}${url}`, {
              ...params,
              credentials: 'include',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                ...params.headers,
                'Authorization': `Bearer ${jwt}`,
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
            dispatch({ type: 'session:signedOut' })
            dispatch({ type: 'cookieUnset', key: 'refresh_token' })
            dispatch({ type: 'cookieUnset', key: 'jwt' })
          })
        }
        const error = new Error(json.message)
        error.details = json.details
        error.status = res.status
        error.code = isNaN(json.code) ? json.code : Number(json.code)
        error.hint = json.hint
        return Promise.reject(error)
      })
    }
    return res.json()
  })
}

const viperhtml = require('viperhtml')
const serverHtml = (tpl, ...chunks) => {
  const chunksWithoutHandlers = chunks.map((chunk, i) => {
    if ((tpl[i].slice(-2) === '="' || tpl[i].slice(-1) === '=') && typeof chunk === 'function') {
      return ''
    }
    return chunk
  })
  return viperhtml.wire()(tpl, ...chunksWithoutHandlers)
}
serverHtml.for = () => serverHtml

exports.html = server
  ? serverHtml
  : require('lighterhtml-plus').html
