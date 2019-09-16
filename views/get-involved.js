const { WWW_DOMAIN } = process.env
const { html } = require('../helpers')
const joinForm = require('./join-form-get-involved')
const video = require('./video')

module.exports = (state, dispatch) => {
  return html`
    <style>
      .reveal { visibility: hidden; }
    </style>

    <section onconnected="${activateScrollReveal}" class="hero is-link is-bold is-fullheight subtract-toolbar">
      <div class="hero-body">
        <div class="container reveal">
          <h2 class="title is-2 is-size-2-desktop is-size-3-mobile has-text-centered delayed">Together we can fix our democracy</h2>
          <br />
          <br />
          <div class="columns">
            <div class="column">
              ${getInvolvedCTA(state, dispatch)}
            </div>
            <div class="column is-1"></div>
            <div class="column is is-paddingless">
              <h3 class="subtitle is-3 is-size-4-mobile delayed1">
              Are you tired of politicians who are loyal to party, donors, and DC insiders over voters?
              <br /><br />
              Of beauty pageants masquerading as elections that give voters no real choice or control?
              <br /><br />
              So are we. And we have a plan.
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
      </style>
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
              <h3 class="subtitle is-4 is-size-4-desktop reveal"><strong>Participate anywhere</strong> any time from any device. No more standing in lines to vote once every few years. Let's unlock the true power of the devices in our pockets for the public good.</h3>
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
            <div class="column has-text-left-tablet is-hidden-desktop is-hidden-tablet">
              <h4 class="subtitle is-4 is-size-4-desktop reveal"><strong>Debate and vote on policy proposals</strong> not politicians. Liquid shifts the focus from winning the next election to demonstrating that your bill has popular support.</h4>
            </div>
            <div class="column has-text-centered">
              <img src="/assets/debate.png" width="60%">
            </div>
            <div class="column is-1"></div>
            <div class="column has-text-left-tablet is-hidden-mobile">
              <h4 class="subtitle is-4 is-size-4-desktop reveal"><strong>Debate and vote on policy proposals</strong> not politicians. Liquid shifts the focus from who wins elections to demonstrating that your bill has popular support.</h4>
            </div>
            <div class="column is-1"></div>
          </div>
          <br />
          <br />
          <br />
          <div class="columns is-vcentered">
            <div class="column is-2"></div>
            <div class="column has-text-left-tablet">
              <h3 class="subtitle is-4 is-size-4-desktop reveal"><strong>Choose people you trust</strong> to vote on bills for you when you do not. They can delegate to others, creating a trust network to measure the public's support and opposition on every policy proposal.</h3>
            </div>
            <div class="column is-1"></div>
            <div class="column has-text-centered">
              <img src="/assets/delegatecolor2.png" width="60%">
            </div>
            <div class="column is-2"></div>
          </div>
          <br />
          <br />
          <br />
          <div class="columns is-vcentered">
            <div class="column is-2"></div>
            <div class="column has-text-left-tablet is-hidden-desktop is-hidden-tablet">
              <h4 class="subtitle is-4 is-size-4-desktop reveal"><strong>Amplify your voice</strong> on issues where you have expertise by representing voters who trust you - without being forced to compete in a winner-take-all election.</h4>
            </div>
            <div class="column has-text-centered">
              <img src="/assets/votecount2.png" width="60%">
            </div>
            <div class="column is-1"></div>
            <div class="column has-text-left-tablet is-hidden-mobile">
              <h4 class="subtitle is-4 is-size-4-desktop reveal"><strong>Amplify your voice</strong> on issues where you have expertise by representing voters who trust you - without being forced to compete in a winner-take-all election.</h4>
            </div>
            <div class="column is-2">
            </div>
          </div>
          <div class="columns is-vcentered">
            <div class="column is-2"></div>
            <div class="column has-text-left-tablet">
              <h3 class="subtitle is-4 is-size-4-desktop reveal"><strong>Hold elected leaders accountable.</strong> Liquid automatically compares what the people want with how elected leaders vote.</h3>
            </div>
            <div class="column is-1"></div>
            <div class="column has-text-centered">
              <img src="/assets/accountability3.png" width="60%">
            </div>
            <div class="column is-2"></div>
          </div>
        </div>
      </div>
    </section>

    <section class="hero is-light is-bold is-fullheight">
      <div class="hero-body">
        <div class="container">
          <h2 class="title is-3 is-size-2-desktop is-size-3-mobile has-text-centered reveal">We've built the platform, now it's time to use it</h2>
          <br />
          <br />
          <br />
          <div class="columns has-text-centered">
            <div class="column">
              <h2 class="title is-4 has-text-centered">Empower your community</h2>
              <img src="/assets/educate.png" width="40%">
              <br /><br />
            </div>
            <div class="column">
              <h2 class="title is-4 has-text-centered">Target key legislators</h2>
              <div class="is-vcentered"><img src="/assets/legislators.png" width="40%"></div>
              <br /><br />
            </div>
            <div class="column">
              <h2 class="title is-4 has-text-centered">Be or support liquid candidates</h2>
              <div class="is-vcentered"><img src="/assets/candidate.png" width="40%"></div>
              <br /><br />
            </div>
          </div>

          <p class="subtitle is-4 is-size-4-desktop reveal">Vote on any policy proposal, anywhere, and choose delegates to speak when you don't. We publicly track voter support for each proposal by district and city and update your legislators when you speak out.
          <br /><br />
          Have a popular policy? Apply pressure to key legislators by demonstrating that voters in their district support your position.
          <br /><br />
          Is your legislator failing to represent the voters in your district? Upgrade your democracy by supporting or running as a liquid candidate. These candidates pledge to use a constituent-driven liquid platform to determine how to vote on every bill.</p>
          <br />
          <br />
        </div>
      </div>
    </section>


    <section class="hero is-link is-bold is-fullheight">
      <div class="hero-body">
        <div class="container">
          <h2 class="title is-2 is-size-1-desktop is-size-3-mobile reveal">Why we're doing this</h2>
          <br /><br />
          <h4 class="subtitle is-4 is-size-3-desktop reveal">We believe in the transformative promise of Liquid Democracy.</h4>
          <div class="columns is-vcentered">
            <div class="column">
              <br />
              <h4 class="subtitle is-4 is-size-3-desktop reveal">The idea is so powerful that we're fully funded and have attracted some of the world's foremost political organizing and technology talent.
              <br /><br />
              We are non-partisan and charge nothing. Our goal is a healthier democracy.</h4>

              <br />
              <br />
            </div>
            <div class="column is-1"></div>
            <div class="column is-5">
              ${getInvolvedCTA(state, dispatch)}
            </div>
          </div>
        </div>
      </div>
    </section>
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
              ${video({ url: 'https://www.youtube.com/embed/GFh0aZ_u9FQ' })}
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="section has-text-centered">
      <p class="is-size-7 has-text-grey">Icon images by priyanka, KonKapp, Maxim Basinski, Delwar Hossain, Maxim Kulikov, flatart, jugalbandi, Turkkub, zidney, Max Hancock, adrien coquet, scribble.liners, Made x Made Icons, Adiba Taj from The Noun Project.</p>
    </div>
  `
}

const activateScrollReveal = () => {
  const ScrollReveal = require('scrollreveal').default
  const sr = ScrollReveal({ duration: 800 }) // eslint-disable-line no-undef
  sr.reveal('.reveal')
}

const getInvolvedCTA = (state, dispatch) => {
  return html`
    <section class="hero">
        ${joinForm(state, dispatch)}
    </section>
    <br />
    <section class="hero is-medium no-vertical-padding">
      <p class="subtitle is-5 has-text-centered">Or ask a question: <strong>
      <a onclick=${(event) => dispatch({ type: 'contactForm:toggled', event })}>click here</a></strong> to send us a message.</p>
    </section>
    <style>
      .hero.is-medium.no-vertical-padding .hero-body {
        padding-top: 0;
        padding-bottom: 0;
      }
    </style>
  `
}
