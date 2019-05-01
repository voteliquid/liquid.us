const { avatarURL, html } = require('../helpers')
const ordinalSuffix = require('ordinal-suffix')

module.exports = ({ rep, office }) => {
  return html`
    <div class="media">
      <figure class="media-left">
        <p class="image is-96x96">
          <a href=${`/${rep.username}`}>
            <img src=${avatarURL(rep)}>
          </a>
        </p>
      </figure>
      <div class="media-content">
        <div class="content space-between" style=${{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '120px'
        }}>
          <p class="is-small">
            <a href=${`/${rep.username}`} style="word-break: normal;">
              <strong>${rep.first_name} ${rep.last_name}</strong> <small>${rep.twitter_username && `@${rep.twitter_username}`}</small>
            </a>
            <br />
            <span class="is-size-6">${office.name}</span>
          </p>
          <p>
            ${rep.constituent_vote_count ?
            html`
              <span class="has-text-weight-bold is-size-6">${rep.with_constituent_vote_count || 0} / ${rep.constituent_vote_count || 0} </span>
              <span class="is-size-7">votes with verified constituents in ${rep.elected_office_short_name}</span>
              <br />
              <span class="has-text-weight-bold is-size-6">${Math.floor((rep.with_constituent_vote_count / rep.constituent_vote_count) * 100)}% </span>
              <span class="is-size-7">aligned with constituents</span>
              <br />
              ${rep.representation_percentile ? html`
                <span class="is-size-7">
                  <strong>${ordinalSuffix(rep.representation_percentile)}</strong>
                  percentile among ${rep.elected_office_chamber === 'Lower' ? 'House' : 'Senate'} ${rep.party_affiliation}s
                </span>
              ` : ''}
            ` : html`
              <span class="has-text-weight-bold is-size-7">
                <span class="icon"><i class="far fa-plus-square"></i></span>
                Need more constituent votes.
              </span>
            `}
          </p>
        </div>
      </div>
    </div>
  `
}
