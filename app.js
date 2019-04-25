const { combineEffects, combineEffectsInSeries, html, mapEffect, preventDefault, redirect } = require('./helpers')
const contactForm = require('./views/contact-form')
const { logError } = require('./effects/error')
const footer = require('./views/footer')
const loadingIndicator = require('./views/activity-indicator')
const navbar = require('./views/navbar')
const notFoundPage = require('./views/not-found-page')
const errorPage = require('./views/error-page')
const searchModel = require('./models/search')
const { fetchMetrics } = require('./effects/metrics')
const { fetchUser } = require('./effects/user')
const { fetchOfficesFromIP } = require('./effects/office')
const { changePageTitle, randomQuote, startNProgress, stopNProgress, scrollToTop } = require('./effects/page')

module.exports = {
  init: [{
    cookies: {}, // initialized in browser/server.js
    contactForm: { open: false, submitted: false },
    firstPageLoad: true,
    forms: {
      contact: { submitted: false },
      profile: {},
    },
    legislatures: [],
    loading: { page: true },
    location: {
      ip: '',
      path: '/',
      params: {},
      query: {},
      status: 200,
      title: 'Liquid',
      url: '/',
    },
    navbar: { hamburgerVisible: false },
    measures: {},
    measuresByUrl: {},
    offices: [],
    officesRequested: false,
    profiles: {},
    proxies: [],
    proxySearchResults: [],
    proxySearchTerms: '',
    reps: [],
    search: {
      loading: false,
      query: '',
      results: [],
      showResults: false,
    },
    user: null,
    usersCount: 0,
    votes: {},
  }],
  update: (event, state) => {
    const { jwt, user_id, refresh_token } = state.cookies
    const eventPrefix = event.type.split(':')[0]

    switch (eventPrefix) {
      case 'contactForm':
        return require('./models/contact')(event, state)
      case 'error':
        return [{
          ...state,
          loading: { page: state.loading.page },
          error: event.error,
        }, logError(event.error)]
      case 'import':
        return require('./models/import')(event, state)
      case 'measure':
        return require('./models/measure')(event, state)
      case 'metricsReceived':
        return [{ ...state, usersCount: event.usersCount }]
      case 'navHamburgerToggled':
        return [{ ...state, navbar: { hamburgerVisible: !state.navbar.hamburgerVisible } }, preventDefault(event.event)]
      case 'office':
        return require('./models/office')(event, state)
      case 'pageChanged':
        // page has been changed
        return [{
          ...state,
          error: null,
          loading: { ...state.loading, page: event.location.path !== state.location.path },
          navbar: { hamburgerVisible: false },
          location: { ...event.location, ip: state.location.ip, userAgent: state.location.userAgent },
        }, combineEffects([
          startNProgress,
          scrollToTop(event.location.path !== state.location.path),
          randomQuote,
          combineEffectsInSeries([
            (jwt && user_id && refresh_token)
              ? !state.user && fetchUser(user_id, jwt, refresh_token, state.location.ip)
              : !state.officesRequested && fetchOfficesFromIP(state.location.ip),
            loadRoute(event.loader),
            stopNProgress,
          ]),
        ])]
      case 'pageLoaded':
        if (state.browser && state.firstPageLoad) {
          return [{
            ...state,
            firstPageLoad: false,
            loading: { page: false },
            view: event.view,
          }]
        }
        // route JS code has been loaded (route JS is asynchronously loaded in chunks using webpack)
        const [pageState, pageEffect] = ((state) => {
          switch (state.location.route) {
            case 'not-found':
              return [{
                ...state,
                location: { ...state.location, title: 'Page not found', status: 404 }
              }, changePageTitle('Page not found')]
            case '/':
              return [{ ...state, location: { ...state.location, title: '' } }, fetchMetrics]
            case '/sign_in':
            case '/sign_in/verify':
            case '/join':
            case '/sign_out':
              return require('./models/session')(event, state)
            case '/get_started':
            case '/get_started/basics':
            case '/get_started/verification':
            case '/get_started/profile':
              return require('./models/onboard')(event, state)
            case '/edit_profile':
            case '/:username':
            case '/twitter/:username':
              return require('./models/profile')(event, state)
            case '/legislation':
            case '/legislation/propose':
            case '/legislation/yours':
            case '/legislation/:shortId':
            case '/nominations/:shortId':
            case '/:username/legislation/:shortId':
            case '/:username/legislation/:shortId/edit':
              return require('./models/measure')(event, state)
            case '/legislation/:shortId/import':
            case '/nominations/:shortId/import':
            case '/:username/legislation/:shortId/import':
              return require('./models/import')(event, state)
            case '/legislation/:shortId/votes/:voteId':
            case '/nominations/:shortId/votes/:voteId':
            case '/:username/legislation/:shortId/votes/:voteId':
              return require('./models/vote')(event, state)
            case '/proxies':
              return require('./models/proxy')(event, state)
            case '/settings':
            case '/settings/unsubscribe':
              return require('./models/user')(event, state)
            default:
              return [state]
          }
        })({
          ...state,
          firstPageLoad: false,
          loading: { page: false },
          view: event.view,
        })
        return [pageState, combineEffects([changePageTitle(pageState.location.title), pageEffect])]
      case 'onboard':
        return require('./models/onboard')(event, state)
      case 'profile':
        return require('./models/profile')(event, state)
      case 'proxy':
        return require('./models/proxy')(event, state)
      case 'redirected':
        if (event.url === state.location.url) return [state]
        return [state, redirect(event.url, event.status)]
      case 'session':
        return require('./models/session')(event, state)
      case 'search':
        const [search, searchEffect] = searchModel(event.event, state.search)
        return [{ ...state, search }, mapEffect('search', searchEffect)]
      case 'user':
        return require('./models/user')(event, state)
      case 'vote':
        return require('./models/vote')(event, state)
      case 'quoteSelected':
        return [{ ...state, randomQuote: event.quote }]
      default:
        return [state]
    }
  },
  view: (state, dispatch) => {
    return html`
      <div id="wrapper">
        ${navbar(state, dispatch)}
        <div class="router">
          ${!state.loading.page && state.view
            ? routeOrErrorView(state, dispatch)
            : loadingIndicator({ size: 'large', margin: '2rem' })}
        </div>
      </div>
      <div>${footer(state, dispatch)}</div>
      ${contactForm(state, dispatch)}
    `
  },
}

const routeOrErrorView = (state, dispatch) => {
  try {
    return state.location.status === 404 ? notFoundPage(state, dispatch) : state.view(state, dispatch)
  } catch (error) {
    logError(error)()
    return errorPage(state, dispatch)
  }
}

const loadRoute = (loader) => (dispatch) => {
  return Promise.resolve(loader()).then((view) => dispatch({
    type: 'pageLoaded',
    view: view.default || view,
  }))
  .catch((error) => {
    if (typeof window === 'object' && error.message && error.message.slice(0, 13) === 'Loading chunk') {
      window.location.reload(true)
    } else {
      console.log(error)
    }
  })
}
