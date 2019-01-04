const noop = () => {}
const { API_URL, WWW_URL } = process.env
const fetch = require('isomorphic-fetch')
const { runtime } = require('raj')
const { wire } = require('viperhtml')
const pathToRegexp = require('path-to-regexp')
const url = require('url')

const routes_ = require('./routes')

const routes = Object.keys(routes_).map((path) => {
  const keys = []
  const regexp = pathToRegexp(path, keys)
  return { keys, loader: routes_[path].fn, title: routes_[path].page_title, path, regexp }
})

routes.notFound = { ...routes[0], status: 404 }

const match = (url) => {
  for (let i = 0, l = routes.length; i < l; i++) {
    const route = routes[i]
    if (route.regexp.test(url)) {
      const matches = route.regexp.exec(url)
      route.params = matches.slice(1).reduce((b, a, i) => {
        b[route.keys[i].name] = a
        return b
      }, {})
      return route
    }
  }

  const notFound = routes.notFound
  return typeof notFound === 'function' ? notFound.call(this) : notFound
}

exports.loadPage = (url, status = 200, dispatch, scroll = true) => {
  const urlWithoutHash = url.split('#')[0]
  const hash = url.split('#')[1] || ''
  const pathname = urlWithoutHash.split('?')[0]
  const search = urlWithoutHash.split('?')[1]
  const matched = match(pathname)
  const location = {
    params: matched.params,
    path: pathname,
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
    page_title: matched.title,
    scroll: hash ? false : scroll,
    loader: typeof matched.loader === 'function' ? matched.loader.call(this) : matched.loader,
  })
}

exports.avatarURL = ({ gravatar_hash, twitter_username }) => {
  if (twitter_username) return `${WWW_URL}/rpc/avatarsio/${twitter_username}`
  return `https://www.gravatar.com/avatar/${gravatar_hash}?d=mm&s=200`
}

const map = new WeakMap()

exports.redirect = (url, code) => (dispatch) => {
  if (typeof window === 'object') {
    window.history.pushState({}, null, url)
  }
  exports.loadPage(url, code || 303, dispatch)
}

exports.preventDefault = (event) => () => {
  event.preventDefault()
}

exports.html = (id) => {
  return function mwire(tpl, ...interp) {
    const w = map.get(tpl) || {}
    if (!w[id]) {
      w[id] = wire()
      map.set(tpl, w)
    }
    return w[id](tpl, ...interp)
  }
}

exports.raj = (program) => {
  let wire = ''
  runtime({
    ...program,
    view: (state, dispatch) => {
      wire = program.view(state, dispatch)
      return wire
    },
  })
  return wire
}

exports.mapEffect = (type, effect) => (dispatch) => {
  if (effect) {
    return effect((event) => {
      dispatch({ type, event })
    })
  }
}

exports.mapEvent = (type, dispatch) => (event) => dispatch({ type, event })

exports.combineEffects = (...effects) => (dispatch) => {
  effects.forEach((effect) => effect && effect(dispatch))
}

exports.runInSeries = (...effects) => (dispatch) => {
  return effects.reduce((b, a) => {
    if (!a) return b
    return b.then(() => a(dispatch))
  }, Promise.resolve())
}

exports.cookies = require('browser-cookies')

exports.api = (url, params = {}) => {
  const storage = params.storage
  params.headers = params.headers || {}
  if (storage && storage.get('jwt')) {
    params.headers.Authorization = `Bearer ${storage.get('jwt')}`
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
        const refresh_token = storage && storage.get('refresh_token')

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
            storage.set('jwt', jwt, { expires: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)) })

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
            storage.unset('refresh_token')
            storage.unset('jwt')
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

