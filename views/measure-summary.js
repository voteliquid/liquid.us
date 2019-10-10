const { html, linkifyUrls } = require('../helpers')
const { icon } = require('@fortawesome/fontawesome-svg-core')
const { faMinus } = require('@fortawesome/free-solid-svg-icons/faMinus')
const { faPlus } = require('@fortawesome/free-solid-svg-icons/faPlus')

module.exports = ({ measure, alwaysExpanded, size = 6 }, dispatch) => {
  const expanded = alwaysExpanded ? true : measure.expanded
  const summary =
    measure.type === 'nomination' && measure.summary
      ? `Confirmation of ${measure.summary}`
      : linkifyUrls(measure.summary)
  const summaryWithoutRepeatedTitle = summary.split(/<\/b> ?<\/p>|<\/strong><\/p>/)[1] || summary

  return html`
    <div
      class=${`${expanded || !summary ? '' : 'summary'} measureDescription`}
      style=${!expanded && summary && summary.length > 512 ? 'max-height: 10rem;' : ''}
    >
      <div class=${`content is-size-${size}`}>
        ${{ html: summaryWithoutRepeatedTitle.replace(/\n/g, '<br />') }}
      </div>
      <div class="${`read-more ${summary && summary.length > 512 ? '' : 'is-hidden'}`}"></div>
      <a class="${`read-more-link is-size-7 ${summary && summary.length > 512 ? '' : 'is-hidden'}`}" href="#" onclick=${(event) => dispatch({ type: 'measure:toggleSummaryExpanded', measure, event })}>
        ${summary && !measure.alwaysExpanded
          ? html`<span class="icon is-small">${expanded ? icon(faMinus) : icon(faPlus)}</span> ${expanded ? 'Show less' : 'Show more'}`
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
