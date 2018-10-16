const { NODE_ENV, WWW_URL } = process.env
const fetch = require('isomorphic-fetch')
const stateNames = require('datasets-us-states-abbr-names')

const { api, html, runInSeries, combineEffects, mapEffect, mapEvent } = require('../helpers')
const { loadPage } = require('./Router')
const Navbar = require('./NavBar')
const Footer = require('./Footer')
const ContactWidget = require('./ContactWidget')
const loadingIndicator = require('./ActivityIndicator')

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
        const [contactWidgetState, contactWidgetEffect] = ContactWidget.update(event.event, { ...state.contactWidget, user: state.user })
        return [{ ...state, contactWidget: contactWidgetState }, mapEffect('contactWidgetEvent', contactWidgetEffect)]
      case 'footerEvent':
        const [footerState, footerEffect] = Footer.update(event.event, state.footer)
        return [{ ...state, footer: footerState }, mapEffect('footerEvent', footerEffect)]
      case 'hyperloopRouteLoaded':
        return [state, initHyperloop(state.hyperloop, event.location, event.component)]
      case 'hyperloopStateChanged':
        return [{
          ...state,
          ...event.state,
          hyperloop: state.hyperloop,
          navbar: { ...state.navbar, user: event.state.user || state.user },
          legislatures: event.state.legislatures || state.legislatures,
        }]
      case 'legislaturesReceivedError':
        console.error(event.error)
        return [state]
      case 'legislaturesReceived':
        return [{ ...state, legislatures: event.legislatures }]
      case 'legislaturesRequested':
        return [state]
      case 'navbarEvent':
        const [navbarState, navbarEffect] = Navbar.update(event.event, { ...state.navbar, user: state.user })
        return [
          { ...state, navbar: navbarState },
          mapEffect('navbarEvent', navbarEffect),
        ]
      case 'pageChanged':
        const [routeInitState, routeInitEffect] = event.program && event.program.init ? event.program.init : []
        return [{
          ...state,
          error: undefined,
          page_title: event.page_title || state.page_title,
          location: { ...state.location, ...event.location },
          navbar: { ...state.navbar, location: event.location, hamburgerVisible: false },
          contactWidget: { ...state.contactWidget, url: event.location.url },
          routeProgram: event.program,
          routeLoaded: routeInitEffect ? event.loaded : !!event.program,
          route: { ...routeInitState, ...state.location, ...state.route },
        }, combineEffects(
          mapEffect('routeEvent', routeInitEffect),
          changePageTitle(event.page_title || state.page_title),
          stopNProgress(),
          scrollToTop(event.scroll)
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
        const [routeState, effect] = state.routeProgram.update(event.event, { ...state.route, user: state.user, reps: state.reps, storage: state.storage })
        switch (event.event.type) {
          case 'contactWidgetOpened':
            return [{ ...state, contactWidget: { ...state.contactWidget, isOpen: true } }]
          case 'legislaturesUpdated':
            return [{ ...state, legislatures: event.legislatures }]
          case 'verified':
            return [{ ...state, route: routeState, user: { ...state.user, verified: true } }, effect]
          case 'redirected':
            return [{ ...state, route: routeState }, effect]
          case 'repsUpdated':
            return [{ ...state, reps: event.reps }]
          case 'userUpdated':
            return [{ ...state, user: { ...state.user, ...event.event.user } }]
          default:
            return [{ ...state, route: routeState }, mapEffect('routeEvent', effect)]
        }
      case 'routeLoaded':
        const hyperloopOrRajPageChange =
          event.program.for
            ? (dispatch) => dispatch({ type: 'hyperloopRouteLoaded', location: event.location, component: event.program })
            : (dispatch) => dispatch({ type: 'pageChanged', location: event.location, program: event.program })

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
  view: ({ contactWidget, footer, route, routeProgram, navbar, user, storage, reps }, dispatch) => {
    return html()`
      <div id="wrapper">
        ${Navbar.view({ ...navbar, user }, mapEvent('navbarEvent', dispatch))}
        <div class="router">
          ${routeProgram ? routeProgram.view({ ...route, user, storage, reps }, mapEvent('routeEvent', dispatch)) : loadingIndicator()}
        </div>
      </div>
      <div>${Footer.view(footer, mapEvent('footerEvent', dispatch))}</div>
      ${ContactWidget.view({ ...contactWidget, user }, mapEvent('contactWidgetEvent', dispatch))}
    `
  },
}

const fetchUserAndRepsAndLegislatures = ({ geoip, legislatures, location, storage, reps, user }) => (dispatch) => {
  if (user) {
    if (reps) {
      if (!legislatures) return fetchLegislatures(storage, user, geoip)(dispatch)
      return Promise.resolve()
    }
    return fetchReps({ location, storage, user })(dispatch)
      .then(() => fetchLegislatures(storage, user, geoip)(dispatch))
  }
  return Promise.resolve(fetchUser(storage)(dispatch))
    .then((user) =>
      fetchReps({ location, storage, user })(dispatch)
        .then(() => fetchLegislatures(storage, user, geoip)(dispatch)))
}

const fetchReps = ({ location, storage, user }) => (dispatch) => {
    const address = user && user.address

    if (address) {
      return api('/rpc/user_offices', {
        method: 'POST',
        body: JSON.stringify({ user_id: user.id }),
        storage,
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
    return api(`/users?select=id,about,intro_video_url,email,first_name,last_name,username,verified,voter_status,update_emails_preference,address:user_addresses(id,address,city,state)&id=eq.${userId}`, { storage })
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

const fetchLegislatures = (storage, user, geoip = {}) => (dispatch) => {
  const city = user && user.address ? user.address.city : geoip.city
  const state = user && user.address ? user.address.state : geoip.region
  dispatch({ type: 'legislaturesRequested' })
  return api(`/legislatures?or=(short_name.eq.${city},short_name.eq.${state},short_name.eq.US-Congress)`, {
    storage,
  }).then((legislatures) => {
    dispatch({
      type: 'legislaturesReceived',
      legislatures: (legislatures || []).sort((a, b) => {
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
    }
    setTimeout(() => {
      if (window.nprogressTimeout) clearTimeout(window.nprogressTimeout)
      require('nprogress').done()
    }, 1000)
  }
}

const scrollToTop = (scroll) => () => {
  if (scroll && typeof window === 'object') {
    window.scrollTo(0, 0)
  }
}

const listeners = (dispatch) => ({
  popstate: () => {
    Footer.selectQuote(mapEvent('footerEvent', dispatch))
    loadPage(window.location.pathname + window.location.search, 200, dispatch, false)
  },
  redirect: (event) => {
    const status = event.detail.code || event.detail.status || 302
    if (status === 303) {
      window.history.pushState({}, null, event.detail.url)
    } else {
      window.history.replaceState({}, null, event.detail.url)
    }
    Footer.selectQuote(mapEvent('footerEvent', dispatch))
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
      Footer.selectQuote(mapEvent('footerEvent', dispatch))
      loadPage(href, 200, dispatch)
    }
  },
})

const changePageTitle = (newTitle) => () => {
  if (typeof window === 'object') {
    document.title = newTitle ? `${newTitle} | Liquid US` : document.title
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
  context.root = null
  let p = null
  if (typeof window === 'object') {
    context.initializing = false
    p = Promise.resolve(Component.for(context, { ...location, context }))
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
      loaded: true,
      program: { view: () => html },
    })
    if (context.root.onpagechange && context.root.initialized) {
      context.root.onpagechange({ params: {}, query: {} })
    }
    context.root.initialized = true
  })
}