exports.serverHyperloopContext = class HyperloopContext {
  constructor(initialState = {}, req, res) {
    this.initializing = false
    this.location = {
      method: req.method,
      path: url.parse(req.originalUrl).pathname,
      redirect: this.redirect.bind(this),
      query: req.query,
      setStatus: this.setStatus.bind(this),
      ip: req.ip,
      url: req.originalUrl,
      userAgent: req.get('User-Agent') || 'Unknown',
    }
    this.body = req.body
    this.res = res
    this.redirected = false
    this.rendering = false
    this.state = Object.assign({}, initialState)

    const store = {}

    this.storage = {
      get: (key) => {
        const info = store[key]
        if (req.cookies[key]) {
          return req.cookies[key]
        }
        if (info && (!info.expires || info.expires > (new Date()))) {
          return info.val
        }
      },
      set: (key, val, opts) => {
        store[key] = { val, opts }
        return res.cookie(key, val, opts)
      },
      unset: (key) => {
        store[key] = undefined
        return res.clearCookie(key)
      },
    }
  }

  form() {
    return this.body
  }

  initialize(RootComponent, location) {
    // resolve all oninit() and onsubmit() handlers before rendering
    this.initializing = true

    return RootComponent.for({ }, { ...location, context: this }).then(() => {
      this.initializing = false
      return wire()`${this.render()}`
    })
    .catch(error => {
      if (~error.message.indexOf('updates[(i - 1)] is not a function')) {
        const message = `Malformed template (usually a result of malformed HTML or interpolations inside attribute values, such as class="foo \${bar}" which should be class=\${\`foo \${bar}\`})`
        error.stack = [message].concat(error.stack.split('\n').slice(1)).join('\n')
        error.message = message
      }
      return Promise.reject(error)
    })
  }

  redirect(code, url) {
    if (!this.redirected) {
      this.redirected = true
      if (arguments.length === 1) {
        this.res.redirect(code)
      } else {
        this.res.redirect(code, url)
      }
    }
  }

  render() {
    let result
    if (!this.rendering) {
      this.rendering = true
      result = this.root.render(this.root.props, this.state)
      this.rendering = false
    }
    return result
  }

  setStatus(code) {
    this.res.status(code)
  }
}

exports.browserHyperloopContext = class HyperloopContext {
  constructor(state = {}) {
    const cookies = require('browser-cookies')
    this.initializing = false
    this.redirect = this.redirect.bind(this)
    this.rendering = false
    this.state = state
    this.storage = {
      get: (key) => {
        return cookies.get(key)
      },
      set: (key, val, opts) => {
        return cookies.set(key, val, opts)
      },
      unset: (key) => {
        return cookies.erase(key)
      },
    }
  }

  get location() {
    const qs = require('qs')
    return {
      method: 'GET',
      path: window.location.pathname,
      redirect: this.redirect,
      query: qs.parse(window.location.search.slice(1)),
      setStatus: this.setStatus,
      hash: window.location.hash,
      url: window.location.pathname + window.location.search,
      userAgent: window.navigator.userAgent || 'Unknown',
    }
  }

  form(form) {
    const parseForm = require('parse-form')
    return parseForm.parse(form).body
  }

  initialize(RootComponent, location) {
    this.initializing = true

    this.root = null
    return RootComponent.for({}, { ...location, context: this }).then(() => {
      this.initializing = false
      return this.render()
    })
    .catch(error => {
      if (~error.message.indexOf('updates[(i - 1)] is not a function')) {
        const message = `Malformed template (usually a result of malformed HTML or interpolations inside attribute values, such as class="foo \${bar}" which should be class=\${\`foo \${bar}\`})`
        error.stack = [message].concat(error.stack.split('\n').slice(1)).join('\n')
        error.message = message
      }
      return Promise.reject(error)
    })
  }

  redirect(code, url) {
    if (!url) url = code
    if (url[0] === '/') {
      window.dispatchEvent(new window.CustomEvent('redirect', {
        detail: { url, code },
      }))
    } else {
      window.location.href = url
    }
  }

  render() {
    let result
    if (!this.rendering) {
      this.rendering = true
      result = this.root.render(this.root.props, this.state)
      this.rendering = false
    }
    return result
  }

  setStatus() {}
}

