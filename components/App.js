const { NODE_ENV, WWW_URL } = process.env
const fetch = require('isomorphic-fetch')
const stateNames = require('datasets-us-states-abbr-names')

const { api, combineEffects, html, loadPage, mapEffect, mapEvent, runInSeries } = require('../helpers')
const Navbar = require('./NavBar')
const Footer = require('./Footer')
const ContactWidget = require('./ContactWidget')
const loadingIndicator = require('./ActivityIndicator')

const App = module.exports = {
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
    routeState: {},
    routeLoaded: false,
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
      case 'error':
        console.log(event.error)
        return [state]
      case 'footerEvent':
        const [footerState, footerEffect] = Footer.update(event.event, state.footer)
        return [{ ...state, footer: footerState }, mapEffect('footerEvent', footerEffect)]
      case 'hyperloopInitialized':
        return [{
          ...state,
          routeLoaded: true,
          routeProgram: event.program,
        }]
      case 'hyperloopRouteLoaded':
        return [state, initHyperloop(state.hyperloop, state.location, event.component)]
      case 'hyperloopStateChanged':
        return [{
          ...state,
          ...event.state,
          hyperloop: state.hyperloop,
          navbar: { ...state.navbar, user: event.state.user || state.user },
          legislatures: event.state.legislatures || state.legislatures,
        }]
      case 'legislaturesReceived':
        return [{ ...state, legislatures: event.legislatures }]
      case 'navbarEvent':
        const [navbarState, navbarEffect] = Navbar.update(event.event, { ...state.navbar, user: state.user })
        return [
          { ...state, navbar: navbarState },
          mapEffect('navbarEvent', navbarEffect),
        ]
      case 'pageChanged':
        return [{
          ...state,
          error: undefined,
          page_title: event.page_title || state.page_title,
          location: { ...event.location, ip: state.location.ip, userAgent: state.location.userAgent },
          navbar: { ...state.navbar, location: event.location, hamburgerVisible: false },
          contactWidget: { ...state.contactWidget, url: event.location.url },
        }, combineEffects(
          changePageTitle(event.page_title),
          startNProgress(),
          mapEffect('footerEvent', Footer.selectQuote),
          runInSeries(
            fetchUserAndRepsAndLegislatures(state),
            loadRoute(event.loader)
          )
        )]
      case 'repsReceived':
        return [{
          ...state,
          geoip: event.geoip || state.geoip,
          reps: event.reps,
        }]
      case 'routeEvent':
        const [routeState, effect] = state.routeProgram.update(event.event, {
          ...state.routeState,
          location: state.location,
          storage: state.storage,
          user: state.user,
          reps: state.reps,
        })
        switch (event.event.type) {
          case 'contactWidgetOpened':
            return [{ ...state, contactWidget: { ...state.contactWidget, isOpen: true } }]
          case 'legislaturesUpdated':
            return [{ ...state, legislatures: event.legislatures }]
          case 'verified':
            return [{ ...state, routeState, user: { ...state.user, verified: true } }, effect]
          case 'loaded':
            return [{ ...state, routeLoaded: true, routeState: { ...routeState, loaded: true } }]
          case 'redirected':
            return [{ ...state, routeState }, effect]
          case 'pageChanged':
            return App.update(event.event, state)
          case 'receivedMeasures':
            return [{
              ...state,
              measures: { ...state.routeState.measures, ...routeState.measures },
              measuresList: routeState.measuresList,
              measuresQuery: state.location.url,
              routeState,
            }, effect]
          case 'repsLoaded':
          case 'repsUpdated':
            return [{ ...state, routeState, reps: event.reps }, mapEffect('routeEvent', effect)]
          case 'userUpdated':
            return [{ ...state, routeState, user: { ...state.user, ...event.event.user } }]
          case 'signedOut':
            return [{ ...state, user: null }]
          case 'error':
          default:
            return [{
              ...state,
              routeState: { ...routeState, loading: false },
            }, mapEffect('routeEvent', effect)]
        }
      case 'routeLoaded':
        const [routeInitState, routeInitEffect] =
          (event.program && event.program.init)
            ? typeof event.program.init === 'function'
              ? event.program.init(state)
              : event.program.init
            : []
        const isHyperloop = !!event.program.for
        const hyperloopEffect = (dispatch) => dispatch({ type: 'hyperloopRouteLoaded', component: event.program })

        return [{
          ...state,
          routeProgram: event.program.view && event.program,
          routeLoaded: !event.program.for && !routeInitEffect,
          routeState: routeInitState,
        }, runInSeries(
          stopNProgress(),
          scrollToTop(true),
          !isHyperloop && mapEffect('routeEvent', routeInitEffect),
          isHyperloop && hyperloopEffect
        )]
      case 'userReceived':
        const user = { ...event.user, jwt: state.storage.get('jwt') }
        return [{
          ...state,
          user,
        }]
      default:
        return [state]
    }
  },
  view: (state, dispatch) => {
    const { contactWidget, geoip, footer, location, routeState, routeProgram, navbar, reps, storage, user } = state
    const viewRouteState = { ...routeState, geoip, location, reps, storage, user }
    return html()`
      <div id="wrapper">
        ${Navbar.view({ ...navbar, user }, mapEvent('navbarEvent', dispatch))}
        <div class="router">
          ${routeProgram ? routeProgram.view(viewRouteState, mapEvent('routeEvent', dispatch)) : loadingIndicator()}
        </div>
      </div>
      <div>${Footer.view(footer, mapEvent('footerEvent', dispatch))}</div>
      ${ContactWidget.view({ ...contactWidget, user }, mapEvent('contactWidgetEvent', dispatch))}
    `
  },
}

