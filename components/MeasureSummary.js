const Component = require('./Component')

module.exports = class MeasureSummary extends Component {
  oninit() {
    if (this.state.location.query.show_more === 'true') {
      this.setProps({ expanded: true })
    }
  }
  onclick(event) {
    event.preventDefault()
    this.setProps({ expanded: !this.props.expanded })
    this.render()
  }
  render() {
    const { measure, expanded, size = 6 } = this.props
    const { chamber, congress, number, type } = measure
    const summary = type === 'nomination' && measure.summary ? `Confirmation of ${measure.summary}` : this.linkifyUrls(measure.summary)
    const summaryLink =
      measure.legislature_name === 'U.S. Congress' && measure.author_id === null
        ? `<p>Learn more at <a href="https://www.congress.gov/bill/${congress}th-congress/${chamber === 'Lower' ? 'house' : 'senate'}-bill/${number}/text" target="_blank">congress.gov <span aria-hidden="true" class="icon is-small is-size-7"><i class="fas fa-external-link-alt"></i></span></a>`
        : ''

    const summaryWithoutRepeatedTitle = summary.split(/<\/b> ?<\/p>|<\/strong><\/p>/)[1] || summary

    return this.html`
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

      <div class=${`${expanded || !summary ? '' : 'summary'} measureDescription`} style=${!expanded && summary && summary.length > 512 ? 'max-height: 10rem;' : ''}>
        <div class=${`content is-size-${size}`}>
          ${[summary ? `${summaryWithoutRepeatedTitle.replace(/\n/g, '<br />')} ${summaryLink}` : `<p>A summary is in progress.</p>${summaryLink}`]}
        </div>
        <div class="${`read-more ${summary && summary.length > 512 ? '' : 'is-hidden'}`}"></div>
        <a class="${`read-more-link is-size-7 ${summary && summary.length > 512 ? '' : 'is-hidden'}`}" href="#" onclick=${this}>
          ${summary
            ? [`<span class="icon is-small"><i class="${`fa fa-${expanded ? 'minus' : 'plus'}`}"></i></span> ${expanded ? 'Show less' : 'Show more'}`]
            : ''}
        </a>
      </div>
    `
  }
}
