const { ASSETS_URL, NODE_ENV, WWW_DOMAIN } = process.env
const { dom } = require('@fortawesome/fontawesome-svg-core/index')
const fs = require('fs')
const googleAddressAutocompleteScript = require('./google-address-autocomplete')
const nprogressStyle = fs.readFileSync('node_modules/nprogress/nprogress.css')

module.exports = (state, html, jsBundleUrls) => {
  const { location } = state
  const pageDescription = location.description || 'The Most Powerful Way to Advocate for Your Community.'
  const pageTitle = location.title ? `${location.title} | Liquid US` : `Liquid US | Digital Democracy Voting Platform`
  const ogTitle = location.ogTitle || pageTitle
  const ogDescription = location.ogDescription || pageDescription
  const ogImage = location.ogImage || `https://blog.${WWW_DOMAIN}/assets/twitter_large.png`

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${pageTitle.replace(/</g, '&lt;').replace(/"/g, '&quot;')}</title>
        ${location.noindex ? `<meta name="robots" content="noindex" />` : ''}
        <meta property="description" content="${pageDescription.replace(/</g, '&lt;').replace(/"/g, '&quot;')}" />
        <meta property="og:title" content="${ogTitle.replace(/</g, '&lt;').replace(/"/g, '&quot;')}" />
        <meta property="og:description" content="${ogDescription.replace(/</g, '&lt;').replace(/"/g, '&quot;')}" />
        <meta property="og:image" content="${ogImage}" />
        <meta property="og:type" content="website" />
        <link rel="icon" type="image/png" href=${`${ASSETS_URL}/favicon.png`} />
        <link rel="apple-touch-icon" sizes="180x180" href=${`${ASSETS_URL}/apple-touch-icon.png`}>
        <link rel="stylesheet" href="${`${ASSETS_URL}/${NODE_ENV === 'production' ? 'styles.min.css' : 'styles.css'}`}" type="text/css" />
        <style>
          ${nprogressStyle}
          ${dom.css()}
        </style>
        <script>
          window.__app_state = ${JSON.stringify({ ...state, route: undefined, hyperloop: undefined }).replace(/<\//g, '<\\/')};
          window.__lo_site_id = 119200;
        </script>
      </head>
      <body>
        <div id="application" style="overflow-x: hidden;">${html}</div>

        ${NODE_ENV === 'production' ? `
          <script async src="https://d10lpsik1i8c69.cloudfront.net/w.js"></script>
          <script async src="https://www.googletagmanager.com/gtag/js?id=UA-84279342-5"></script>
          <script>
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'UA-84279342-5');
          </script>
        ` : ''}
        ${googleAddressAutocompleteScript}
        ${jsBundleUrls.map((jsBundleUrl) => `<script src="${ASSETS_URL}/${jsBundleUrl}"></script>`).join('')}
      </body>
    </html>
  `
}
