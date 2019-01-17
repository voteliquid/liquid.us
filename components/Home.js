const { APP_NAME, WWW_DOMAIN } = process.env
const { combineEffects, html, mapEffect, mapEvent } = require('../helpers')
const JoinForm = require('./JoinForm')
const YourLegislators = require('./YourLegislators')
const Video = require('./Video')

const initialize = (state) => combineEffects(
  mapEffect('yourLegislatorsEvent', YourLegislators.init(state)[1]),
  mapEffect('joinFormEvent', JoinForm.init(state)[1])
)

module.exports = {
  init: ({ location, storage, user }) => [{
    location,
    joinForm: JoinForm.init({ location, storage, user })[0],
    storage,
    user,
  }, initialize({ location, storage, user })],
  update: (event, state) => {
    switch (event.type) {
      case 'connected':
        return [state, activateScrollReveal]
      case 'yourLegislatorsEvent':
        const [yourLegislatorsState, yourLegislatorsEffect] = YourLegislators.update(event.event, state)
        if (event.event.type === 'officesLoaded') {
          return [state, (dispatch) => dispatch({ type: 'loaded' })]
        }
        return [{ ...state, ...yourLegislatorsState }, mapEffect('yourLegislatorsEffect', yourLegislatorsEffect)]
      case 'joinFormEvent':
        const [joinFormState, joinFormEffect] = JoinForm.update(event.event, { ...state, ...state.joinForm })
        if (event.event.type === 'redirected') {
          return [state, joinFormEffect]
        }
        return [{ ...state, joinForm: joinFormState }, mapEffect('joinFormEvent', joinFormEffect)]
      case 'contactWidgetOpened':
      case 'loaded':
      default:
        return [state]
    }
  },
  view: (state, dispatch) => {
    return html()`
      <style>
        .reveal { visibility: hidden; }
      </style>

      <section onconnected="${() => dispatch({ type: 'connected' })}" class="hero is-link is-bold is-fullheight subtract-toolbar">
        <div class="hero-body">
          <div class="container reveal has-text-centered-mobile">
            <h2 class="subtitle is-4 is-size-5-mobile has-text-weight-light"><em>Healthier democracy for 2019</em></h2>
            <br />
            <h2 class="title is-2 is-size-1-desktop is-hidden-mobile delayed">Welcome to Liquid</h2>
            <br />
            <h3 class="title is-4 is-size-4-mobile delayed1">Be heard on key issues.</h3>
            <h3 class="title is-4 is-size-4-mobile delayed2">Pick your own representatives.</h3>
            <br />
            <br />
            <div class="delayed3 has-text-centered-mobile">
              ${!state.user ? [`
                <a class="button is-link is-inverted is-medium" href="/join">
                  <span class="icon"><i class="fa fa-star"></i></span>
                  <span><strong>Create your free account</strong></span>
                </a>
              `] : ''}
            </div>
          </div>
        </div>
        <div class="hero-footer">
          <div class="container has-text-centered down-arrow" style="position: relative; bottom: 40px;">
            <span style="cursor: default">more</span><br />
            <span class="icon is-large "><i class="fa fa-2x fa-chevron-down"></i></span>
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
          .delayed3 {
            animation: delayed3-animation 3.8s cubic-bezier(0.6, 0.2, 0.1, 1);
          }
          @keyframes delayed3-animation {
            0% { opacity: 0; }
            79% { opacity: 0; transform: scale(0.9) translate(0, 20px); }
            100% { opacity: 1; transform: scale(1) translate(0, 0); }
          }
          .down-arrow {
            animation: down-arrow-animation 2s infinite;
            animation-delay: 3s;
            opacity: 0;
          }
          @keyframes down-arrow-animation {
            0% { transform: translate(0, 0); opacity: 0; }
            50% { opacity: .4; }
            100% { transform: translate(0px, 20px); opacity: 0; }
          }
        </style>
      </section>

      <section class="hero is-dark is-bold is-fullheight">
        <div class="hero-body">
          <div class="container">
            <p class="title is-3 is-size-2-desktop is-size-4-mobile reveal">Before Liquid, we only got <span class="has-text-danger">one</span> elected rep per district.</p>
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <p class="title is-3 is-size-2-desktop is-size-4-mobile reveal"><strong>Personal Representatives</strong></p>
            <p class="subtitle is-4 is-size-3-desktop is-size-5-mobile reveal">Liquid lets us pick whoever we want to champion our values.</p>
          </div>
        </div>
      </section>

      <section class="hero is-light is-bold is-fullheight">
        <div class="hero-body">
          <div class="container">
            <h2 class="title is-2 is-size-1-desktop is-size-3-mobile reveal">Would you choose:</h2>
            <br />
            <br />
            <br />
            <h3 class="subtitle has-text-weight-light is-4 is-size-3-desktop reveal">A more trustworthy politician?</h3>
            <br />
            <br />
            <br />
            <h3 class="subtitle has-text-weight-light is-4 is-size-3-desktop reveal">A favorite expert?</h3>
            <br />
            <br />
            <br />
            <h4 class="subtitle has-text-weight-light is-4 is-size-3-desktop reveal">A family member?</h4>
          </div>
        </div>
      </section>


      <section class="hero is-dark is-bold is-fullheight">
        <div class="hero-body">
          <div class="container">
            <h2 class="title is-2 is-size-1-desktop is-size-3-mobile reveal"><span class="has-text-info">Represent ourselves</span> when we want</h2>
            <br />
            <h2 class="subtitle is-3 is-size-4-mobile reveal">${APP_NAME} makes a new kind of democracy possible.</h2>
            <br />
            <br />
            <br />
            <p class="subtitle is-3 is-size-4-mobile reveal">Vote directly on policy where you feel informed.</p>
            <p class="subtitle is-3 is-size-4-mobile reveal">Choose personal representatives the rest of the time.</p>
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
              ${YourLegislators.view(state, mapEvent('yourLegislatorsEvent', dispatch))}
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
              <h4 class="subtitle is-5 is-size-4-desktop"><a href="http://liquidcandidates.com" target="_blank"><span class="icon"><i class="fa fa-star"></i></span>&nbsp; <span>Meet the <strong>growing list of Digital Democracy Candidates</strong></span></a>.</h4>
            </div>
            <br />
            <br />
            <br />
          </div>
        </div>
      </section>

      ${!state.user ? JoinSection(state, dispatch) : []}

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
                  <p class="reveal"><a href="${`https://blog.${WWW_DOMAIN}/2017/11/06/announcing-united-vote/`}" target="_blank">Introducing United.vote: Help Build a Democracy We Can Trust</a></p>
                  <p class="reveal"><a href="${`https://blog.${WWW_DOMAIN}/2017/07/04/running-liquid-democracy-candidates/`}" target="_blank">Liquid Democracy Candidates: How to Upgrade Our Legislature, One Seat at a Time</a></p>
                </section>

                <section class="section space-out-multiline">
                  <h4 class="title is-4 reveal">Further Reading</h4>
                  <p class="reveal"><a href="${`https://blog.${WWW_DOMAIN}/2017/03/06/how-to-move-past-two-parties/`}" target="_blank">How to Move Past A Two Party System</a></p>
                  <p class="reveal"><a href="${`https://blog.${WWW_DOMAIN}/2017/10/23/democracy-vs-corruption/`}" target="_blank">Democracy vs. Corruption: How to Really Drain the Swamp</a></p>
                  <p class="reveal"><a href="${`https://blog.${WWW_DOMAIN}/2017/04/17/liquid-democracy-and-a-free-political-economy/`}" target="_blank">Liquid Democracy and A Free Political Economy</a></p>
                  <p class="reveal"><a href="${`https://blog.${WWW_DOMAIN}/2017/05/12/liquid-democracy-can-completely-eliminate-gerrymandering/`}" target="_blank">Liquid Democracy Can Completely Eliminate Gerrymandering</a></p>
                  <p class="reveal"><a href="${`https://blog.${WWW_DOMAIN}/2017/10/27/liquid-democracy-is-not-direct-democracy/`}" target="_blank">Liquid Democracy Is Not Direct Democracy, and That's a Good Thing</a></p>
                  <p class="reveal"><a href="${`https://blog.${WWW_DOMAIN}/2016/10/13/dont-care-about-politics/`}" target="_blank">Don't Care About Politics? Liquid Democracy Is Easier for You Too</a></p>
                  <p class="reveal"><a href="${`http://secure.${WWW_DOMAIN}`}" target="_blank">Secure Internet Voting</a></p>
                </section>
                <style>
                  .space-out-multiline p {
                    margin-bottom: 7px;
                  }
                </style>
              </div>
              <div class="column">
                ${Video({ url: 'https://www.youtube.com/embed/XMrRrzYXav8' })}
              </div>
            </div>
          </div>
        </div>
      </section>
    `
  },
}

const activateScrollReveal = () => {
  const ScrollReveal = require('scrollreveal').default
  const sr = ScrollReveal({ duration: 800 }) // eslint-disable-line no-undef
  sr.reveal('.reveal')
}

const JoinSection = (state, dispatch) => {
  return html()`
    <section class="hero is-medium">
      <div class="hero-body">
        ${JoinForm.view({ ...state, ...state.joinForm }, mapEvent('joinFormEvent', dispatch))}
      </div>
    </section>
    <section class="hero is-medium no-vertical-padding">
      <div class="hero-body">
        <p class="subtitle is-4 has-text-centered reveal">Or ask a question: <strong>
        <a onclick=${(event) => dispatch({ type: 'contactWidgetOpened', event })}>click here</a></strong> to send us a message.</p>
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
