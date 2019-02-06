const { ASSETS_URL, NODE_ENV, WWW_DOMAIN } = process.env
const { avatarURL } = require('../helpers')
const fs = require('fs')
const nprogressStyle = fs.readFileSync('node_modules/nprogress/nprogress.css')

module.exports = (state, html, bundleUrl) => {
  const { page_description, page_title, selected_bill, selected_profile } = state
  const description = page_description || `A new democracy for the modern world.`
  const title = page_title ? `${page_title} | Liquid US` : `Liquid US | Digital Democracy Voting Platform`
  const isComment = ~title.indexOf('tell')

  const index = title.indexOf("on")
  const commentPosition = title.substr(0, index)
  const commentBill = title.substr(index + 1)
  // Potential og_image, first one wins
  const wi_image = state.location && state.location.query.legislature === 'WI' && state.location.path === '/legislation' && `${ASSETS_URL}/WI.png`
    // TODO (Jan 8, 2018): replace wi_image to support all 50 states
  const profile_image = selected_profile ? avatarURL(selected_profile) : ''
  const measure_image = selected_bill && selected_bill.image_name ? `${ASSETS_URL}/measure-images/${selected_bill.image_name}` : ''
  const default_image = `https://blog.${WWW_DOMAIN}/assets/twitter_large.png`
  const og_image_url = state.og_image_url || wi_image || profile_image || measure_image || default_image


  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${isComment ? commentBill : title}</title>
        <link rel="icon" type="image/png" href=${`${ASSETS_URL}/favicon.png`} />
        <link rel="apple-touch-icon" sizes="180x180" href=${`${ASSETS_URL}/apple-touch-icon.png`}>
        <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.3.1/css/all.css" integrity="sha384-mzrmE5qonljUremFsqc01SB46JvROS7bZs3IO2EmfFsd15uHvIt+Y8vEf7N7fWAU" crossorigin="anonymous">
        <link rel="stylesheet" href=${`${ASSETS_URL}/styles.css`}>
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

        </style>
        <meta property="og:title" content="${wi_image ? `Wisconsin Legislation` : title.replace(/</g, '&lt;').replace(/"/g, '&quot;')}" />
        <meta property="og:description" content="${wi_image ? `Vote now on extraordinary session bills.` : description.replace(/</g, '&lt;').replace(/"/g, '&quot;')}" />
        <meta property="og:image" content="${og_image_url}" />
        <meta property="og:type" content="website" />
        ${responsiveTableStyle}
        ${roundAvatarStyle}
        <script>
          window.__app_state = ${JSON.stringify({ ...state, route: undefined, hyperloop: undefined }).replace(/<\//g, '<\\/')};
        </script>
      </head>
      <body>
        <div id="application">${html}</div>

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
          ${[NODE_ENV === 'production' ? `
            <script async src="https://d10lpsik1i8c69.cloudfront.net/w.js"></script>
            <script async src="https://www.googletagmanager.com/gtag/js?id=UA-84279342-5"></script>
            <script>
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());

              gtag('config', 'UA-84279342-5');
            </script>
          ` : '']}
        </div>
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
