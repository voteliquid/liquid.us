const { APP_NAME } = process.env
const Component = require('./Component')
const JoinForm = require('./JoinForm')
const YourLegislators = require('./YourLegislators')
const Video = require('./Video')

module.exports = class Home extends Component {
  onload() {
    window.sr = window.ScrollReveal({ duration: 800 }) // eslint-disable-line no-undef
    window.sr.reveal('.reveal')
  }
  render() {
    const { user } = this.state

    return this.html`
      <script onload=${this} src="//unpkg.com/scrollreveal/dist/scrollreveal.min.js"></script>

      <style>
        .reveal { visibility: hidden; }
      </style>

      <section onconnected=${this} class="hero is-link is-bold is-fullheight subtract-toolbar">
        <div class="hero-body">
          <div class="container reveal">
            <h2 class="title is-2 is-size-1-desktop is-size-3-mobile delayed">Healthier democracy for the modern world</h2>
            <br />
            <br />
            <h3 class="subtitle is-3 is-size-4-mobile delayed1">Where everyone has a voice on every issue</h3>
            <h4 class="subtitle is-3 is-size-4-mobile delayed1">We can trust our representatives</h4>
            <h4 class="subtitle is-3 is-size-4-mobile delayed1">And if they lose our trust, we can <strong>replace them</strong> immediately.</h4>
            <br />
            <br />
            <div class="delayed2 has-text-centered-mobile">
              ${!user ? [`
                <a class="button is-link is-inverted is-medium" href="/join">
                  <span class="icon"><i class="fa fa-star"></i></span>
                  <span><strong>Create your free account</strong></span>
                </a>
              `] : ''}
            </div>
          </div>
        </div>
        <div class="hero-footer">
          <div class="container has-text-centered" style="position: relative; bottom: 40px; opacity: .4">
            <span class="learn-more is-hidden-mobile" style="cursor: default">Learn more</span><br />
            <span class="icon is-large  down-arrow"><i class="fa fa-2x fa-chevron-down"></i></span>
          </div>
        </div>
        <style>
          .hero.is-fullheight.subtract-toolbar {
            min-height: calc(100vh - 64px);
          }
          .delayed {
            animation: delayed-animation 0.6s cubic-bezier(0.6, 0.2, 0.1, 1);
          }
          @keyframes delayed-animation {
            0% { opacity: 0; transform: scale(0.9) translate(0, 20px); }
            100% { opacity: 1; transform: scale(1) translate(0, 0); }
          }
          .delayed1 {
            animation: delayed1-animation 1.8s cubic-bezier(0.6, 0.2, 0.1, 1);
          }
          @keyframes delayed1-animation {
            0% { opacity: 0; }
            55% { opacity: 0; transform: scale(0.9) translate(0, 20px); }
            100% { opacity: 1; transform: scale(1) translate(0, 0); }
          }
          .delayed2 {
            animation: delayed2-animation 2.8s cubic-bezier(0.6, 0.2, 0.1, 1);
          }
          @keyframes delayed2-animation {
            0% { opacity: 0; }
            71% { opacity: 0; transform: scale(0.9) translate(0, 20px); }
            100% { opacity: 1; transform: scale(1) translate(0, 0); }
          }
          .down-arrow {
            animation: down-arrow-animation 2s infinite;
            animation-delay: 3s;
            opacity: 0;
          }
          @keyframes down-arrow-animation {
            0% { transform: translate(0, 0); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: translate(0px, 20px); opacity: 0; }
          }
          .learn-more {
            animation: fadein 4s;
          }
          @keyframes fadein {
            0% { opacity: 0; }
            75% { opacity: 0; }
            100% { opacity: 1; }
          }
        </style>
      </section>

      <section class="hero is-dark is-bold is-fullheight">
        <div class="hero-body">
          <div class="container">
            <h2 class="title is-3 is-size-2-desktop is-size-4-mobile reveal">Right now, <span class="has-text-danger">a single person</span> chosen from a limited ballot, serves as the only representative for <span class="has-text-danger">a million of us</span>.</h2>
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <p class="subtitle is-3 is-size-2-desktop is-size-4-mobile reveal">What if each of us could pick whoever we wanted — <strong>personal representatives</strong> — to more closely champion our values?</p>
          </div>
        </div>
      </section>

      <section class="hero is-light is-bold is-fullheight">
        <div class="hero-body">
          <div class="container">
            <h2 class="title is-2 is-size-1-desktop is-size-3-mobile reveal">Who would you choose?</h2>
            <br />
            <br />
            <br />
            <h3 class="subtitle is-4 is-size-3-desktop reveal">A more trustworthy politician?</h3>
            <br />
            <br />
            <br />
            <h3 class="subtitle is-4 is-size-3-desktop reveal">A favorite expert?</h3>
            <br />
            <br />
            <br />
            <h4 class="subtitle is-4 is-size-3-desktop reveal">A family member?</h4>
          </div>
        </div>
      </section>


      <section class="hero is-dark is-bold is-fullheight">
        <div class="hero-body">
          <div class="container">
            <h2 class="title is-2 is-size-1-desktop is-size-3-mobile reveal">And what if we could <span class="has-text-info">represent ourselves</span> when we wanted?</h2>
          </div>
        </div>
      </section>

      <section class="hero is-light is-bold is-fullheight">
        <div class="hero-body">
          <div class="container">
            <p class="title is-2 is-size-3-mobile reveal">Now we can.</p>
            <br />
            <br />
            <br />
            <h2 class="subtitle is-3 is-size-4-mobile reveal">${APP_NAME} makes a new kind of democracy possible:</h2>
            <br />
            <br />
            <br />
            <h3 class="subtitle is-3 is-size-4-mobile reveal"><em>Liquid democracy</em>.</h3>
            <br />
            <br />
            <br />
            <h4 class="subtitle is-3 is-size-4-mobile reveal">Vote directly on policy when you want, and choose personal proxies to represent you the rest of the time.</h4>
          </div>
        </div>
      </section>

      <section class="hero is-link is-bold is-fullheight">
        <style>
          .hero.is-bold a:hover > * {
            text-decoration: underline;
          }
          .hero.is-bold a:hover .icon {
            text-decoration: none;
          }
        </style>
        <div class="hero-body">
          <div class="container">
            <br />
            <br />
            <br />
            <h2 class="title is-2 is-size-1-desktop is-size-3-mobile reveal" style="margin-bottom: 35px">How we reach a healthier democracy:</h2>
            <h4 class="subtitle is-4 is-size-4-desktop reveal">Without first needing to change any laws</h4>
            <br />
            <br />
            <br />
            <div class="reveal">
              <h3 class="title is-4 is-size-3-desktop" style="margin-bottom: 35px">Phase 1 - ${APP_NAME} Scorecards</h3>
              <h4 class="subtitle is-5 is-size-4-desktop">Politicians are <em>automatically graded</em> for how much they follow their constituents' votes.</h4>
              ${YourLegislators.for(this)}
              <style>
                .YourLegislators {
                  border: 1px solid hsla(0, 0%, 100%, 0.5);
                  padding: 25px;
                  border-radius: 6px;
                }

                .YourLegislators .notification {
                  background-color: inherit;
                  padding: 0;
                }

                .YourLegislators .has-text-grey {
                  color: white !important;
                }
              </style>
              <br />
              <br />
              <h4 class="subtitle is-5 is-size-4-desktop"><a href="/join"><span class="icon is-size-5"><i class="fa fa-caret-right" style="position:relative;bottom: 2px;"></i></span> <strong>Join Now</strong></a> to help create a transparent accountability record.</h4>
            </div>
            <br />
            <br />
            <br />
            <br />
            <br />
            <div class="reveal">
              <h3 class="title is-4 is-size-3-desktop" style="margin-bottom: 35px">Phase 2 — Liquid Candidates</h3>
              <h4 class="subtitle is-5 is-size-4-desktop">Pledged to vote on everything as directed by their local liquid democracy.</h4>
              <h4 class="subtitle is-5 is-size-4-desktop">Voters can elect this upgraded representation, <em>when we're ready</em>, one seat at a time.</h4>
              <h4 class="subtitle is-5 is-size-4-desktop"><a href="https://2018.united.vote" target="_blank"><span class="icon"><i class="fa fa-star"></i></span>&nbsp; <span>Meet the <strong>2018 Liquid Candidates</strong></span></a>.</h4>
            </div>
            <br />
            <br />
            <br />
          </div>
        </div>
      </section>

      ${!user ? JoinSection.for(this) : []}

      <section class="hero is-medium">
        <div class="hero-body">
          <div class="container">
            <section class="section">
              <h2 class="title is-2 reveal">Learn More</h2>
            </section>
            <div class="columns">
              <div class="column">
                <section class="section space-out-multiline">
                  <h4 class="title is-4 reveal">Introduction</h4>
                  <p class="reveal"><a href="https://blog.united.vote/2016/09/21/what-is-liquid-democracy/" target="_blank">What is Liquid Democracy?</a></p>
                  <p class="reveal"><a href="https://blog.united.vote/2017/11/06/announcing-united-vote/" target="_blank">Introducing United.vote: Help Build a Democracy We Can Trust</a></p>
                  <p class="reveal"><a href="https://blog.united.vote/2017/07/04/running-liquid-democracy-candidates/" target="_blank">Liquid Democracy Candidates: How to Upgrade Our Legislature, One Seat at a Time</a></p>
                </section>

                <section class="section space-out-multiline">
                  <h4 class="title is-4 reveal">Further Reading</h4>
                  <p class="reveal"><a href="https://blog.united.vote/2017/03/06/how-to-move-past-two-parties/" target="_blank">How to Move Past A Two Party System</a></p>
                  <p class="reveal"><a href="https://blog.united.vote/2017/10/23/democracy-vs-corruption/" target="_blank">Democracy vs. Corruption: How to Really Drain the Swamp</a></p>
                  <p class="reveal"><a href="https://blog.united.vote/2017/04/17/liquid-democracy-and-a-free-political-economy/" target="_blank">Liquid Democracy and A Free Political Economy</a></p>
                  <p class="reveal"><a href="https://blog.united.vote/2017/05/12/liquid-democracy-can-completely-eliminate-gerrymandering/" target="_blank">Liquid Democracy Can Completely Eliminate Gerrymandering</a></p>
                  <p class="reveal"><a href="https://blog.united.vote/2017/10/27/liquid-democracy-is-not-direct-democracy/" target="_blank">Liquid Democracy Is Not Direct Democracy, and That's a Good Thing</a></p>
                  <p class="reveal"><a href="https://blog.united.vote/2016/10/13/dont-care-about-politics/" target="_blank">Don't Care About Politics? Liquid Democracy Is Easier for You Too</a></p>
                  <p class="reveal"><a href="http://secure.united.vote" target="_blank">Secure Internet Voting</a></p>
                </section>
                <style>
                  .space-out-multiline p {
                    margin-bottom: 7px;
                  }
                </style>
              </div>
              <div class="column">
                ${Video.for(this)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="hero is-dark is-bold">
        <div class="hero-body">
          <div class="container">
            <br />
            <br />
            <h3 class="title is-3 is-size-2-desktop is-size-4-mobile reveal">Want liquid democracy beyond Congress?</h3>
            <br />
            <br />
            <h4 class="subtitle is-4 is-size-3-desktop is-size-5-mobile reveal"><a href="/new_legislatures" class="has-text-info has-text-weight-bold">Learn about</a> bringing <strong>${APP_NAME}</strong> to new legislatures.</h4>
            <br />
          </div>
        </div>
      </section>
    `
  }
}

const JoinSection = class JoinSection extends Component {
  onclick(event) {
    event.preventDefault()
    return { isContactWidgetVisible: !this.state.isContactWidgetVisible }
  }

  render() {
    return this.html`
      <section class="hero is-medium">
        <div class="hero-body">
          ${JoinForm.for(this)}
        </div>
      </section>
      <section class="hero is-medium no-vertical-padding">
        <div class="hero-body">
          <p class="subtitle is-4 has-text-centered reveal">Or ask a question: <strong><a onclick=${this}>click here</a></strong> to send us a message.</p>
        </div>
      </section>
      <style>
        .hero.is-medium.no-vertical-padding .hero-body {
          padding-top: 0;
          padding-bottom: 0;
        }
      </style>
    `
  }
}
