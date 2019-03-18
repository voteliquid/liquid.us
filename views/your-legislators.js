const { html } = require('../helpers')
const repCard = require('./rep-card')

module.exports = ({ geoip, reps = [], user }) => {
  return html`
    <div style=${{
      border: '1px solid hsla(0, 0%, 100%, 0.5)',
      padding: '25px',
      borderRadius: '6px',
    }}>
      <h2 class="title is-5">Your Elected Congress Members</h2>
      ${(!reps || !reps.length) ? html`<div class="notification is-dark" style=${{
        backgroundColor: 'inherit',
        padding: 0,
      }}>We weren't able to detect your elected congress members using your location. <a href="/join">Join to set your address</a>.</div>` : ''}
      <div class="columns">
        ${reps.map((office) => RepColumn({ office }))}
      </div>
      ${geoip && reps && reps.length ? AddAddressNotification({ geoip, user }) : ''}
      ${user && user.address && html`
        <div class="has-text-right has-text-white is-size-7">
          <p>Based on your address of <strong>${user.address.address}</strong>. <a href="/settings">Change</a>
        </div>
      `}
    </div>
  `
}

const AddAddressNotification = ({ geoip, user }) => {
  return html`
    ${user ? (user.address ? [] : AuthedAddressNotification({ geoip })) : AnonAddressNotification({ geoip })}
  `
}

const RepColumn = ({ office }) => {
  const rep = office.office_holder
  return html`
    <div class="column">${repCard({ rep, office })}</div>
  `
}

const AnonAddressNotification = ({ geoip }) => {
  return html`
    <div class="notification is-dark">
      We selected your reps by guessing your location in <strong>${geoip.city}, ${geoip.regionName}.</strong> But this is only right about half the time. <strong><a href="/join">Set your address</a></strong>.
    </div>
  `
}

const AuthedAddressNotification = ({ geoip }) => {
  return html`
    <div class="notification content is-dark">
      <p>We selected your reps by guessing your location in <strong>${geoip.city}, ${geoip.regionName}</strong>. But this is only right about half the time. <a href="/get_started/basics">Enter your address</a> to fix it.</p>
    </div>
  `
}
