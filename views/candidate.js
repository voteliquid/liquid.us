const { APP_NAME, WWW_DOMAIN } = process.env
const { html } = require('../helpers')
const joinFormCandidate = require('./join-form-candidate')
const yourLegislators = require('./your-legislators')
const video = require('./video')

module.exports = (state, dispatch) => {
  return html`
    <style>
      .reveal { visibility: hidden; }
    </style>

    <section onconnected="${activateScrollReveal}" class="hero is-link is-bold is-fullheight subtract-toolbar">
      <div class="hero-body">
        <div class="container reveal">
          <h2 class="title is-2 is-size-1-desktop is-size-3-mobile has-text-centered delayed">Run on ideas. Be a leader. Get elected.</h2>
          <br />
          <br />
          <div class="columns">
            <div class="column">
              ${!state.user ? joinSection(state, dispatch) : html``}
            </div>
            <div class="column is-1"></div>
            <div class="column is is-paddingless">
              <h3 class="subtitle is-3 is-size-4-mobile delayed1">Do you have a policy idea that deserves the public's attention?
              <br /><br />
              Do you wish you could focus your energy on the important stuff, not raising money and sound bytes?
              <br /><br />
              So do we.
              <br /><br />
              And we're here to help.</h3>
              <br />
              <br />
            </div>
          </div>
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

    <section class="hero is-light is-bold is-fullheight">
      <div class="hero-body">
        <div class="container">
          <h2 class="title is-3 is-size-2-desktop is-size-3-mobile has-text-centered reveal">We help you win elections</h2>
          <br />
          <br />
          <br />
          <div class="columns has-text-centered">
            <div class="column">
              <h2 class="title is-4 has-text-centered">Educate your community</h2>
              <img src="/assets/creativitycolor1.png" width="40%">
              <br /><br />
            </div>
            <div class="column">
              <h2 class="title is-4 has-text-centered">Build participation</h2>
              <img src="/assets/community.png" width="40%">
              <br /><br />
            </div>
            <div class="column">
              <h2 class="title is-4 has-text-centered">Raise funds</h2>
              <div class="is-vcentered"><img src="/assets/fundraisecolor1.png" width="40%"></div>
              <br /><br />
            </div>            
          </div>
          
          <br />
          <br />
          <br />
          <br />
          <p class="subtitle is-4 is-size-4-desktop reveal">Most campaigns have it backward. Raising money is their first priority.
          <br /><br />
          We know from experience that it doesn't need to be this way. 
          <br /><br />
          You can focus on the critical issues. You can spend your time listening, educating and increasing participation. And have faith that it will accelerate the growth of your campaign and how you fund it.</p>
          <br />
          <br />
          <br />
          </div>
      </div>
    </section>

    <section class="hero is-light is-bold is-fullheight">
      <div class="hero-body">
        <div class="container">
          <br />
          <br />
          <br />
          <h2 class="title is-2 is-size-1-desktop is-size-3-mobile reveal"><strong>We're your PR firm, engineering team\nand creative agency all rolled into one.</strong></h2>
          <br />
          <br />
          <br />
          <br />
          <br />
          <div class="columns is-vcentered">
            <div class="column is-2">
            </div>
            <div class="column">
              <h3 class="subtitle is-4 is-size-4-desktop reveal"><strong>Creative support</strong> with brainstorming, writing and design to make your vision easy to spread.</h3>
            </div>
            <div class="column is-1"></div>
            <div class="column has-text-centered">
              <img src="/assets/creativitycolor1.png" width="60%">
            </div>
            <div class="column is-2">
            </div>
          </div>
          <br />
          <br />
          <br />
          <div class="columns is-vcentered">
            <div class="column is-2"></div>
            <div class="column has-text-left-tablet is-hidden-desktop">
              <h4 class="subtitle is-4 is-size-4-desktop reveal"><strong>Hands-on tech help</strong> to make everything work with your existing systems.</h4>
            </div>
            <div class="column has-text-centered">
              <img src="/assets/techcolor1.png" width="60%">
            </div>
            <div class="column is-1"></div>
            <div class="column has-text-left-tablet is-hidden-mobile">
              <h4 class="subtitle is-4 is-size-4-desktop reveal"><strong>Hands-on tech help</strong> to make everything work with your existing systems.</h4>
            </div>
            <div class="column is-2">
            </div>
          </div>
          <br />
          <br />
          <br />
          <div class="columns is-vcentered">
            <div class="column is-2">
            </div>
            <div class="column has-text-left-tablet">
              <h3 class="subtitle is-4 is-size-4-desktop reveal"><strong>Marketing strategy</strong> and hands-on support to figure out social media, the press and hitting your fundraising goals.</h3>
            </div>
            <div class="column is-1"></div>
            <div class="column has-text-centered">
              <img src="/assets/viralcolor1.png" width="60%">
            </div>
            <div class="column is-2">
            </div>
          </div>
        </div>
      </div>
    </section>
    <section class="hero is-dark is-bold is-fullheight">
      <div class="hero-body">
        <div class="container">
          <h2 class="title is-2 is-size-1-desktop is-size-3-mobile reveal">Get Started with<span class="has-text-info"> ${APP_NAME}</span></h2>
          <br />
          <br />
          <br />
          <h4 class="subtitle is-3 is-size-4-mobile reveal">
          1. <strong>Send us your policy ideas in writing.</strong> We'll sculpt them into a kickass Liquid Initiative.
          <br /> <br />
          2. <strong>Invite the community.</strong> Leverage the press and social media to reach 10x more people than your campaign has before.
          <br /> <br />
          3. <strong>Ride the wave of support.</strong> Empower your new supporters to fuel your candidacy.</h4>
        </div>
      </div>
    </section>

    <section class="hero is-light is-bold is-fullheight">
    <div class="hero-body">
      <div class="container">
        <br />
        <h2 class="title is-2 is-size-1-desktop is-size-3-mobile reveal"><strong>Liquid Democracy enables choice & accountability</strong></h2>
        <br />
        <br />
        <br />
        <br />
        <br />
        <div class="columns is-vcentered">
          <div class="column is-2"></div>
          <div class="column">
            <h3 class="subtitle is-4 is-size-4-desktop reveal"><strong>Participate anywhere</strong> any time from any device. It's silly to wait years to exercise our right to vote. Let's unlock the true power of the devices in our pockets for the public good.</h3>
          </div>
          <div class="column is-1"></div>
          <div class="column has-text-centered">
            <img src="/assets/anywherecolor1.png" width="60%">
          </div>
          <div class="column is-2"></div>
        </div>
        <br />
        <br />
        <br />
        <div class="columns is-vcentered">
          <div class="column is-1"></div>
          <div class="column has-text-left-tablet is-hidden-desktop">
            <h4 class="subtitle is-4 is-size-4-desktop reveal"><strong>Delegate your vote</strong> to people you trust. They can then delegate to whomever they choose. This trust network enables us to make optimal decisions that represent everyone.</h4>
          </div>
          <div class="column has-text-centered">
            <img src="/assets/delegatecolor1.png" width="60%">
          </div>
          <div class="column is-1"></div>
          <div class="column has-text-left-tablet is-hidden-mobile">
            <h4 class="subtitle is-4 is-size-4-desktop reveal"><strong>Delegate your vote</strong> to people you trust. They can then delegate to whomever they choose. This trust network enables us to make optimal decisions that represent everyone.</h4>
          </div>
          <div class="column is-1"></div>
        </div>
        <br />
        <br />
        <br />
        <div class="columns is-vcentered">
          <div class="column is-2"></div>
          <div class="column has-text-left-tablet">
            <h3 class="subtitle is-4 is-size-4-desktop reveal"><strong>Make your vote count</strong> on issues where you have expertise. Unlike today's winner-takes-all-system, Liquid ensures you always have a direct say on legislation.</h3>
          </div>
          <div class="column is-1"></div>
          <div class="column  has-text-centered">
            <img src="/assets/voting.png" width="60%">
          </div>
          <div class="column is-2"></div>
        </div>
        <br />
        <br />
        <br />
        <div class="columns is-vcentered">
          <div class="column is-2"></div>
          <div class="column has-text-left-tablet is-hidden-desktop">
            <h4 class="subtitle is-4 is-size-4-desktop reveal"><strong>Hold elected leaders accountable.</strong> Liquid automatically compares what the people want with how elected leaders vote.</h4>
          </div>          
          <div class="column has-text-centered">
            <img src="/assets/accountability.png" width="60%">
          </div>
          <div class="column is-1"></div>
          <div class="column has-text-left-tablet is-hidden-mobile">
            <h4 class="subtitle is-4 is-size-4-desktop reveal"><strong>Hold elected leaders accountable.</strong> Liquid automatically compares what the people want with how elected leaders vote.</h4>
          </div>
          <div class="column is-2">
          </div>
        </div>
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
        <h2 class="title is-2 is-size-1-desktop is-size-3-mobile reveal">Why we're doing this</h2>
        <br /><br />
        <h4 class="subtitle is-4 is-size-3-desktop reveal">We believe in the transformative promise of a concept called Liquid Democracy.
        <br /><br />
        The idea is so powerful that we're fully funded and have attracted some of the world's foremost political organizing and technology talent.
        <br /><br />
        We are non-partisan and charge nothing. We just want a healthier Democracy.</h4>
        <br />
        <br />
        <br />
        <br />
      </div>
    </div>
  </section>

  <div class="columns">>
  <div class="column"></div>
    <div class="column is-5">
      <br /><br />
      ${!state.user ? joinSection(state, dispatch) : html``}
    </div>
    <div class="column"></div>
  </div>
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
              <p>Images by priyanka, KonKapp, Maxim Basinski, Delwar Hossain, Maxim Kulikov, flatart, jugalbandi, Turkkub, zidney, Max Hancock, adrien coquet from the Noun Project.</p>
            </div>
            <div class="column">
              ${video({ url: 'https://www.youtube.com/embed/GFh0aZ_u9FQ' })}
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
    <section class="hero">
        ${joinFormCandidate(state, dispatch)}
    </section>
    <section class="hero is-medium no-vertical-padding>
      <div class="hero-body">
        <p class="subtitle is-5 has-text-centered">Or ask a question: <strong>
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
