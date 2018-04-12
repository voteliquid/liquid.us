const Component = require('../Component')

module.exports = class CreditCardVerificationPage extends Component {
  render() {
    const { error, user } = this.state
    return this.html`
      <section class="section">
        <div class="columns is-centered">
          <div class="column is-two-thirds">
            ${!user ?
              SignUpNotification.for(this) : []
            }
            ${user && user.cc_verified ?
              AlreadyVerifiedNotification.for(this) : []
            }
            <div class="content">
              <h2 class="subtitle">Verification</h2>
              <p>Your direct & proxied votes build your legislators' <strong><a href="https://blog.united.vote/2017/12/08/give-your-rep-an-f-introducing-united-legislator-grades/" target="_blank">Liquid Scorecards</a></strong>, a transparent accountability record of how much they listen and ignore their constituents.</p>
              <p><strong>But you need to verify your identity first.</strong> This is necessary to prevent multiple accounts and validate residency.</p>
              <p>This quick step brings us closer to a healthier democracy.</p>
              <p>This also lets you create your own profile page, so you can start representing other people and increase your voting power.</p>
            </div>

            <br />

            <script src="https://js.stripe.com/v3/"></script>
            ${error ? [`
              <div class="notification is-warning">
                <p>${error.message}</p>
                <p>Please contact support@${this.state.config.WWW_DOMAIN} for assistance.</p>
              </div>
            `] : ''}
            ${FormHandler.for(this)}

            <br />
            <h5 class="title is-5">FAQ</h5>
            <div class="content">
              <style>
                .title.is-4 a {
                  color: #363636;
                }
              </style>
              <p class="title is-4"><a name="secure" href="#secure">Is my information secure?</a></p>
              <p>Yes.</p>
              <p>We adhere to the strict <strong>Payment Card Industry Data Security Standard</strong>, and never get direct access to your card data.</p>
              <hr />
              <p />

              <p class="title is-4"><a name="verification" href="#verification">Why use credit cards?</a></p>
              <p>We've researched other options. Many are promising, and we'd like to include more in the future.</p>
              <p>For now, this $1 verification charge, inspired by the US Postal Service's <a href="https://www.usps.com/manage/forward.htm" target="_blank">online verification system</a>, offers the best combination of speed, convenience, &amp; accuracy.</p>
              <p>This lets us get <strong><a href="https://blog.united.vote/2016/09/21/what-is-liquid-democracy/" target="_blank">liquid democracy</a></strong> into the hands of many American voters, while exploring other options.</p>
              <hr />
              <p />

              <p class="title is-4"><a name="free" href="#free">Shouldn't voting be free?</a></p>
              <p>We're big believers in making sure everyone has a meaningful voice. That's why we're working on this.</p>
              <p>But the reality is digital verification is a big, complex problem. <strong>United.vote</strong> is a small, independent organization with limited funding.</p>
              <p>We're optimistic that liquid democracy could be publicly funded in the future, but this isn't feasible yet.</p>
              <p>We hope that $1 to get started — less than the cost of a bag of chips — is still <strong>affordable</strong> enough for widespread participation.</p>
              <p>The cost of taxpayer funded elections works out to about $2 per person per election. That's just to <a href="https://www.electioncenter.org/EPC/Cost_of_Elections_8.pdf" target="_blank">collect and count the votes</a>.</p>
              <p>We can bring these costs down for everyone, and provide a much easier and more powerful democratic process.</p>
              <hr />
              <p />

              <p class="title is-4"><a name="refund" href="#refund">Is this refundable?</a></p>
              <p>No, it's important that the charge not be refundable, to discourage creating fake accounts.</p>
              <hr />
              <p />

              <p class="title is-4"><a name="money" href="#money">Where does my money go?</a></p>
              <p>It directly supports <strong>United.vote</strong>'s costs to make liquid democracy practical for our real governments.</p>
              <p>Sadly, most new online services don't have a sustainable funding model and are forced to shut down.</p>
              <p>We're focused on making liquid democracy a practical long-term reality, and registered as a Delaware <a href="https://en.wikipedia.org/wiki/Public-benefit_corporation" target="_blank">Public Benefit Corporation</a>.</p>
              <p />

              <p />
              <hr />
              <br />
              <p>Please reach out with any other questions or issues: <a href="mailto:support@united.vote"><strong>support@united.vote</strong></a>.</p>
            </div>
          </div>
        </div>
      </div>
    `
  }
}

