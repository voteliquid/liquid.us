const { ASSETS_URL } = process.env
const { html } = require('../helpers')

module.exports = ({ vote, user }) => {
  const measureImage = `${ASSETS_URL}/legislature-images/Dane County.png`
  const chairImage = `${ASSETS_URL}/Patrick-Miles.png`
  const reply = (vote.replies || []).filter(({ user_id }) => (user && user.id === user_id))[0]
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

      <div class="column">
        <div class="media">
          <div class="media-left">
            <div class="image is-48x48 is-clipped">
              <img src=${chairImage} style="background: hsla(0, 0%, 87%, 0.5); padding: 4px;"/>
            </div>
          </div>
          <div class="media-content has-text-weight-semibold is-size-5" style="line-height: 24px;">
            Patrick Miles, Chair<br />
            Personnel & Finance Committee
          </div>
        </div>
      </div>
    </div>
    ${reply ? html`
      <div class="is-size-5 box">
        <p>Your comment will be sent to your legislators, but you should email them directly at <a href="mailto:county_board_recipients@countyofdane.com" target="_blank">county_board_recipients@countyofdane.com</a> or attend one of the meetings below to emphasize the importance of this issue:</p>
        <br />
        <p><a href="https://goo.gl/maps/kQWbRGMjhS6sMpuXA" target="_blank">City County Building, 210 MLK Jr Blvd, Madison, WI, 53703</a></p>
        <p><b>May 28, 2019</b> 5:30pm in room 201, Personnel & Finance Committee</p>
        <p><b>June 6, 2019</b> 7:00pm in room 201, Dane County Board of Supervisors vote</p>
        <br />
        <p><em>We will provide an update as the meeting dates are confirmed.</em></p>
      </div>
    ` : ''}
  `
}