exports.hyperloopComponent = class Component {
  // components require a context which provides functionality specific to the environment (browser or server)
  constructor(props, context) {
    if (typeof context !== 'object') {
      throw new Error(`HyperloopContext instance is required to instantiate components`)
    }

    Object.defineProperties(this, {
      context: { value: context },
      initializing: { value: false, writable: true },
      node: { value: null, writable: true },
      props: { value: Object.assign({}, props) },
      wire: { value: null, writable: true },
    })

    if (!context.initializing && this.oninit) {
      this.initializing = true
      Promise.resolve(this.oninit()).then((newState) => {
        this.initializing = false
        this.setState(newState)
      })
    }
  }

  static for(parent, props = {}, id, render) {
    // optional id argument to differentiate multiple children of the same class
    if (typeof props === 'string') {
      id = props
      props = {}
    }

    // fetch the previous child component for this parent
    const context = parent.context || props.context
    const info = components.get(parent) || cacheComponent(parent)
    const component = getComponent(this, context, props, info, id == null ? `${this.name}-default` : id)

    // set root to first component to instantiate
    if (!context.root) context.root = component

    // when initializing, return a promise of all oninit() and onsubmit() functions
    if (context.initializing) {
      return component.handleEvent({ type: 'init', preventDefault: noop, stopPropagation: noop }).then(() => {
        if (context.location.method === 'POST') {
          if (!context.location.query.action || context.location.query.action === component.constructor.name) {
            return component.handleEvent({ type: 'submit', preventDefault: noop, stopPropagation: noop }).then(() => {
              return Promise.all(component.render(component.props, component.state))
            })
          }
        }
        return Promise.all(component.render(component.props, component.state))
      })
    }

    component.setProps(props)

    if (render === false) return component
    return component.render(component.props, component.state)
  }

  // dispatches events to any instance function of the same event name, such as "onsubmit" or "onclick"
  // provides easy event binding in templates by using "this": <button onclick=${this}>Click me</button>
  handleEvent(event) {
    const handler = this[`on${event.type}`]

    if (handler) {
      let formData = null

      if (event.type === 'submit') {
        formData = this.context.form(event.currentTarget)
      }

      // set new state if returned from event handler
      return Promise.resolve(handler.call(this, event, formData)).then((newState) => {
        if (newState) this.setState(newState)
      })
    }
    return Promise.resolve()
  }

  get html() {
    if (this.context.initializing) return promisedInterpolations
    if (!this.wire) this.wire = wire(null, 'html')
    return this.wire
  }

  get isBrowser() {
    return typeof window === 'object'
  }

  get isServer() {
    return typeof window !== 'object'
  }

  get location() {
    return this.context.location
  }

  setProps(props) {
    const target = this.props
    Object.assign(target, props)
    return this
  }

  setState(newState, render) {
    const state = this.context.state
    if (typeof newState === 'function') {
      newState = newState(state)
    }
    if (newState) {
      Object.assign(state, newState)
    }
    if (!this.initializing && !this.context.initializing && render !== false) this.context.render()
    return this
  }

  get state() {
    return this.context.state
  }

  get storage() {
    return this.context.storage
  }

  get svg() {
    if (this.context.initializing) return promisedInterpolations
    if (!this.wire) this.wire = wire(null, 'svg')
    return this.wire
  }

  toString() {
    return `?action=${this.constructor.name}`
  }
}

const components = new WeakMap()

function getComponent(Component, context, props, info, id) {
  switch (typeof id) {
    case 'object':
    case 'function':
      const wm = info.w || (info.w = new WeakMap())
      let component = wm.get(id)
      if (!component) {
        component = new Component(props, context)
        wm.set(id, component)
      }
      return component
    default:
      const sm = info.p || (info.p = Object.create(null))
      return sm[id] || (sm[id] = new Component(props, context))
  }
}

function cacheComponent(component) {
  const info = { w: null, p: null }
  components.set(component, info)
  return info
}

function promisedInterpolations(...args) {
  // returns all promised interpolations
  return Array.prototype.slice.call(args, 1).filter((value) => {
    return value !== null && typeof value === 'object' && typeof value.then === 'function'
  })
}
