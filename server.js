const debug = require('debug')('liquid:app')
const fs = require('fs')
const path = require('path')
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'))
const checkEngineVersion = require('check-node-version')

const { NODE_ENV, PORT, WWW_PORT } = process.env
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
const { runtime } = require('raj')

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
require('@babel/register')({
  ignore: [/node_modules/],
  presets: [[require.resolve('@babel/preset-env'), { targets: { node: "8.9" } }]],
  plugins: [
    require.resolve('babel-plugin-dynamic-import-node'),
    require.resolve('@babel/plugin-proposal-object-rest-spread'),
  ]
})

const { loadPage } = require('./helpers')
const webpackConfig = require('./webpack.config')
const twitterAvatarProxy = require('./middleware/twitter_avatar_proxy')
const imageProxy = require('./middleware/image_proxy')
const errorHandler = require('./middleware/error_handler')
const geoip = require('./middleware/geoip')
const eztextingWebhook = require('./middleware/eztexting_webhook')
const redirects = require('./middleware/redirects')
const twitterUsernameSearch = require('./middleware/twitter_username_search')
const verifyPhoneNumber = require('./middleware/verify_phone_number')
const geocode = require('./middleware/geocode')
const htmlWrapper = require('./views/html-wrapper')
let App = require('./app')

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

        App = require('./app')
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
    .disable('x-powered-by')
    .enable('trust proxy') // use x-forwarded-by for request ip
    .use(compression())
    .use(cors())
    .use(redirects)

  if (NODE_ENV !== 'production') {
    server.use(require('webpack-hot-middleware')(compiler, { log: false }))
  }

  server
    .use('/assets', serveStatic(path.join(__dirname, 'public'), { maxAge: '4h' }))
    .get('/rpc/healthcheck', (req, res) => res.status(200).end())
    .get('/rpc/geoip/:ip', geoip)
    .get('/rpc/image-proxy/:url', imageProxy)
    .get('/rpc/avatarsio/:username', twitterAvatarProxy)
    .post('/rpc/verify_phone_number', bodyParser.json(), verifyPhoneNumber)
    .get('/rpc/eztexting_webhook', eztextingWebhook)
    .post('/rpc/twitter_username_search', bodyParser.json(), twitterUsernameSearch)
    .post('/rpc/geocode', bodyParser.json(), geocode)
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

function initAppState(App, req) {
  return {
    ...App.init[0],
    config,
    location: {
      ...App.init[0].location,
      ip: req.ip,
      userAgent: req.get('User-Agent') || 'Unknown',
    },
    cookies: req.cookies,
  }
}

function runApp(req, res, done) {
  const initState = initAppState(App, req)
  runtime({
    ...App,
    init: [initState, (dispatch) => loadPage(req.url, 200, dispatch)],
    update: (event, state) => {
      debug(event, state)

      switch (event.type) {
        case 'cookieSet':
          return [{
            ...state,
            cookies: { ...state.cookies, [event.key]: event.value }
          }, () => {
            if (!res.appResponded) {
              res.cookie(event.key, event.value, event.opts)
            }
          }]
        case 'cookieUnset':
          return [{ ...state, cookies: { ...state.cookies, [event.key]: null } }, () => {
            if (!res.appResponded) {
              res.clearCookie(event.key)
            }
          }]
        default:
          return App.update(event, state)
      }
    },
    view: (state, dispatch) => {
      if (!res.appResponded && !state.loading.page && state.view) {
        res.appResponded = true
        if (state.location.url !== req.url) {
          return res.redirect(state.location.url)
        }
        const appHtml = App.view(state, dispatch)
        const pageHtml = htmlWrapper(state, appHtml, `${webpackConfig.output.publicPath}${webpackStats.compilation.hash}.js`)
        done(null, pageHtml, state.location.status)
      }
    },
  })
}
