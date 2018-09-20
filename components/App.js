const { APP_NAME, NODE_ENV, WWW_URL } = process.env
const pathToRegexp = require('path-to-regexp')
const fetch = require('isomorphic-fetch')

const { api, html, runInSeries, combineEffects, mapEffect, mapEvent } = require('../helpers')
const routes_ = require('../routes')
const Navbar = require('./NavBar')
const Footer = require('./Footer')
const ContactWidget = require('./ContactWidget')

module.exports = {
  load,
  init: [{
    footer: Footer.init[0],
    location: {
      ip: '',
      path: '/',
      params: {},
      query: {},
      status: 200,
      url: '/',
    },
    navbar: Navbar.init[0],
    route: {},
    routeView: null,
    storage: {},
    user: null,
    contactWidget: ContactWidget.init[0],
  }, watchHistory],
  update: (event, state) => {
    switch (event.type) {
      case 'contactWidgetEvent':
        const [contactWidgetState, contactWidgetEffect] = ContactWidget.update(event.event, state.contactWidget)
        return [{ ...state, contactWidget: contactWidgetState }, mapEffect('contactWidgetEvent', contactWidgetEffect)]
      case 'footerEvent':
        const [footerState, footerEffect] = Footer.update(event.event, state.footer)
        return [{ ...state, footer: footerState }, mapEffect('footerEvent', footerEffect)]
      case 'hyperloopRouteLoaded':
        return [state, initHyperloop(state.hyperloop, state.location, event.component)]
      case 'hyperloopStateChanged':
        return [{ ...state, ...event.state, hyperloop: state.hyperloop }]
      case 'navbarEvent':
        const [navbarState, navbarEffect] = Navbar.update(event.event, state.navbar)
        return [
          { ...state, navbar: navbarState },
          mapEffect('navbarEvent', navbarEffect),
        ]
      case 'pageChanged':
        return [{
          ...state,
          page_title: event.page_title || state.page_title,
          location: { ...state.location, ...event.location },
          navbar: { ...state.navbar, location: event.location },
          contactWidget: { ...state.contactWidget, url: event.location.url },
          routeView: event.view || state.routeView
        }, combineEffects(
          changePageTitle(event.page_title || state.page_title),
          stopNProgress(),
          scrollToTop(),
          mapEffect('footerEvent', Footer.randomQuote),
          trackPageView(state.storage)
        )]
      case 'repsRequested':
        return [state]
      case 'repsReceived':
        return [{ ...state, reps: event.reps, geoip: event.geoip }]
      case 'repsReceivedError':
        console.log(event.error)
        return [state]
      case 'routeLoaded':
        const hyperloopOrRajPageChange =
          event.view.for
            ? (dispatch) => dispatch({ type: 'hyperloopRouteLoaded', component: event.view })
            : (dispatch) => dispatch({ type: 'pageChanged', view: event.view })

        return [state, runInSeries(
          startNProgress(),
          fetchUserAndReps(state),
          hyperloopOrRajPageChange
        )]
      case 'userRequested':
        return [state]
      case 'userReceived':
        return [{
          ...state,
          user: event.user,
          navbar: { ...state.navbar, user: event.user },
          contactWidget: { ...state.contactWidget, user: event.user },
        }]
      case 'userReceivedError':
        console.log(event.error)
        return [state]
      default:
        return [state]
    }
  },
  view: ({ contactWidget, footer, route, routeView, navbar }, dispatch) => {
    return html()`
      <div id="wrapper">
        ${Navbar.view(navbar, mapEvent('navbarEvent', dispatch))}
        ${routeView ? routeView(route, mapEvent('routeEvent', dispatch)) : ''}
      </div>
      <div>${Footer.view(footer, mapEvent('footerEvent', dispatch))}</div>
      ${ContactWidget.view(contactWidget, mapEvent('contactWidgetEvent', dispatch))}
    `
  },
}

const fetchUserAndReps = ({ location, storage, user }) => (dispatch) => {
  if (user) return fetchReps({ location, storage, user })(dispatch)
  return Promise.resolve(fetchUser(storage)(dispatch))
    .then((user) => fetchReps({ location, storage, user })(dispatch))
}

const fetchReps = ({ location, storage, user }) => (dispatch) => {
    const address = user && user.address

    if (address) {
      return api('/rpc/user_offices', {
        method: 'POST',
        body: JSON.stringify({ user_id: user.id }),
        jwt: storage.get('jwt'),
      })
      .then((reps) => dispatch({ type: 'repsReceived', reps: reps || [] }))
      .catch((error) => dispatch({ type: 'repsReceivedError', error }))
    }

    let ip = location.ip

    if (!ip || (ip === '::1' && NODE_ENV !== 'production')) ip = '198.27.235.190'

    return fetch(`${WWW_URL}/rpc/geoip/${ip}`, {
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-cache',
      mode: 'no-cors',
    })
    .then(response => response.json())
    .then((geoip) => {
      if (!geoip) {
        return dispatch({ type: 'repsReceived', reps: [] })
      }
      return api('/rpc/point_to_offices', {
        method: 'POST',
        body: JSON.stringify({ lon: Number(geoip.lon), lat: Number(geoip.lat) }),
      })
      .then(reps => {
        if (!reps) reps = []
        storage.set('geoip_house_rep', reps[0] ? reps[0].user_id : 'not_found')
        dispatch({ type: 'repsReceived', reps, geoip })
      })
    })
    .catch((error) => {
      console.error(error)
      dispatch({ type: 'repsReceivedError', error })
    })
}

