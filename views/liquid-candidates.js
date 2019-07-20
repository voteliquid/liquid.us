const { html, linkifyUrls } = require('../helpers')

module.exports = () => {

  return html`
    <section class="section">
      <div class="container is-widescreen is-size-5">
        <h2 class="title has-text-weight-normal is-4">Become a Liquid Candidate</h2>
        <div class="columns">
          <div class="column">
            <p>The path to a liquid democracy starts with liquid candidates. These candidates pledge that, if elected, they will use constituent votes cast through Liquid US or a similar liquid system to determine how to vote on every bill.</p><br />
            <p><b>That means we need liquid supporters like you run for office.</b></p>
            <p>${{ html: linkifyUrls('https://youtu.be/X1fiLKO51qY?t=141') }}</p>
            <p>We'll help you get on the ballot, connect you with other local liquid supporters, and provide as much guidance and support as we can.</p><br />
            <p>Intrigued? Fill out the form to learn more.</p>
          </div>
          <div class="column is-one-quarter">
          </div>
        </div>
      </div>
      <style>
        @media (min-width: 1050px) {
          .contact-info-box {
            max-width: 500px;
            padding: 3px;
          }
        </style>
    </section>
  `
}
