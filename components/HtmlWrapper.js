const { ASSETS_URL, WWW_DOMAIN } = process.env
const { avatarURL } = require('../helpers')
const fs = require('fs')
const nprogressStyle = fs.readFileSync('node_modules/nprogress/nprogress.css')

module.exports = (state, html, bundleUrl) => {
  const { page_description, page_title, selected_bill, selected_profile } = state
  const description = page_description || `A new democracy for the modern world.`
  const title = page_title ? `${page_title} | Liquid US` : `Liquid US | Digital Democracy Voting Platform`
  const profile_image_url = selected_profile ? avatarURL(selected_profile) : ''
  const measure_image_url = selected_bill && selected_bill.image_name ? `${ASSETS_URL}/measure-images/${selected_bill.image_name}` : ''

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${title}</title>
        <link rel="icon" type="image/png" href=${`${ASSETS_URL}/favicon.png`} />
        <link rel="apple-touch-icon" sizes="180x180" href=${`${ASSETS_URL}/apple-touch-icon.png`}>
        <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.3.1/css/all.css" integrity="sha384-mzrmE5qonljUremFsqc01SB46JvROS7bZs3IO2EmfFsd15uHvIt+Y8vEf7N7fWAU" crossorigin="anonymous">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bulma/0.7.1/css/bulma.min.css">
        <style>
          ${nprogressStyle}

          body {
            height: 100%;
          }

          body, .panel {
            font-size: .9rem;
          }

          #application {
            display: flex;
            min-height: 100vh;
            flex-direction: column;
            overflow-x: hidden;
          }

          #wrapper {
            flex: 1;
            position: relative;
          }

          .router {
            min-height: 50vh;
          }
        </style>
        <meta property="og:title" content="${title.replace(/</g, '&lt;').replace(/"/g, '&quot;')}" />
        <meta property="og:description" content="${description.replace(/</g, '&lt;').replace(/"/g, '&quot;')}" />
        <meta property="og:image" content="${profile_image_url || measure_image_url || `https://blog.${WWW_DOMAIN}/assets/twitter_large.png`}" />
        <meta property="og:type" content="website" />
        ${responsiveTableStyle}
        ${roundAvatarStyle}
        <script>
          window.__app_state = ${JSON.stringify({ ...state, hyperloop: undefined }).replace(/<\//g, '<\\/')};
        </script>
      </head>
      <body>
        <div id="application">${html}</div>
        <script src="${bundleUrl}"></script>
      </body>
    </html>
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
