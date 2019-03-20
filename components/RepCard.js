const { avatarURL, html } = require('../helpers')
const ordinalSuffix = require('ordinal-suffix')

module.exports = ({ rep, office }) => {
  const with_constituent_percentage = rep.constituent_vote_count ? Math.floor((rep.with_constituent_vote_count / rep.constituent_vote_count) * 100) : 0
  return html(`repcard-${rep.user_id}`)`
    <div class="media">
      <figure class="media-left">
        <p class="image is-96x96">
          <a href=${`/${rep.username}`}>
            <img src=${avatarURL(rep)}>
          </a>
        </p>
      </figure>
      <div class="media-content">
        <style>
          .space-between {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-height: 120px;
          }
        </style>
        <div class="content space-between">
          <p class="is-small">
            <a href=${`/${rep.username}`}>
              <strong>${rep.first_name} ${rep.last_name}</strong> <small>@${rep.twitter_username}</small>
            </a>
            <br />
            <span class="is-size-6">${office.name}</span>
          </p>
          <p>
            ${rep.representation_percentile && rep.constituent_vote_count ?
            [`
              <span class="has-text-weight-bold is-size-6">${rep.with_constituent_vote_count || 0} / ${rep.constituent_vote_count || 0}</span>
              <span class="is-size-7 has-text-grey">votes with verified constituents in ${rep.elected_office_short_name}</span>
              <br />
              <span class="has-text-weight-bold is-size-6">${with_constituent_percentage}%</span>
              <span class="is-size-7 has-text-grey">aligned with constituents</span>
              <br />
              <span class="has-text-weight-bold is-size-6">${ordinalSuffix(rep.representation_percentile)}</span>
              <span class="is-size-7 has-text-grey">percentile among ${rep.elected_office_chamber === 'Lower' ? 'House' : 'Senate'} ${rep.party_affiliation}s</span>
            `] : [`
              <span class="has-text-weight-bold is-size-7"><span class="icon"><i class="fa fa-question"></i></span></span>
              <span>Need more constituent votes to calculate their scorecard.<span>
            `]}
          </p>
        </div>
      </div>
    </div>
  `
}
