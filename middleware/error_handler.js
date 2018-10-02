const { APP_NAME, ASSETS_URL, WWW_DOMAIN } = process.env

module.exports = (htmlHead) => {
  return function errorHandler(error, req, res, next) { // eslint-disable-line no-unused-vars
    console.error(error)

    res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head>
          ${htmlHead ? htmlHead({}) : ''}
        </head>
        <body>
          <div id="hyperloop_application">
            <div class="hero">
              <div class="hero-body has-text-centered">
                <div class="container">
                  <a href="/">
                    <img src=${`${ASSETS_URL}/unitedvote_mark.png`} alt="${APP_NAME}" width="45" height="45" />
                  </a>
                  <h1 class="title">We are experiencing technical difficulties</h1>
                  <h2 class="subtitle">Please contact <a href="${`mailto:support@${WWW_DOMAIN}`}">support@${WWW_DOMAIN}</a> if the problem persists</h2>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `)
  }
}
