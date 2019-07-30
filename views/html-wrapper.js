const { ASSETS_URL, NODE_ENV, WWW_DOMAIN } = process.env
const fs = require('fs')
const googleAddressAutocompleteScript = require('./google-address-autocomplete')
const nprogressStyle = fs.readFileSync('node_modules/nprogress/nprogress.css')

module.exports = (state, html, jsBundleUrl) => {
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
        <meta property="description" content="${pageDescription.replace(/</g, '&lt;').replace(/"/g, '&quot;')}" />
        <meta property="og:title" content="${ogTitle.replace(/</g, '&lt;').replace(/"/g, '&quot;')}" />
        <meta property="og:description" content="${ogDescription.replace(/</g, '&lt;').replace(/"/g, '&quot;')}" />
        <meta property="og:image" content="${ogImage}" />
        <meta property="og:type" content="website" />
        <link rel="icon" type="image/png" href=${`${ASSETS_URL}/favicon.png`} />
        <link rel="apple-touch-icon" sizes="180x180" href=${`${ASSETS_URL}/apple-touch-icon.png`}>
        <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.3.1/css/all.css" integrity="sha384-mzrmE5qonljUremFsqc01SB46JvROS7bZs3IO2EmfFsd15uHvIt+Y8vEf7N7fWAU" crossorigin="anonymous">
        <link rel="stylesheet" href="${`${ASSETS_URL}/${NODE_ENV === 'production' ? 'styles.min.css' : 'styles.css'}`}" type="text/css" />
        <style>
          ${nprogressStyle}

          body {
            scroll-behavior: smooth;
            height: 100%;
          }

          body, .panel {
            font-size: .9rem;
          }

          #wrapper {
            position: relative;
          }

          .router {
            min-height: 50vh;
          }

          .section {
            padding: 2rem 1.5rem 3rem;
          }

          @media (max-width: 768px) {
            .section {
              padding-top: 1rem;
            }
          }

          .content a {
            display: inline-block;
            word-break: break-all;
          }

          a.has-text-grey-light:hover {
            color: hsl(0, 0%, 48%)!important;
          }

          .responsive-video-outer {
            max-width: 560px;
          }

          .responsive-video-inner {
            overflow: hidden;
            position: relative;
            padding-top: 25px;
            padding-bottom: 56.25%; /* 16:9 */
            height: 0;
          }

          .responsive-video-inner iframe {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
          }

          .endorse-control .is-light, .endorse-control .is-light:hover {
            border-color: #cecece;
          }

          .fix-bulma-centered-text {
            display: inline-block !important; /* https://github.com/jgthms/bulma/issues/727 */
          }

          .content s {
            opacity: 0.65;
          }

        </style>
        <style>
          ${responsiveTableStyle}
          ${roundAvatarStyle}
        </style>
        <script>
          window.__app_state = ${JSON.stringify({ ...state, route: undefined, hyperloop: undefined }).replace(/<\//g, '<\\/')};
        </script>
      </head>
      <body>
        <div id="application" style="overflow-x: hidden;">${html}</div>

        <script src="/assets/outdatedbrowser.min.js"></script>
        <script>
          //event listener: DOM ready
          function addLoadEvent(func) {
              var oldonload = window.onload;
              if (typeof window.onload != 'function') {
                  window.onload = func;
              } else {
                  window.onload = function() {
                      if (oldonload) {
                          oldonload();
                      }
                      func();
                  }
              }
          }
          //call plugin function after DOM ready
          addLoadEvent(function(){
              outdatedBrowser({
                  bgColor: '#f25648',
                  color: '#ffffff',
                  lowerThan: 'transform',
                  languagePath: '/assets/outdatedbrowser_en.html'
              })
          });

          window.__lo_site_id = 119200;
        </script>
        <div>
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
        </div>
        ${googleAddressAutocompleteScript}
        <script src="${jsBundleUrl}"></script>
      </body>
    </html>
  `
}

const responsiveTableStyle = `
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
`

const roundAvatarStyle = `
  .round-avatar-img {
    border-radius: 50%;
    height: 100% !important;
    object-fit: cover;
  }
`