class FormHandler extends Component {
  render() {
    const { form, readyToPay } = this.state
    return this.html`
      ${readyToPay || form
        ? StripeForm.for(this)
        : SideBySideOptions.for(this)
      }
    `
  }
}

class SideBySideOptions extends Component {
  render() {
    return this.html`
      <div class="columns is-7 is-variable">
        <div class="column">
          <div class="notification" style="border-top: 3px solid #209cee;">
            <div class="content">
              <h3 class="title is-4">Instant Verification</h3>
              <p><strong>$1 charge to a credit/debit card in your name</strong></p>
              <p>
                <img src="/assets/clock.png" style="width:25px; height:25px; margin-right:5px; position:relative; top:5px;">
                Takes seconds
              </p>
              <p>
                <img src="/assets/sustainability.png" style="width:25px; height:21px; margin-left:2px; margin-right:4px; position:relative; top:5px;">
                Helps cover our costs
              </p>
              <p>
                <img src="/assets/lock.png" style="width:18px; height:22px; margin-left:7px; margin-right:7px; position:relative; top:5px;">
                Card info secured by Stripe
                <span class="is-size-7" style="display: block; margin-left: 37px">(we never see the number)</span>
              </p>
              <p class="has-text-centered">
                <br />
                ${ChooseInstantVerificationButton.for(this)}
              </p>
            </div>
          </div>
        </div>
        <div class="column">
          <div class="notification">
            <div class="content">
              <h3 class="title is-4">Other Methods</h3>
              <p><strong>We'd like to add more verification methods.</strong></p>
              <p>In-Person Verification will be available in districts that elect <a href="https://candidates.united.vote" target="_blank">Liquid Candidates</a>.</p>
              <p class="is-size-7">Please reach out with other suggestions. Help us understand how the current method doesn't work for you.</p>
              ${ContactButton.for(this)}
            </div>
          </div>
          <div class="is-pulled-right">
            ${LinkToSkip.for(this)}
          </div>
        </div>
      </div>
    `
  }
}

class StripeForm extends Component {
  onpress(event) {
    // Pressed the Skip button
    event.preventDefault()

    if (!this.state.skipWarning) {
      return { skipWarning: true }
    }

    return this.location.redirect('/get_started?skip=t')
  }

