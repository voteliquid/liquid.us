const { ASSETS_URL } = process.env
const { html } = require('../helpers')

module.exports = ({ vote, user, reps }) => {
  const measureImage = `${ASSETS_URL}/legislature-images/Dane County.png`
  const reply = (vote.replies || []).filter(({ user_id }) => (user && user.id === user_id))[0]
  const supervisor = reps[4].office_holder
  const last = (arr) => arr[arr.length - 1]
  const district = last(supervisor.elected_office_name.split(' '))
  const emailExceptions = {
  'Dane7': 'veldran@countyofdane.com', // Veldran
  'Dane8': 'bayrd@countyofdane.com', // Bayrd
  'Dane12': 'rusk@countyofdane.com', // Rusk
  'Dane19': 'clausius@countyofdane.com', // Clausius
  'Dane23': 'stubbs@countyofdane.com', // Stubbs
  'Dane30': 'downing@countyofdane.com', // Downing
  'Dane34': 'miles@countyofdane.com', // Miles
  'Dane37': 'salov@countyofdane.com', // Salov
  'Dane25': 'kiefer.timothy@countyofdane.com', // Kiefer
}
const email = emailExceptions[supervisor.short_name] || `${supervisor.last_name.toLowerCase()}.${supervisor.first_name.toLowerCase()}@countyofdane.gov`
const noSup = !supervisor || !supervisor.first_name || supervisor.first_name === 'Vacant'
const supSupportsProDane = ['2', '4', '6', '32'].includes(district)
const supSemiSupports = ['35', '27'].includes(district)
console.log(email)

console.log(reps[4].office_holder)
  return html`
    <br />
    <div class="columns">
      <div class="column is-narrow" style="margin-bottom: -1rem">
        <span class="is-size-3 is-size-4-mobile has-text-weight-semibold">To:&nbsp;</span>
      </div>
      <div class="column is-narrow">
        <div class="media">
          <div class="media-left">
            <div class="image is-48x48 is-clipped">
              <img src=${measureImage} style="background: hsla(0, 0%, 87%, 0.5); padding: 4px;"/>
            </div>
          </div>
          <div class="media-content has-text-weight-semibold is-size-5" style="line-height: 24px;">
            Dane County<br />
            Supervisors
          </div>
        </div>
      </div>
    </div>
    ${reply ? html`
      <div class="is-size-5 box">
        <p>Thank you for supporting Resolution 67, the Community Alternative Plan for Housing, Health care, and Decarceration.</p><br />
        ${noSup ? html`
          <p>Your supervisor was recently elected and has not yet been sworn in. We will send your comment when that happens. In the meantime, contact the Board of Supervisors at <a href="mailto:county_board_recipients@countyofdane.com" target="_blank">county_board_recipients@countyofdane.com</a> to emphasize the importance of this issue.</p>
        ` : supSupportsProDane ? html`
          <p>Your supervisor voted against the jail and already supports Resolution 67. Send Supervisor ${supervisor.last_name} a quick <a href="${`mailto:${email}`}" target="_blank">thank you email</a>.</p>
        ` : supSemiSupports ? html`
          <p>Your supervisor supports OA-3, a measure that would strengthen the Criminal Justice Court, but has so far declined to support Resolution 67. Send a quick email thanking Supervisor ${supervisor.last_name} for supporting 0A-3, but explain that it's not enough: <a href="mailto:${email}" target="_blank">${email}</a>.</p>
      ` : html`
        <p>Your supervisor voted for the jail and has declined to endorse Resolution 67. Please reach out to Supervisor ${supervisor.last_name} at <a href="mailto:${email}" target="_blank">${email}</a> to explain why you believe it is so important to prioritize decarceration.
      `}
        <br />
        <p>It's important that we keep up the pressure after our big turnout last week. Please share this page to help us find even more supporters.</p>
        <br />
        <p><em>The first commmittee hearing should be heald in late June or early July. We will provide an update when the dates are confirmed.</em></p>
      </div>
    ` : ''}
  `
}
