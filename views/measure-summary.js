const { html, linkifyUrls } = require('../helpers')

module.exports = (measure, dispatch) => {
  const { chamber, congress, number, type, short_id, size = 6 } = measure
  const expanded = measure.alwaysExpanded ? true : measure.expanded
  const index = short_id.indexOf('-')
  const bill_id = short_id.slice(index + 1)
  const summary = type === 'nomination' && measure.summary ? `Confirmation of ${measure.summary}` : linkifyUrls(measure.summary)
  const link = measure.legislature_name === "U.S. Congress" ? `https://www.congress.gov/bill/${congress}th-congress/${chamber === 'Lower' ? 'house' : 'senate'}-bill/${number}/text` : measure.legislature_name === "WI" ? `https://docs.legis.wisconsin.gov/${congress}/proposals/reg/asm/bill/${bill_id}` : measure.legislature_name === "CA" ? `https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=${congress}0${bill_id.toUpperCase()}` : ''

  const summaryLink =
    measure.author_id === null
      ? html`<p><a href=${link} target="_blank">Learn more <span aria-hidden="true" class="icon is-small is-size-7"><i class="fas fa-external-link-alt"></i></span></a>`
      : ''

  const summaryWithoutRepeatedTitle = summary.split(/<\/b> ?<\/p>|<\/strong><\/p>/)[1] || summary

  return html`
    <div class=${`${expanded || !summary ? '' : 'summary'} measureDescription`} style=${!expanded && summary && summary.length > 512 ? 'max-height: 10rem;' : ''}>
      <div class=${`content is-size-${size}`}>
        ${summary ? html`${{ html: summaryWithoutRepeatedTitle.replace(/\n/g, '<br />') }} ${summaryLink}` : html`<p>A summary is in progress.</p>${summaryLink}`}
      </div>
      <div class="${`read-more ${summary && summary.length > 512 ? '' : 'is-hidden'}`}"></div>
      <a class="${`read-more-link is-size-7 ${summary && summary.length > 512 ? '' : 'is-hidden'}`}" href="#" onclick=${(event) => dispatch({ type: 'measure:toggleSummaryExpanded', measure, event })}>
        ${summary && !measure.alwaysExpanded
          ? html`<span class="icon is-small"><i class="${`fa fa-${expanded ? 'minus' : 'plus'}`}"></i></span> ${expanded ? 'Show less' : 'Show more'}`
          : ''}
      </a>
      <style>
        .measureDescription {
          margin-bottom: 1.5rem;
        }

        .summary {
          position: relative;
          overflow: hidden;
        }
        .summary .read-more {
          position: absolute;
          bottom: 1rem;
          left: 0;
          width: 100%;
          margin: 0;
          height: 4rem;

          /* "transparent" only works here because == rgba(0,0,0,0) */
          background-image: -webkit-linear-gradient(to bottom, rgba(255,255,255,0.01), white);
          background-image: linear-gradient(to bottom, rgba(255,255,255,0.01), white);
        }
        .summary .read-more-link {
          background: white;
          display: block;
          width: 100%;
          height: 2rem;
          line-height: 2rem;
          position: absolute;
          bottom: 0;
          left: 0;
        }
      </style>
    </div>
  `
}
