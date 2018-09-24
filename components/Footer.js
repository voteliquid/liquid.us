const { NODE_ENV } = process.env
const { html } = require('../helpers')
const quotes = require('../quotes')

module.exports = {
  randomQuote: (dispatch) => {
    dispatch({
      type: 'quoteSelected',
      quote: quotes[Math.floor(Math.random() * quotes.length)],
    })
  },
  init: [{
    randomQuote: quotes[Math.floor(Math.random() * quotes.length)],
  }],
  update: (event, state) => {
    switch (event.type) {
      case 'quoteSelected':
        return [{ ...state, randomQuote: event.quote }]
      default:
        return [state]
    }
  },
  view: ({ randomQuote }) => {
    return html()`
      <style>
        .quote-icon {
          color: rgb(115, 115, 115);
          opacity: 0.2;
          font-size: 80px;
          font-weight: 700;
          position: absolute;
          left: -40px;
          top: -41px;
        }

        @media (max-width: 768px) {
          .quote-icon {
            font-size: 71px;
            left: -21px;
            top: -51px;
          }
        }

        .default-cursor:hover {
          cursor: default;
        }
      </style>
      <footer class="footer has-text-centered">
        <div class="columns is-centered">
          <div class="column is-half section is-clearfix" style="padding: 3rem 3rem 0;">
            <img src="/assets/unitedvote_mark.svg" alt="united.vote" width="40" height="28">
            <p class="is-size-7" style="margin-top: 3rem;"><a href="/" class="has-text-black"><strong>United</strong></a> makes democracy smarter and more accountable.</p>
            <br />
            <div style="margin: 6rem 0 3rem; position: relative;">
              <span class="quote-icon default-cursor">“</span>
              <p class="title has-text-grey is-4 has-text-justified default-cursor">${[randomQuote.text.replace(/\n/g, '<br />')]}</p>
              ${[randomQuote.author ? `<p class="title is-5 has-text-grey has-text-right">— <em>${randomQuote.author}</em></p>` : '']}
              ${[randomQuote.date ? `<p class="title is-6 has-text-right has-text-grey is-uppercase">${randomQuote.date}</p>` : '']}
            </div>
          </div>
        </div>
        <style>
          .footer {
            padding: 3rem 0rem 3.5rem;
          }
        </style>
      </footer>

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
    `
  },
}