const loadRoute = (loader) => (dispatch) => {
  if (loader.then) {
    return loader.then((loaded) => {
      dispatch({ type: 'routeLoaded', program: loaded.default || loaded })
    })
  }
  dispatch({ type: 'routeLoaded', program: loader.default || loader })
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
      .catch((error) => dispatch({ type: 'error', error }))
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
      dispatch({ type: 'error', error })
    })
}

const fetchUser = (storage) => (dispatch) => {
  const userId = storage.get('user_id')
  const jwt = storage.get('jwt')
  if (userId && jwt) {
    dispatch({ type: 'userRequested' })
    return api(`/users?select=id,about,intro_video_url,email,first_name,last_name,username,verified,voter_status,update_emails_preference,is_admin,address:user_addresses(id,address,city,state)&id=eq.${userId}`, { storage })
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
      dispatch({ type: 'error', error })
    })
  }
}

const fetchLegislatures = (storage, user, geoip = {}) => (dispatch) => {
  const city = user && user.address ? user.address.city : geoip.city
  const state = user && user.address ? user.address.state : geoip.region
  dispatch({ type: 'legislaturesRequested' })
  return api(`/legislatures?or=(short_name.eq."${city}, ${state}",short_name.eq.${state},short_name.eq.US-Congress)`, {
    storage,
  }).then((legislatures) => {
    dispatch({
      type: 'legislaturesReceived',
      legislatures: (legislatures || []).sort((a, b) => {
        if (a.short_name === `${city}, ${state}` && b.short_name === state) return 1
        if (a.short_name === state && b.short_name === `${city}, ${state}`) return -1
        return 0
      }).map((legislature) => {
        legislature.abbr = legislature.name
        legislature.name = stateNames[legislature.name] || legislature.name
        return legislature
      }),
    })
  })
  .catch((error) => dispatch({ type: 'error', error }))
}

const startNProgress = () => () => {
  if (typeof window === 'object') {
    require('nprogress').start()
  }
}

const stopNProgress = () => () => {
  if (typeof window === 'object') {
    require('nprogress').done()
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
    document.title = newTitle ? `${newTitle} | Liquid US` : 'Liquid US | Digital Democracy Voting Platform'
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
      type: 'hyperloopInitialized',
      program: { view: () => html },
    })
    if (context.root.onpagechange && context.root.initialized) {
      context.root.onpagechange.call(context.root, { params: {}, query: {} })
    }
    context.root.initialized = true
  })
}