const fetchUser = (storage) => (dispatch) => {
  const userId = storage.get('user_id')
  const jwt = storage.get('jwt')
  if (userId && jwt) {
    dispatch({ type: 'userRequested' })
    return api(`/users?select=id,about,intro_video_url,email,first_name,last_name,username,cc_verified,voter_status,update_emails_preference,address:user_addresses(id,address)&id=eq.${userId}`, { jwt })
    .then(users => {
      const user = {
        ...users[0],
        address: users[0] ? users[0].address[0] : null,
      }
      dispatch({ type: 'userReceived', user })
    })
    .catch((error) => {
      console.log(error)
      dispatch({ type: 'userReceivedError', error })
    })
  }
}

const startNProgress = () => () => {
  if (typeof window === 'object') {
    if (window.nprogressTimeout) clearTimeout(window.nprogressTimeout)
    window.nprogressTimout = setTimeout(() => require('nprogress').start(), 500)
  }
}

const stopNProgress = () => () => {
  if (typeof window === 'object') {
    if (window.nprogressTimeout) clearTimeout(window.nprogressTimeout)
    setTimeout(() => require('nprogress').done(), 1000)
  }
}

const scrollToTop = () => () => {
  if (typeof window === 'object') {
    window.scrollTo(0, 0)
  }
}

function trackPageView(storage) {
  return () => {
    if (typeof window !== 'object') return

    // https://help.luckyorange.com/article/126-tagging-with-javascript
    // https://help.luckyorange.com/article/41-passing-in-custom-user-data
    window._loq = window._loq || []

    api('/pageviews', {
      method: 'POST',
      body: JSON.stringify({
        cookie: storage.get('cookie') || undefined,
        referrer: window.document.referrer,
        url: window.location.pathname + window.location.search,
      }),
    })
    .then((res) => {
      if (!storage.get('cookie')) {
        storage.set('cookie', res.headers.get('Location').slice(17, 53))
      }
      window._loq.push(['custom', { cookie: storage.get('cookie') || '' }])
    })
    .catch((error) => {
      console.log(error)
    })
  }
}

const listeners = (dispatch) => ({
  popstate: () =>
    load(window.location.pathname + window.location.search, 200, dispatch),
  redirect: (event) => {
    const status = event.detail.status || 302
    if (status === 303) {
      window.history.pushState({}, null, event.detail.url)
    } else {
      window.history.replaceState({}, null, event.detail.url)
    }
    load(event.detail.url, status, dispatch)
  },
  click: (event) => {
    const url = window.location.pathname + window.location.search
    const node = event.target
    const parent = node.parentNode
    const anchor = node.tagName === 'A' ? node : (parent && parent.tagName === 'A' && parent)
    const href = anchor && anchor.getAttribute('href')

    if (!event.metaKey && href && href[0] === '/' && href !== url) {
      event.preventDefault()
      window.history.pushState({}, null, href)
      load(href, 200, dispatch)
    }
  },
})

const changePageTitle = (newTitle) => () => {
  if (typeof window === 'object') {
    document.title = newTitle || document.title
  }
}

function watchHistory(dispatch) {
  if (typeof window === 'object') {
    load(window.location.pathname + window.location.search, 200, dispatch)

    const { click, popstate, redirect } = window.__listeners || {}
    window.removeEventListener('popstate', popstate)
    window.removeEventListener('redirect', redirect)
    window.removeEventListener('click', click)

    const l = window.__listeners = listeners(dispatch)
    window.addEventListener('popstate', l.popstate)
    window.addEventListener('redirect', l.redirect)
    window.addEventListener('click', l.click)
  }
}

function load(url, status = 200, dispatch) {
  const pathname = url.split('?')[0]
  const matched = match(pathname)
  const location = {
    params: matched.params,
    path: pathname,
    query: (url.split('?')[1] || '').split('&').reduce((b, a) => {
      const [key, val] = a.split('=')
      b[key] = val
      return b
    }, {}),
    status,
    url,
  }

  const page_title = matched.title ? `${matched.title} ★ ${APP_NAME}` : `${APP_NAME} ★ Liquid Democracy for America`
  dispatch({ type: 'pageChanged', location, page_title })

  if (matched.loader) {
    const loader = typeof matched.loader === 'function' ? matched.loader.call(this) : matched.loader
    if (loader.then) {
      return loader.then((loaded) => {
        dispatch({ type: 'routeLoaded', view: loaded.default || loaded })
      })
    }
    dispatch({ type: 'routeLoaded', view: loader.default || loader })
  }
}

const initHyperloop = (context, location, Component) => (dispatch) => {
  const oldComponent = context.root && context.root.constructor
  context.root = null
  let p = null
  if (typeof window === 'object') {
    context.initializing = false
    p = Promise.resolve(Component.for({}, { ...location, context }))
  } else {
    p = context.initialize(Component, location)
  }
  p.then((html) => {
    const render = context.root.render
    context.root.render = (props, state) => {
      dispatch({ type: 'hyperloopStateChanged', state })
      return render.call(context.root, context.root.props, { ...state, hyperloop: undefined })
    }
    dispatch({ type: 'hyperloopStateChanged', state: context.state })
    dispatch({
      type: 'pageChanged',
      location,
      view: () => html,
    })
    if (context.root.onpagechange && oldComponent === Component) {
      context.root.onpagechange({ params: {}, query: {} })
    }
  })
}

const routes = Object.keys(routes_).map((path) => {
  const keys = []
  const regexp = pathToRegexp(path, keys)
  return { keys, loader: routes_[path].fn, title: routes_[path].page_title, path, regexp }
})

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

  return () => {
    const notFound = routes.notFound
    return typeof notFound === 'function' ? notFound.call(this) : notFound
  }
}