  onsubmit(event, formData) {
    event.preventDefault()

    const { user } = this.state
    const amount = Math.floor((this.state.custom || 1) * 100)

    this.setState({ loading_verification: true })

    return stripe.createToken(cardNumber, {
      name: formData['card-name'],
      address_line1: formData.address_line1,
      address_zip: formData.address_zip,
      address_country: 'US',
    })
    .then((result) => {
      if (result.error) {
        throw result.error
      }

      return this.api('/stripe_charges', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({
          stripe_token_id: result.token.id,
          user_id: user.id,
          amount,
          billing_name: formData['card-name'] || null,
          billing_street: formData.address_line1 || null,
          billing_zip: formData.address_zip || null,
        }),
      })
      .catch(error => {
        if (~error.message.indexOf('stripe_charges_user_id_key')) {
          return this.api(`/stripe_charges?user_id=eq.${user.id}`, {
            method: 'PATCH',
            headers: { Prefer: 'return=representation' },
            body: JSON.stringify({
              stripe_token_id: result.token.id,
              amount,
              error_message: null,
              error_code: null,
              error_status: null,
              billing_name: formData['card-name'] || null,
              billing_street: formData.address_line1 || null,
              billing_zip: formData.address_zip || null,
            }),
          })
        }
        return Promise.reject(error)
      })
    })
    .then(() => {
      this.checkChargeStatus()
    })
  }

  checkChargeStatus() {
    const { user } = this.state

    return this.api(`/stripe_charges?user_id=eq.${user.id}`).then(charges => {
      const charge = charges[0]

      if (charge.error_message) {
        const error = new Error(charge.error_message)
        error.status = charge.error_status
        error.code = charge.error_code
        return Promise.reject(error)
      }

      if (!charge.stripe_charge_id) {
        setTimeout(() => this.checkChargeStatus(), 1500)
      }

      return charge
    })
    .then(charge => {
      if (charge.stripe_charge_id && !charge.error_message) {
        this.setState({ loading_verification: false, error: false, user: { ...user, cc_verified: true } })
        this.location.redirect('/get_started/profile')
      }
    })
    .catch((error) => {
      if (error.message === 'unique_violation') error.message = error.details
      if (~error.message.indexOf('stripe_charges_card_unique')) {
        error = new Error('This card has already been used to verify.')
      }

      this.setState({
        loading_verification: false,
        error,
      })
    })
  }

  render() {
    const { user } = this.state

    return this.html`
      <style>
        .StripeElement {
          border: 1px solid #dbdbdb;
          border-radius: 3px;
          font-size: 1rem;
          height: 2.25em;
          line-height: 1.5;
          padding-bottom: calc(.375em - 1px);
          padding-left: calc(.625em - 1px);
          padding-right: calc(.625em - 1px);
          padding-top: calc(.375em - 1px);
          position: relative;
          background-color: #fff;
          color: #363636;
          box-shadow: inset 0 1px 2px rgba(10,10,10,.1);
          max-width: 100%;
          width: 100%;
        }
        @media (max-width: 770px) {
          .stripe-fields div.field.is-horizontal {
            margin-bottom: 270px;
          }
        }
      </style>
      <form id="payment-form" action="/get_started/verification" method="POST" onsubmit=${this}>
        <!-- Used to display form errors -->
        <div id="card-errors" role="alert"></div>

        <div class="field">
          <label class="label">Name on card</label>
          <div class="control">
            <input name="card-name" class="input" type="text" placeholder="Name on card" value=${`${user.first_name} ${user.last_name}`} />
          </div>
        </div>
        <div class="stripe-fields field is-horizontal">
          <div class="field-body">
            <style>
              .stripe-fields .field-body .field {
                height: 67px !important;
              }
            </style>
            <div class="field">
              <label class="label" for="card-number">
                Card number
              </label>
              <div class="control">
                <div id="card-number">
                  <!-- a Stripe Element will be inserted here. -->
                </div>
              </div>
            </div>
            <div class="field">
              <label class="label" for="card-expiry">
                Expiration
              </label>
              <div class="control">
                <div id="card-expiry">
                  <!-- a Stripe Element will be inserted here. -->
                </div>
              </div>
            </div>
            <div class="field">
              <label class="label" for="card-cvc">
                CVC
              </label>
              <div class="control">
                <div id="card-cvc">
                  <!-- a Stripe Element will be inserted here. -->
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="content is-small">
          <p>
            <span class="icon is-small"><i class="fa fa-lock"></i></span>Card data securely handled by Stripe.
          </p>
        </div>

        ${BillingAddressForm.for(this)}
        <div class="is-grouped is-pulled-right has-text-right">
          <a class="button" onclick=${this}>${this.state.skipWarning ? 'Confirm s' : 'S'}kip</a>
          <button class=${`button is-primary ${this.state.loading_verification ? 'is-loading' : ''}`} disabled=${this.state.loading_verification}><strong>Charge $${this.state.custom || 1}</strong></button>
          ${this.state.skipWarning
            ? [`<p class="is-size-7">Are you sure? Your votes can't be counted until you verify.</p>`]
            : []
          }
        </div>

        ${GiftLink.for(this)}

        <br />
      </form>
    `
  }
}

class BillingAddressForm extends Component {
  onclick() {
    return { billing_address_visible: !this.state.billing_address_visible }
  }

  render() {
    const billing_address_visible = !!this.state.billing_address_visible
    return this.html`
      <div class="field">
        <label class="checkbox">
          <input type="checkbox" onclick=${this} checked=${!billing_address_visible} />
          Billing address is same as voting address
        </label>
      </div>
      <div class=${`field is-horizontal ${billing_address_visible ? '' : 'is-hidden'}`}>
        <div class="field-body">
          <div class="field">
            <label class="label">Billing Street Address</label>
            <div class="control">
              <input name="address_line1" type="text" class="input" placeholder="Billing Street Address" />
            </div>
          </div>
          <div class="field">
            <label class="label">Billing ZIP</label>
            <div class="control">
              <input name="address_zip" type="text" class="input" placeholder="Billing ZIP" />
            </div>
          </div>
        </div>
      </div>
    `
  }
}

function expand(event, state) {
  event.preventDefault()
  const target = event.currentTarget.parentNode
  if (target.className === 'expandable is-expanded') target.className = 'expandable'
  else if (target.className === 'expandable') target.className = 'expandable is-expanded'

  return state
}

let stripe;
let cardNumber // stripe card number element

function initStripeForm() {
  stripe = window.Stripe(this.state.config.STRIPE_API_PUBLIC_KEY)

  const style = {
    base: {
      fontSize: '16px',
      lineHeight: '1.5',
      '::placeholder': {
        color: '#ccc',
      },
    },
  }

  setTimeout(() => {
    const elements = stripe.elements()
    cardNumber = elements.create('cardNumber', { style })
    const cardExpiry = elements.create('cardExpiry', { style })
    const cardCvc = elements.create('cardCvc', { style })
    cardNumber.mount('#card-number')
    cardExpiry.mount('#card-expiry')
    cardCvc.mount('#card-cvc')

    // Handle real-time validation errors from the card Element.
    cardNumber.addEventListener('change', (eventTwo) => {
      const displayError = document.getElementById('card-errors')
      if (eventTwo.error) {
        displayError.textContent = eventTwo.error.message;
        displayError.className = 'notification is-warning'
      } else {
        displayError.className = ''
        displayError.textContent = '';
      }
    });
  }, 1)
}

class SignUpNotification extends Component {
  render() {
    return this.html`
      <div class="notification is-warning">
        You'll need to <a href="/sign_in">sign in</a> or <a href="/join">join</a> first.
      </div>
    `
  }
}

class AlreadyVerifiedNotification extends Component {
  render() {
    return this.html`
      <div class="notification is-link">
        You've already verified! Good job.
      </div>
    `
  }
}

class GiftLink extends Component {
  onkeyup(event) {
    const target = event.currentTarget
    const state = this.state

    if (/^[0-9]*$/.test(target.value) && Number(target.value) >= 0) {
      target.className = 'input'
      state.custom = Number(target.value) + 1
    } else {
      target.className = 'input is-danger'
    }

    return state
  }

  render() {
    return this.html`
      <br />
      <div class="expandable">
        <a onclick=${expand} href="#"><span class="icon is-small"><i class="fa fa-gift"></i></span> Can I give more as a gift?</a>
        <p>Yes, we'd be very grateful:</p>
        <div class="field">
          <div class="control has-icons-left">
            <input type="tel" class="input" placeholder="" onkeyup=${this} />
            <span class="icon is-small is-left">
              <i class="fa fa-usd"></i>
            </span>
          </div>
        </div>
        <p />
      </div>
      <style>
        .expandable { list-style: none; }
        .expandable > a::after {
          content: '➤';
          font-size: 70%;
          position: relative;
          left: 6px;
          bottom: 2px;
        }
        .expandable.is-expanded > a::after { content: '▼'; }
        .expandable p, .expandable div, .expandable hr { display: none; }
        .expandable.is-expanded p, .expandable.is-expanded div, .expandable.is-expanded hr { display: block; }
      </style>
    `
  }
}

class ChooseInstantVerificationButton extends Component {
  onclick(event) {
    event.preventDefault()

    if (!this.state.user) {
      this.location.redirect('/join')
    }

    setTimeout(initStripeForm.bind(this), 50)

    return {
      readyToPay: true,
      skipWarning: false,
    }
  }

  render() {
    return this.html`
      <a class="button is-info is-fullwidth is-medium" onclick=${this}>Choose</a>
    `
  }
}

class ContactButton extends Component {
  onclick(event) {
    event.preventDefault()

    return { isFeedbackWindowVisible: !this.state.isFeedbackWindowVisible }
  }

  render() {
    return this.html`
      <a class="button is-grey is-fullwidth is-medium" onclick=${this}>Contact</a>
    `
  }
}

class LinkToSkip extends Component {
  onclick(event) {
    event.preventDefault()

    if (!this.state.skipWarning) {
      return { skipWarning: true }
    }

    this.location.redirect('/get_started?skip=t')
    return { skipWarning: false }
  }

  render() {
    return this.html`
      <a class="is-pulled-right" onclick=${this}>${this.state.skipWarning ? 'Confirm s' : 'S'}kip verification for now</a><br />
      ${this.state.skipWarning
        ? [`<p class="is-size-7">Are you sure? Your votes can't be counted until you verify.</p>`]
        : []
      }
    `
  }
}
