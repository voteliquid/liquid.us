const { APP_NAME, ASSETS_URL, PORT, WWW_PORT } = process.env
const bodyParser = require('body-parser')
const compression = require('compression')
const cors = require('cors')
const express = require('express')
const hyperloop = require('hyperloop')
const path = require('path')
const serveStatic = require('serve-static')

const errorHandler = require('./middleware/error_handler')
const geoip = require('./middleware/geoip')
const redirects = require('./middleware/redirects')
const twitterUsernameSearch = require('./middleware/twitter_username_search')

const port = PORT || WWW_PORT

const server = express()

const config = {
  API_URL: process.env.API_URL,
  APP_NAME: process.env.APP_NAME,
  ASSETS_URL: process.env.ASSETS_URL,
  GOOGLE_GEOCODER_KEY: process.env.GOOGLE_GEOCODER_KEY,
  IMAGES_URL: process.env.IMAGES_URL,
  NODE_ENV: process.env.NODE_ENV,
  STRIPE_API_PUBLIC_KEY: process.env.STRIPE_API_PUBLIC_KEY,
  WWW_URL: process.env.WWW_URL,
}

if (!Object.values(config).some(val => !!val)) {
  throw new Error('Missing environment variables. Check .template.env for a reference of required variables.')
}

server
  .enable('trust proxy') // use x-forwarded-by for request ip
  .use(compression())
  .use(cors())
  .use(redirects)
  .use('/assets', serveStatic(path.join(__dirname, 'public'))) // TODO serve using CDN in production
  .get('/rpc/healthcheck', (req, res) => res.status(200).end())
  .get('/rpc/geoip', geoip)
  .post('/rpc/twitter_username_search', bodyParser.json(), twitterUsernameSearch)
  .use(hyperloop.server(require.resolve('./components/App.js'), {
    htmlHead,
    initialState: { config },
  }))
  .use(errorHandler(htmlHead))
  .listen(port)

function htmlHead({ page_description, page_title }) {
  const description = page_description || `A new democracy for the modern world.`
  const title = page_title ? `${page_title} ★ ${APP_NAME}` : `${APP_NAME} ★ Liquid Democracy for America`

  return `
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title}</title>
    <link rel="icon" type="image/png" href=${`${ASSETS_URL}/favicon.png`} />
    <link rel="apple-touch-icon" sizes="180x180" href=${`${ASSETS_URL}/apple-touch-icon.png`}>
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bulma/0.6.2/css/bulma.min.css">
    <style>
      #hyperloop_application {
        display: flex;
        min-height: 100vh;
        flex-direction: column;
      }

      #wrapper {
        flex: 1;
        position: relative;
      }

      .hyperloop_router {
        min-height: 50vh;
      }

      .section .breadcrumb {
        margin-top: -3rem;
        margin-bottom: 3rem;
      }

      .section .breadcrumb:not(:last-child) {
        margin-top: -3rem;
        margin-bottom: 3rem;
      }
    </style>
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="https://blog.united.vote/assets/icon-reduced-300.png" />
    <meta property="og:type" content="website" />
    ${responsiveTableStyle}
    ${roundAvatarStyle}
  `
}

const responsiveTableStyle = `
  <style>
  .table .responsive-label {
    display: none;
  }

  @media screen and (max-width: 800px) {
    .table td.responsive-inline-block {
      display: inline-block;
      text-color: inherit;
    }
    .is-responsive {
      width: 100%;
      border-collapse: collapse;
      border-spacing: 0;
      display: block;
      position: relative;
    }

    .responsive-bold {
      font-weight: bold;
    }

    .table.is-responsive .responsive-label {
      display: inline;
    }
    .table.is-responsive td {
      margin: 0;
      padding: 0 .5em;
      vertical-align: top;
    }
    .is-responsive thead {
      display: none;
    }
    .is-responsive tbody {
      display: block;
      width: 100%;
      position: relative;
    }
    .is-responsive tbody tr {
      border-bottom: 1px solid #EEE;
      display: block;
      vertical-align: top;
      padding-bottom: 1rem;
    }
    .is-responsive tr {
      text-align: left;
      border: none;
    }
    .is-responsive td {
      border: none;
      display: block;
      min-height: 1.25em;
      text-align: left !important;
    }
    .is-responsive td:first-child {
      padding-top: 1rem;
    }
    .is-responsive td:empty {
      display: none;
    }
  }
  </style>
`

const roundAvatarStyle = `
  <style>
  .round-avatar-img {
    border-radius: 50%;
    height: 100% !important;
    object-fit: cover;
  }
  </style>
`
