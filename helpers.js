const { API_URL, WWW_URL } = process.env
const server = typeof window !== 'object'
const fetch = require('isomorphic-fetch')
const pathToRegexp = require('path-to-regexp')
const routes = require('./routes')
const qs = require('qs')

exports.handleForm = (dispatch, appEvent) => (domEvent) => {
  const method = domEvent.currentTarget.getAttribute('method')
  const data = {
    ...appEvent.location ? appEvent.location.query : {},
    ...parse(domEvent.currentTarget).body,
  }

  Object.keys(data).forEach((key) => {
    if (data[key] === 'false') data[key] = false
    if (method !== 'GET') {
      if (data[key] === 'on' || data[key] === 'true') data[key] = true
      if (data[key] === '') data[key] = null
    }
  })

  if (method === 'GET') {
    domEvent.preventDefault()
    dispatch({
      type: 'redirected',
      url: `${appEvent.location.path}?${Object.keys(data).map((key) => {
        return `${key}=${data[key]}`
      }).join('&')}`,
    })
  } else {
    dispatch({ ...data, ...appEvent, event: domEvent })
  }
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

exports.avatarURL = (user) => {
  const { image, gravatar_hash, twitter_username } = user || {}
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
          const urlQuery = url.split('?')[1]
          url = `https://www.youtube.com/embed/${videoMatch[6]}`
          if (urlQuery) {
            const params = qs.parse(urlQuery)
            if (params.t) {
              url += '?start='
              if (params.t.includes('m')) {
                const parts = params.t.split('m')
                const minutes = parts[0]
                const seconds = parts[1].split('s')[0] || '0'
                const totalSeconds = (Number(minutes) * 60) + Number(seconds)
                url += totalSeconds
              } else {
                url += params.t
              }
            }
          }
        } else if (videoMatch[3].slice(0, 5) === 'vimeo') {
          url = `https://player.vimeo.com/video/${videoMatch[6]}`
        } else {
          url = `https://media.cityofmadison.com/Mediasite/Play/${videoMatch[6]}`
        }
        return `
          <div style="max-width: 100%; background: hsla(0, 0%, 87%, 0.25);"><div class="responsive-video-outer" style="margin: 0 auto;"><div class="responsive-video-inner"><iframe width="560" height="315" src="${url}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe></div></div></div>
        `
      }
      if (url.match(/\.(png|jpg|jpeg|gif)$/i)) {
        return `<div class="responsive-image" style="text-align: center; line-height: 0;"><img alt="${url}" src="${url}" style="max-height: 380px; max-width: 100%; height: auto;" /></div>`
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
  return effects.reduce((promise, effect) => promise.then(() => Promise.resolve(effect && effect(dispatch))), Promise.resolve())
}

// Wait for all promises before dispatching optional event
exports.waitEffects = (effects, finalEvent) => (dispatch) => {
  Promise.all(effects.filter((effect) => effect).map((effect) => Promise.resolve(effect(dispatch)))).then(() => {
    if (finalEvent) dispatch(finalEvent)
  })
}

exports.api = (dispatch, url, params = {}) => {
  params.url = url
  params.headers = params.headers || {}
  if (params.user && params.user.jwt) {
    params.headers.Authorization = `Bearer ${params.user.jwt}`
  }
  if (typeof params.pagination === 'object') {
    params.headers['Range-Unit'] = 'items'
    params.headers.Range = `${params.pagination.offset}-${Number(params.pagination.offset) + Number(params.pagination.limit)}`
    if (typeof params.pagination.count !== 'number') {
      params.headers.Prefer = 'count=exact'
    }
  }
  return fetch(`${API_URL}${url}`, {
    ...params,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...params.headers,
    },
  }).then((res) => {
    // No body, return response object
    if (res.status === 201 && !params.headers.Prefer) return res
    if (res.status < 400 && params.headers.Prefer === 'return=minimal') return res
    if (res.status === 204) return res

    // Refresh token negotiation
    if (res.status >= 400 && res.status < 500) {
      return parseApiError(res, params, dispatch)
    }

    return parseApiResponse(res, params)
  })
  .catch(error => {
    console.log(error)
    if (error.message.match(/^NetworkError/)) {
      dispatch({ type: 'error:network', error })
    } else {
      return Promise.reject(error)
    }
  })
}

const parseApiResponse = (res, params) => {
  const isJSON = ~res.headers.get('Content-Type').indexOf('json')
  return (isJSON ? res.json() : res.text()).then((results) => {
    if (typeof params.pagination === 'object') {
      const count = typeof params.pagination.count !== 'number' ? Number(res.headers.get('Content-Range').split('/')[1]) : null
      return {
        results,
        pagination: {
          ...params.pagination,
          next: (Number(params.pagination.offset) + Number(params.pagination.limit)) < count ? {
            limit: Number(params.pagination.limit),
            offset: Number(params.pagination.offset) + Number(params.pagination.limit),
          } : null,
          prev: Number(params.pagination.offset) > 0 ? {
            limit: Number(params.pagination.limit),
            offset: Number(params.pagination.offset) - Number(params.pagination.limit),
          } : null,
          count,
        },
      }
    }
    return results
  })
}

