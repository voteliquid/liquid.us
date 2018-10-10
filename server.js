const fs = require('fs')
const path = require('path')
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'))
const checkEngineVersion = require('check-node-version')

const { NODE_ENV, PORT, WWW_PORT } = process.env
const { runtime } = require('raj')
const bodyParser = require('body-parser')
const callerPath = require('caller-path')
const compression = require('compression')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const express = require('express')
const MemoryFS = require('memory-fs')
const resolveFrom = require('resolve-from')
const serveStatic = require('serve-static')
const webpack = require('webpack')

// Ensure the correct node and NPM versions.
checkEngineVersion({
  node: packageJson.engines.node,
  npm: packageJson.engines.npm,
}, (error, result) => {
  if (error) throw error

  if (!result.versions.node.isSatisfied) {
    throw new Error(`Invalid node version. Found: ${result.versions.node.version} / Wanted: ${result.versions.node.wanted}`)
  }

  if (!result.versions.npm.isSatisfied) {
    throw new Error(`Invalid npm version. Found: ${result.versions.npm.version} / Wanted: ${result.versions.npm.wanted}`)
  }
})

// transform dynamic import()'s in node environment to require()'s
// used by routes.js to load chunked JS bundles asynchronously.
require('babel-register')({
  ignore: [/node_modules/],
  presets: [[require.resolve('babel-preset-env'), { targets: { node: "8.9" } }]],
  plugins: [
    require.resolve('babel-plugin-dynamic-import-node'),
    require.resolve('babel-plugin-transform-object-rest-spread'),
  ]
})

const webpackConfig = require('./webpack.config')
const twitterAvatarProxy = require('./middleware/twitter_avatar_proxy')
const errorHandler = require('./middleware/error_handler')
const geoip = require('./middleware/geoip')
const eztextingWebhook = require('./middleware/eztexting_webhook')
const redirects = require('./middleware/redirects')
const twitterUsernameSearch = require('./middleware/twitter_username_search')
const verifyPhoneNumber = require('./middleware/verify_phone_number')
const htmlWrapper = require('./components/HtmlWrapper')
const { loadPage } = require('./components/Router')
let App = require('./components/App')
const { serverHyperloopContext: HyperloopContext, combineEffects } = require('./helpers')

const port = PORT || WWW_PORT

const server = express()

const config = {
  API_URL: process.env.API_URL,
  APP_NAME: process.env.APP_NAME,
  ASSETS_URL: process.env.ASSETS_URL,
  GOOGLE_GEOCODER_KEY: process.env.GOOGLE_GEOCODER_KEY,
  NODE_ENV: process.env.NODE_ENV,
  WWW_URL: process.env.WWW_URL,
}

const statsOptions = {
  assets: false,
  builtAt: false,
  chunks: false,
  chunkModules: false,
  chunksSort: '!size',
  colors: true,
  exclude: /node_modules|webpack|webpack.entry.js|browser.js|index.js/,
  modulesSort: '!size',
  version: false,
}

if (!Object.values(config).some(val => !!val)) {
  throw new Error('Missing environment variables. Check .template.env for a reference of required variables.')
}

let started = false

const mfs = new MemoryFS()
const compiler = webpack(webpackConfig)

compiler.outputFileSystem = mfs

console.log('Building app...')

const compile = (done) => {
  let init = false

  if (NODE_ENV === 'production') {
    compiler.run(done)
  } else {
    compiler.watch({ ignore: /node_modules/ }, (err, stats) => {
      if (err || stats.compilation.errors.length) {
        return console.error(err || stats.compilation.errors)
      }

      compiler.compiled = true
      compiler.hash = stats.compilation.hash

      if (!init) {
        init = true
      } else {
        for (const moduleId of Object.keys(require.cache)) { /* eslint-disable-line no-restricted-syntax */
          if (!~moduleId.indexOf('node_modules')) {
            delete require.cache[resolveFrom(path.dirname(callerPath()), moduleId)]
          }
        }

        App = require('./components/App')
      }
      done(null, stats)
    })
  }
}

let webpackStats = null

compile((err, stats) => {
  if (err) return console.error(err)
  webpackStats = stats
  console.log(stats.toString({ ...statsOptions, context: __dirname }))
  if (!started) {
    started = true
    startAppServer()
  }
})

function startAppServer() {
  server
    .enable('trust proxy') // use x-forwarded-by for request ip
    .use(compression())
    .use(cors())
    .use(redirects)

  if (NODE_ENV !== 'production') {
    server.use(require('webpack-hot-middleware')(compiler, { log: false }))
  }

  server
    .use('/assets', serveStatic(path.join(__dirname, 'public')))
    .get('/rpc/healthcheck', (req, res) => res.status(200).end())
    .get('/rpc/geoip/:ip', geoip)
    .get('/rpc/avatarsio/:username', twitterAvatarProxy)
    .post('/rpc/verify_phone_number', bodyParser.json(), verifyPhoneNumber)
    .get('/rpc/eztexting_webhook', eztextingWebhook)
    .post('/rpc/twitter_username_search', bodyParser.json(), twitterUsernameSearch)
    .get('/hyperloop/:filename', (req, res) => {
      res.setHeader('Content-Type', 'text/javascript')
      mfs.readFile(`/${req.params.filename}`, 'utf8', (error, js) => {
        if (error) return res.status(404).end()
        res.write(js)
        res.end()
      })
    })
    .use(cookieParser(), serveApp)
    .use(errorHandler(htmlWrapper))
    .listen(port, () => {
      console.log(`App ready and listening on http://localhost:${port}`)
    })
}

function serveApp(req, res, next) {
  runApp(req, res, (error, html, status) => {
    if (error) return next(error)
    res.set('Content-Type', 'text/html')
    res.status(status || 200).send(html)
  })
}

function initAppState(App, req, res) {
  const store = {}
  return {
    ...App.init[0],
    config,
    location: {
      ...App.init[0].location,
      ip: req.ip,
    },
    storage: {
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
        if (res.running) {
          res.cookie(key, val, opts)
        }
        return val
      },
      unset: (key) => {
        if (res.running) {
          res.clearCookie(key)
        }
      },
    },
  }
}

function runApp(req, res, done) {
  const initState = initAppState(App, req, res)
  const hyperloop = new HyperloopContext(initState, req, res)
  res.running = true
  runtime({
    ...App,
    init: [{
      ...initState,
      hyperloop,
    }, (dispatch) => {
      loadPage(req.url, 200, dispatch)
    }],
    update: (event, state) => {
      // Intercept app updates and update the hyperloop state.
      const [appState, appEffect] = App.update(event, state)
      return [appState, combineEffects(setHyperloopState(appState), appEffect)]
    },
    view: (state, dispatch) => {
      if (res.running && state.routeLoaded && !hyperloop.redirected) {
        if (state.location.path !== req.path) {
          hyperloop.redirected = true
          return res.redirect(state.location.url)
        }
        res.running = false
        const appHtml = App.view(state, dispatch)
        const pageHtml = htmlWrapper(state, appHtml, `${webpackConfig.output.publicPath}${webpackStats.compilation.hash}.js`)
        done(null, pageHtml, state.location.status)
      }
    },
  })
}

function setHyperloopState(state) {
  if (state.hyperloop) {
    Object.assign(state.hyperloop.state, { ...state, hyperloop: undefined })
  }
}
