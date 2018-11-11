require('@babel/polyfill')

// https://help.luckyorange.com/article/126-tagging-with-javascript
// https://help.luckyorange.com/article/41-passing-in-custom-user-data
window._loq = window._loq || []

const { runtime } = require('raj')
const cookies = require('browser-cookies')
const hyperhtml = require('hyperhtml')

const { browserHyperloopContext: HyperloopContext, combineEffects } = require('./helpers')
const App = require('./components/App')

let starting = true

// Use state sent from server, if available.
const initState = window.__app_state || { ...App.init[0] }
const memoryStore = {}

runtime({
  ...App,
  init: [{
    ...initState,
    hyperloop: new HyperloopContext(window.__app_state || {}),
    routeLoaded: false,
    routeProgram: null,
    storage: {
      get: (...args) => {
        return cookies.get(...args) || memoryStore[args[0]]
      },
      set: (...args) => {
        memoryStore[args[0]] = args[1]
        return cookies.set(...args)
      },
      unset: (key) => {
        memoryStore[key] = null
        return cookies.erase(key)
      },
    },
  }, App.init[1]],
  update: (event, state) => {
    // Intercept app updates and update the hyperloop state.
    const [appState, appEffect] = App.update(event, state)
    return [appState, combineEffects(setHyperloopState(appState), appEffect)]
  },
  view: (state, dispatch) => {
    // Wait for route view to load (async chunked JS) before rendering.
    if (starting && state.routeLoaded) {
      starting = false
      return hyperhtml.bind(document.getElementById('application'))`${App.view(state, dispatch)}`
    }
    return App.view(state, dispatch)
  },
})

function setHyperloopState(state) {
  if (state.hyperloop) {
    Object.assign(state.hyperloop.state, { ...state, hyperloop: undefined })
  }
}

if (module.hot) {
  module.hot.accept()
}