const parseApiError = (res, params, dispatch) => {
  const url = params.url
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
      .then(results => {
        if (!results[0]) {
          return Promise.reject(Object.assign(new Error(`Session not found!`), { status: 500 }))
        }
        return results[0]
      })
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
            return res.json().then(json => apiError(json, res))
          }
          return parseApiResponse(res, params)
        })
      })
      .catch(error => {
        console.log(error)
        dispatch({ type: 'session:signedOut' })
        dispatch({ type: 'cookieUnset', key: 'refresh_token' })
        dispatch({ type: 'cookieUnset', key: 'jwt' })
        if (error.message.match(/^NetworkError/)) {
          dispatch({ type: 'error:network', error })
        }
      })
    }
    return apiError(json, res)
  })
}

const apiError = (json, res) => {
  const error = new Error(json.message)
  error.details = json.details
  error.status = res.status
  error.code = isNaN(json.code) ? json.code : Number(json.code)
  error.hint = json.hint
  return Promise.reject(error)
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

exports.svg = server
  ? serverHtml
  : require('lighterhtml-plus').svg

exports.download = (content, fileName, mimeType) => {
  const a = document.createElement('a')
  mimeType = mimeType || 'application/octet-stream'

  if (window.navigator.msSaveBlob) { // IE10
    window.navigator.msSaveBlob(new window.Blob([content], {
      type: mimeType
    }), fileName)
  } else if (URL && 'download' in a) { // html5 A[download]
    a.href = URL.createObjectURL(new window.Blob([content], {
      type: mimeType
    }))
    a.setAttribute('download', fileName)
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } else {
    window.location.href = `data:application/octet-stream,${encodeURIComponent(content)}` // only this mime type is supported
  }
}

exports.prettyShortId = (shortId) => {
  return (shortId || '')
    .split('-')
    .slice(1)
    .join('-')
    .toUpperCase()
    .replace(/(\d+)/, ' $1')
}

const q_set_1 = typeof window === 'object' && require("q-set")
const validTags = {
    BUTTON: true,
    INPUT: true,
    SELECT: true,
    TEXTAREA: true
}

/* eslint-disable */
/**
 * @description
 * Serialize a html form as JS object.
 *
 * @param form The html form to parse.
 * @param shallow If true, nested properties such as "a[b]" will not be resolved.
 */
function parse(form, shallow) {
  if (!form || !(form instanceof HTMLFormElement)) {
      throw new Error("Can only parse form elements.")
  }
  var enctype = form.enctype, elements = form.elements
  var set = shallow ? q_set_1.shallow : q_set_1.deep
  var isMultiPart = enctype === "multipart/form-data"
  var body = {}
  /* istanbul ignore next */
  var files = isMultiPart ? {} : undefined
  var activeElement = getActiveElement()
  for (var _i = 0, _a = elements; _i < _a.length; _i++) {
      var el = _a[_i]
      var name_1 = el.name
      // Check if this el should be serialized.
      if (el.disabled || !(name_1 && validTags[el.nodeName])) {
          continue // eslint-disable-line no-continue
      }
      switch (el.type) {
          case "submit":
              // We check if the submit button is active
              // otherwise all type=submit buttons would be serialized.
              if (el === activeElement) {
                  set(body, name_1, el.value)
              }
              break
          case "checkbox":
          case "radio":
              if (el.checked) {
                  set(body, name_1, el.value)
              }
              break
          case "select-one":
              if (el.selectedIndex >= 0) {
                  set(body, name_1, el.options[el.selectedIndex].value)
              }
              break
          case "select-multiple":
              var selected = []
              for (var _b = 0, _c = el.options; _b < _c.length; _b++) {
                  var option = _c[_b]
                  if (option && option.selected) {
                      selected.push(option.value)
                  }
              }
              set(body, name_1, selected)
              break
          case "file":
              /* istanbul ignore next */
              if (isMultiPart && el.files) {
                  for (var _d = 0, _e = el.files; _d < _e.length; _d++) {
                      var file = _e[_d]
                      set(files, name_1, file)
                  }
              }
              break
          default:
              set(body, name_1, el.value)
      }
  }
  return { body, files }
}

/**
 * Tracks which button submitted a form last.
 * This is a patch for safari which does not properly focus the clicked button.
 */
let clickTarget = null

if (typeof window === 'object') {
  window.addEventListener("click", (e) => {
      // Ignore canceled events, modified clicks, and right clicks.
      if (e.defaultPrevented ||
          e.metaKey ||
          e.ctrlKey ||
          e.shiftKey ||
          e.button !== 0) {
          return
      }
      let el = e.target
      // Find an <button> element that may have been clicked.
      while (el != null && (el.nodeName !== "BUTTON" || el.type !== "submit")) {
          el = el.parentNode
      }
      // Store the button that was clicked.
      clickTarget = el
  })
}

/**
 * Patch for document.activeElement for safari.
 */
function getActiveElement() {
  const el = document.activeElement === document.body
      ? clickTarget
      : document.activeElement
  clickTarget = null
  return el
}
/* eslint-enable */
