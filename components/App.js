const { NODE_ENV, WWW_URL } = process.env
const fetch = require('isomorphic-fetch')
const stateNames = require('datasets-us-states-abbr-names')

const { api, html, runInSeries, combineEffects, mapEffect, mapEvent } = require('../helpers')
const { loadPage } = require('./Router')
const Navbar = require('./NavBar')
const Footer = require('./Footer')
const ContactWidget = require('./ContactWidget')

module.exports = {
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
    routeProgram: null,
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
      case 'legislaturesReceivedError':
        console.error(event.error)
        return [state]
      case 'legislaturesReceived':
        return [{ ...state, legislatures: event.legislatures }]
      case 'legislaturesRequested':
        return [state]
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
          routeProgram: event.program || state.routeProgram,
          route: { ...state.location, ...state.route },
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
        return [{
          ...state,
          geoip: event.geoip || state.geoip,
          route: { ...state.route, reps: event.reps },
          reps: event.reps,
        }]
      case 'repsReceivedError':
        console.log(event.error)
        return [state]
      case 'routeEvent':
        const [routeState, effect] = state.routeProgram.update(event.event, state.route)
        switch (event.event.type) {
          case 'contactWidgetOpened':
            return [{ ...state, contactWidget: { ...state.contactWidget, isOpen: true } }]
          case 'verified':
            return [{ ...state, route: routeState, user: { ...state.user, verified: true } }, effect]
          case 'redirected':
            return [{ ...state, route: routeState }, effect]
          default:
            return [{ ...state, route: routeState }, mapEffect('routeEvent', effect)]
        }
      case 'routeLoaded':
        const hyperloopOrRajPageChange =
          event.program.for
            ? (dispatch) => dispatch({ type: 'hyperloopRouteLoaded', component: event.program })
            : (dispatch) => dispatch({ type: 'pageChanged', location: state.location, program: event.program })

        return [state, runInSeries(
          startNProgress(),
          fetchUserAndRepsAndLegislatures(state),
          hyperloopOrRajPageChange
        )]
      case 'userRequested':
        return [state]
      case 'userReceived':
        const user = { ...event.user, jwt: state.storage.get('jwt') }
        return [{
          ...state,
          contactWidget: { ...state.contactWidget, user },
          navbar: { ...state.navbar, user },
          route: { ...state.route, user },
          user,
        }]
      case 'userReceivedError':
        console.log(event.error)
        return [state]
      default:
        return [state]
    }
  },
  view: ({ contactWidget, footer, route, routeProgram, navbar }, dispatch) => {
    return html()`
      <div id="wrapper">
        ${Navbar.view(navbar, mapEvent('navbarEvent', dispatch))}
        ${routeProgram ? routeProgram.view(route, mapEvent('routeEvent', dispatch)) : ''}
      </div>
      <div>${Footer.view(footer, mapEvent('footerEvent', dispatch))}</div>
      ${ContactWidget.view(contactWidget, mapEvent('contactWidgetEvent', dispatch))}
    `
  },
}

const fetchUserAndRepsAndLegislatures = ({ geoip, location, storage, user }) => (dispatch) => {
  if (user) {
    return fetchReps({ location, storage, user })(dispatch)
      .then(() => fetchLegislatures(user, geoip)(dispatch))
  }
  return Promise.resolve(fetchUser(storage)(dispatch))
    .then((user) =>
      fetchReps({ location, storage, user })(dispatch)
        .then(() => fetchLegislatures(user, geoip)(dispatch)))
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
    return api(`/users?select=id,about,intro_video_url,email,first_name,last_name,username,verified,voter_status,update_emails_preference,address:user_addresses(id,address,city,state)&id=eq.${userId}`, { jwt })
    .then(users => {
      const user = {
        ...users[0],
        address: users[0] ? users[0].address[0] : null,
      }
      dispatch({ type: 'userReceived', user })
      return user
    })
    .catch((error) => {
      console.log(error)
      dispatch({ type: 'userReceivedError', error })
    })
  }
}

const fetchLegislatures = (user, geoip = {}) => (dispatch) => {
  dispatch({ type: 'legislaturesRequested' })
  return api('/legislatures').then((legislatures) => {
    const city = user ? user.address.city : geoip.city
    const state = user ? user.address.state : geoip.region
    dispatch({
      type: 'legislaturesReceived',
      legislatures: legislatures.filter(({ short_name }) => {
        return short_name === 'US-Congress' || short_name === city || short_name === state
      }).sort((a, b) => {
        if (a.short_name === city && b.short_name === state) return 1
        if (a.short_name === state && b.short_name === city) return -1
        return 0
      }).map((legislature) => {
        legislature.abbr = legislature.name
        legislature.name = stateNames[legislature.name] || legislature.name
        return legislature
      }),
    })
  })
  .catch((error) => dispatch({ type: 'legislaturesReceivedError', error }))
}

const startNProgress = () => () => {
  if (typeof window === 'object') {
    if (window.nprogressTimeout) clearTimeout(window.nprogressTimeout)
    window.nprogressTimeout = setTimeout(() => require('nprogress').start(), 750)
  }
}

const stopNProgress = () => () => {
  if (typeof window === 'object') {
    if (window.nprogressTimeout) {
      clearTimeout(window.nprogressTimeout)
    } else {
      setTimeout(() => require('nprogress').done(), 1000)
    }
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
    loadPage(window.location.pathname + window.location.search, 200, dispatch),
  redirect: (event) => {
    const status = event.detail.status || 302
    if (status === 303) {
      window.history.pushState({}, null, event.detail.url)
    } else {
      window.history.replaceState({}, null, event.detail.url)
    }
    loadPage(event.detail.url, status, dispatch)
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
      loadPage(href, 200, dispatch)
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
    loadPage(window.location.pathname + window.location.search, 200, dispatch)

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
      program: { view: () => html },
    })
    if (context.root.onpagechange && oldComponent === Component) {
      context.root.onpagechange({ params: {}, query: {} })
    }
  })
}
