const { WWW_DOMAIN } = process.env
const { html } = require('../helpers')
const joinForm = require('./join-form')
const yourLegislators = require('./your-legislators')
const video = require('./video')
const { icon } = require('@fortawesome/fontawesome-svg-core')
const { faStar } = require('@fortawesome/free-solid-svg-icons/faStar')
const { faChevronDown } = require('@fortawesome/free-solid-svg-icons/faChevronDown')
const { faCaretRight } = require('@fortawesome/free-solid-svg-icons/faCaretRight')

module.exports = (state, dispatch) => {
  return html`
    <style>
      .reveal { visibility: hidden; }
    </style>

    <section onconnected="${activateScrollReveal}" class="hero is-link is-bold is-fullheight subtract-toolbar">
      <div class="hero-body">
        <div class="container reveal">
          <h2 class="title is-2 is-size-1-desktop is-size-3-mobile delayed">The Most Powerful Way to Advocate for Your Community</h2>
          <br />
          <br />
          <h3 class="subtitle is-3 is-size-4-mobile delayed1">Built for the legislative process</h3>
          <h4 class="subtitle is-3 is-size-4-mobile delayed1">Easily invite your community to support your positions</h4>
          <h4 class="subtitle is-3 is-size-4-mobile delayed1">Address verification so reps hear their constituents</h4>
          <br />
          <br />
          <div class="delayed2 has-text-centered-mobile">
            ${!state.user ? html`
              <a class="button is-link is-inverted is-medium" href="/join">
                <span class="icon">${icon(faStar)}</span>
                <span><strong>Create your free account</strong></span>
              </a>
            ` : ''}
          </div>
        </div>
      </div>
      <div class="hero-footer">
        <div class="container has-text-centered" style="position: relative; bottom: 40px; opacity: .4">
          <span class="learn-more is-hidden-mobile" style="cursor: default">Learn more</span><br />
          <span class="icon is-large  down-arrow">${icon(faChevronDown, { transform: { size: 32 } })}</span>
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
          <h2 class="title is-3 is-size-2-desktop is-size-4-mobile reveal">Most online petitions today do not verify who is signing. But we <span class="has-text-info">verify constituent identities</span> so reps know what real residents want.</h2>
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <p class="subtitle is-3 is-size-2-desktop is-size-4-mobile reveal">We identify real constituents by cross-referencing phone numbers with the national voter file.</p>
        </div>
      </div>
    </section>

    <section class="hero is-light is-bold is-fullheight">
      <div class="hero-body">
        <div class="container">
          <br />
          <h2 class="title is-2 is-size-1-desktop is-size-3-mobile reveal"><strong>You control your privacy</strong></h2>
          <br />
          <br />
          <br />
          <br />
          <br />
          <div class="columns">
            <div class="column">
              <h3 class="subtitle is-4 is-size-3-desktop reveal">Lead your communities publicly when you want</h3>
            </div>
            <div class="column has-text-right-tablet">
              <img src="/assets/public_vote_sample.png" class="vote-sample">
              <style>
                img.vote-sample {
                  max-width: 498px;
                  width: 100%;
                  box-shadow: 0px 9px 10px 5px #dcdcdc;
                  border: 5px solid white;
                }
              </style>
            </div>
          </div>
          <br />
          <br />
          <br />
          <div class="columns">
            <div class="column">
              <h4 class="subtitle is-4 is-size-3-desktop reveal">Weigh in privately when preferred</h4>
            </div>
            <div class="column has-text-right-tablet">
              <img src="/assets/private_vote_sample.png" class="vote-sample">
            </div>
          </div>
        </div>
      </div>
    </section>


    <section class="hero is-dark is-bold is-fullheight">
      <div class="hero-body">
        <div class="container">
          <h2 class="title is-2 is-size-1-desktop is-size-3-mobile reveal">We're making a new kind of democracy possible:</h2>
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
            <h3 class="title is-4 is-size-3-desktop" style="margin-bottom: 35px">① Scorecards</h3>
            <h4 class="subtitle is-5 is-size-4-desktop">Politicians are <em>automatically graded</em> for how much they follow their constituents' votes.</h4>
            ${yourLegislators(state)}
            <br />
            <br />
            ${!state.user ?
              html`<h4 class="subtitle is-5 is-size-4-desktop"><a href="/join"><span class="icon is-size-5">${icon(faCaretRight)}</span> <strong>Join Now</strong></a> to help create a transparent accountability record.</h4>`
              : ''
            }
          </div>
          <br />
          <br />
          <br />
          <br />
          <br />
          <div class="reveal">
            <h3 class="title is-4 is-size-3-desktop" style="margin-bottom: 35px">② Candidates</h3>
            <h4 class="subtitle is-5 is-size-4-desktop">Pledged to vote as directed by their local liquid democracy.</h4>
            <h4 class="subtitle is-5 is-size-4-desktop">Voters can elect this upgraded representation, <em>when we're ready</em>, one seat at a time.</h4>
            <div class="has-text-centered">
              <a href="${`https://blog.${WWW_DOMAIN}/2017/07/04/running-liquid-democracy-candidates/`}" target="_blank">
                <img src="/assets/app-announces-vote.png" style="max-width: 498px; width: 100%; box-shadow: 0px 5px 10px rgba(0, 0, 0, 0.5); border: 1px solid white;">
              </a>
            </div>
            <br />
            <h4 class="subtitle is-5 is-size-4-desktop">
              <a href="http://liquidcandidates.com" target="_blank">
                <span class="icon" style="font-size: 12px;position: relative;bottom: 3px;">${icon(faStar)}</span>
                <span>Meet the <strong>growing list of Digital Democracy Candidates</strong></span></a>.
            </h4>
          </div>
          <br />
          <br />
          <br />
        </div>
      </div>
    </section>

    ${!state.user ? joinSection(state, dispatch) : html``}

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
                <p class="reveal"><a href="${`https://blog.${WWW_DOMAIN}/2016/09/21/what-is-liquid-democracy/`}" target="_blank">What is Liquid Democracy?</a></p>
                <p class="reveal"><a href="${`https://blog.${WWW_DOMAIN}/2017/07/04/running-liquid-democracy-candidates/`}" target="_blank">Liquid Democracy Candidates: How to Upgrade Our Legislature, One Seat at a Time</a></p>
                <p class="reveal"><a href="${`https://blog.${WWW_DOMAIN}/2018/10/02/introducing-liquid-us/`}" target="_blank">Introducing Liquid US and Support for All 50 States and Local Legislatures</a></p>
              </section>

              <section class="section space-out-multiline">
                <h4 class="title is-4 reveal">Further Reading</h4>
                <p class="reveal"><a href="${`https://blog.${WWW_DOMAIN}/2017/03/06/how-to-move-past-two-parties/`}" target="_blank">How to Move Past A Two Party System</a></p>
                <p class="reveal"><a href="${`https://blog.${WWW_DOMAIN}/2017/10/23/democracy-vs-corruption/`}" target="_blank">Liquid Democracy is the Most Promising Way to Fix Money in Politics</a></p>
                <p class="reveal"><a href="${`https://blog.${WWW_DOMAIN}/2017/04/17/liquid-democracy-and-a-free-political-economy/`}" target="_blank">Liquid Democracy and A Free Political Economy</a></p>
                <p class="reveal"><a href="${`https://blog.${WWW_DOMAIN}/2017/05/12/liquid-democracy-can-completely-eliminate-gerrymandering/`}" target="_blank">Liquid Democracy Can Completely Eliminate Gerrymandering</a></p>
                <p class="reveal"><a href="${`https://blog.${WWW_DOMAIN}/2017/10/27/liquid-democracy-is-not-direct-democracy/`}" target="_blank">Liquid Democracy Is Not Direct Democracy, and That's a Good Thing</a></p>
                <p class="reveal"><a href="${`https://blog.${WWW_DOMAIN}/2016/10/13/dont-care-about-politics/`}" target="_blank">Don't Care About Politics? Liquid Democracy Is Easier for You Too</a></p>
                <p class="reveal"><a href="${`http://secure.united.vote`}" target="_blank">Secure Internet Voting</a></p>
              </section>
              <style>
                .space-out-multiline p {
                  margin-bottom: 7px;
                }
              </style>
            </div>
            <div class="column">
              ${video({ url: 'https://www.youtube.com/embed/4Zd65MqJv0Y' })}
            </div>
          </div>
        </div>
      </div>
    </section>
  `
}

const activateScrollReveal = () => {
  const ScrollReveal = require('scrollreveal').default
  const sr = ScrollReveal({ duration: 800 }) // eslint-disable-line no-undef
  sr.reveal('.reveal')
}

const joinSection = (state, dispatch) => {
  return html`
    <section class="hero is-medium">
      <div class="hero-body">
        ${joinForm(state, dispatch)}
      </div>
    </section>
    <section class="hero is-medium no-vertical-padding">
      <div class="hero-body">
        <p class="subtitle is-4 has-text-centered">Or ask a question: <strong>
        <a onclick=${(event) => dispatch({ type: 'contactForm:toggled', event })}>click here</a></strong> to send us a message.</p>
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
