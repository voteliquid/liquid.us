require('@babel/polyfill')
const debug = require('debug')('liquid:app')

window.name = 'liquid.us'

const cookies = require('browser-cookies')
const lighterhtml = require('lighterhtml-plus')
const { runtime } = require('raj')
const { combineEffects, loadPage } = require('./helpers')
const App = require('./app')

let starting = true

// Use state sent from server, if available.
const initState = window.__app_state || { ...App.init[0] }
const node = document.getElementById('application')

// Initialize listeners for browser history events
const listeners = (dispatch) => ({
  popstate: () => {
    loadPage(window.location.pathname + window.location.search, 200, dispatch, false)
  },
  redirect: (event) => {
    const status = event.detail.code || event.detail.status || 302
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

    if (!event.metaKey && href && href[0] === '/' && href.split('#')[0] !== url) {
      event.preventDefault()
      window.history.pushState({}, null, href)
      loadPage(href, 200, dispatch)
    }
  },
})

// Register browser history listeners
const watchHistory = (status) => (dispatch) => {
  loadPage(window.location.pathname + window.location.search, status || 404, dispatch)

  const { click, popstate, redirect } = window.__listeners || {}
  window.removeEventListener('popstate', popstate)
  window.removeEventListener('redirect', redirect)
  window.removeEventListener('click', click)

  const l = window.__listeners = listeners(dispatch)
  window.addEventListener('popstate', l.popstate)
  window.addEventListener('redirect', l.redirect)
  window.addEventListener('click', l.click)
}

let prevState = null

runtime({
  ...App,
  init: [{
    ...initState,
    browser: true,
    firstPageLoad: true,
    cookies: cookies.all(),
  }, combineEffects([watchHistory(initState.location.status), App.init[1]])],
  update: (event, state) => {
    debug(event, state)

    switch (event.type) {
      case 'cookieSet':
        return [{
          ...state,
          cookies: { ...state.cookies, [event.key]: event.value }
        }, () => {
          cookies.set(event.key, event.value || '', event.opts)
        }]
      case 'cookieUnset':
        return [{ ...state, cookies: { ...state.cookies, [event.key]: null } }, () => {
          cookies.erase(event.key)
        }]
      default:
        return App.update(event, state)
    }
  },
  view: (state, dispatch) => {
    // Wait for route view to load (async chunked JS) before rendering.
    if (starting && !state.loading.page && state.view) {
      starting = false
    }
    if (!starting && state !== prevState) {
      prevState = state
      lighterhtml.render(node, () => App.view(state, dispatch))
    }
  },
})

if (module.hot) {
  module.hot.accept()
}
