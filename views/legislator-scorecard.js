const { html, possessive } = require('../helpers')
const ordinalSuffix = require('ordinal-suffix')
const { icon } = require('@fortawesome/fontawesome-svg-core')
const { faQuestion } = require('@fortawesome/free-solid-svg-icons/faQuestion')

module.exports = (state) => {
  const { grade, first_name, office, party_affiliation } = state
  const { percentile, with_constituent_vote_count, constituent_vote_count } = grade || {}
  const with_constituent_percentage = constituent_vote_count ? Math.floor((with_constituent_vote_count / constituent_vote_count) * 100) : 0
  return html`
    <div class="box">
      <div class="content">
        <h4 class="has-text-weight-bold has-text-grey-dark is-size-4">${possessive(first_name)} Scorecard</h4>
        <p>
          ${percentile && constituent_vote_count ?
          html`
            <span class="has-text-weight-bold has-text-grey-dark is-size-5">${with_constituent_vote_count || 0} / ${constituent_vote_count || 0} </span>
            <span class="is-size-6 has-text-grey">votes with verified constituents in ${office.short_name}</span>
            <br />
            <span class="has-text-weight-bold has-text-grey-dark is-size-5">${with_constituent_percentage}% </span>
            <span class="is-size-6 has-text-grey">aligned with constituents</span>
            <br />
            <span class="has-text-weight-bold has-text-grey-dark is-size-6">${ordinalSuffix(percentile)} </span>
            <span class="is-size-6 has-text-grey">percentile among ${office.chamber === 'Lower' ? 'House' : 'Senate'} ${party_affiliation}s</span>
          ` : html`
            <span class="has-text-weight-bold has-text-grey-dark is-size-5"><span class="icon">${icon(faQuestion)}</span></span>
            <span>Need more constituent votes to calculate their scorecard.<span>
          `}
        </p>
      </div>
    </div>
  `
}
