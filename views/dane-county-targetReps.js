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
const noSup = ['1', '17', '33'].includes(district)
const supSupportsProDane = ['2', '4', '6', '32'].includes(district)
const supSemiSupports = ['35', '27'].includes(district)

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
          <p>We will send your comment when your supervisor has been sworn in. In the meantime, <a href="mailto:county_board_recipients@countyofdane.com" target="_blank">email the Board of Supervisors</a> to emphasize the importance of this issue.</p>
        ` : supSupportsProDane ? html`
          <p>Your supervisor voted against the jail and is already a sponsor of Resolution 67. Send Supervisor ${supervisor.last_name} a quick <a href="${`mailto:${email}`}" target="_blank">thank you email</a>.</p>
        ` : supSemiSupports ? html`
          <p>Your supervisor supports 2019 OA 3, a measure to expand the Criminal Justice Council to include community members impacted by incarceration and behavioral health expert, but has not yet signed on to Resolution 67. Send a  <a href="mailto:${email}" target="_blank">quick email</a> thanking Supervisor ${supervisor.last_name} for sponsoring 0A 3, and ask your supervisor to also sign on to Res. 67.</p>
        ` : html`
          <p>Your supervisor voted for the jail and has not yet signed on to Resolution 67. Please <a href="mailto:${email}" target="_blank">reach out</a> to Supervisor ${supervisor.last_name} to explain why you believe it is important to prioritize decarceration and ask your supervisor to sign on.
        `}
        <br />
        <p><em>Resolution 67 and OA 3 will be scheduled for public hearings in various committees this summer; we will update you as more information becomes available.</em></p>
      </div>
    ` : ''}
  `
}
