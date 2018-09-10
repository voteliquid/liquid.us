const Component = require('./Component')
const Sidebar = require('./MeasureDetailsSidebar')
const ProxyVotes = require('./MeasureProxyVotes')
const TopComments = require('./MeasureTopComments')
const Votes = require('./MeasureVotes')

module.exports = class MeasureDetails extends Component {
  render() {
    const { config, legislation_query, user } = this.state
    const { measure: l } = this.props

    const bill_id = l.introduced_at ? `${l.type} ${l.number}` : l.title
    const title = l.type === 'PN' ? `Do you support ${l.title.replace(/\.$/, '')}?` : l.title

    return this.html`
      <section class="section">
        <div class="container is-widescreen">
          <nav class="breadcrumb has-succeeds-separator is-left is-small" aria-label="breadcrumbs">
            <ul>
              <li><a class="has-text-grey" href="/">${config.APP_NAME}</a></li>
              ${[l.type === 'PN' ? '' : `<li><a class="has-text-grey" href="${legislation_query || '/legislation'}">Legislation</a></li>`]}
              <li class="is-active"><a class="has-text-grey" href="#" aria-current="page">${bill_id}</a></li>
            </ul>
          </nav>
          ${l.published ? '' : UnpublishedMsg.for(this, { measure: l, user })}
          ${(l.vote_position && !user.cc_verified) ? [`
            <p class="notification is-info">
              <span class="icon"><i class="fa fa-exclamation-triangle"></i></span>
              <strong>Help hold your reps accountable!</strong><br />
              Your vote has been recorded, and we'll send it to your elected reps, but it won't be included in their Representation Grade until you <a href="/get_started">verify your identity</a>.
            </p>
          `] : ''}
          <div class="columns">
            <div class="${l.introduced_at ? `column is-two-thirds-tablet is-three-quarters-desktop` : ''}">
              <h2 class="title has-text-weight-normal is-4">${title}</h2>
              ${l.type !== 'PN' ? MeasureSummary.for(this, { measure: l }) : ''}
              ${TopComments.for(this, { measure: l, yea: l.top_yea, nay: l.top_nay })}
              ${user ? ProxyVotes.for(this, { measure: l }) : ''}
              ${Votes.for(this, { measure: l })}
            </div>
            <div class="${l.introduced_at ? `column is-one-third-tablet is-one-quarter-desktop` : ''}">
              ${l.introduced_at ? Sidebar.for(this, { ...l, user }, `measure-sidebar-${l.id}`) : ''}
            </div>
          </div>
        </div>
      </section>
    `
  }
}

class UnpublishedMsg extends Component {
  render() {
    const { measure, user } = this.props
    return this.html`
      <div class="notification">
        <span class="icon"><i class="fa fa-exclamation-triangle"></i></span>
        ${user && measure.author_id === user.id
          ? `Your proposed legislation is unpublished. You can continue to edit it until you decide to publish.`
          : `This proposed legislation is a draft. The author may continue to make changes until it's published.`
        }

      </div>
    `
  }
}

class MeasureSummary extends Component {
  onclick(event) {
    event.preventDefault()
    this.setProps({ expanded: !this.props.expanded })
    this.render()
  }
  render() {
    const { measure, expanded } = this.props
    const { chamber, congress, number, type } = measure
    const summary = type === 'PN' && measure.summary ? `Confirmation of ${measure.summary}` : this.linkifyUrls(measure.summary)

    return this.html`
      <style>
        .summary {
          max-height: 10rem;
          margin-bottom: 1.5rem;
          position: relative;
          overflow: hidden;
        }
        .summary .read-more {
          position: absolute;
          bottom: 1rem;
          left: 0;
          width: 100%;
          margin: 0;
          height: 3rem;

          /* "transparent" only works here because == rgba(0,0,0,0) */
          background-image: linear-gradient(to bottom, transparent, white);
        }
        .summary .read-more-link {
          background: white;
          display: block;
          width: 100%;
          height: 1rem;
          position: absolute;
          bottom: 0;
        }
      </style>
      <div class=${`${expanded || !summary ? '' : 'summary'}`}>
        <div class="content">
          ${[summary ? summary.replace(/\n/g, '<br />') : `<p>A summary is in progress. <a href="https://www.congress.gov/bill/${congress}th-congress/${chamber === 'Lower' ? 'house' : 'senate'}-bill/${number}/text" target="_blank">Read full text of the bill at congress.gov <span class="icon is-small"><i class="fa fa-external-link"></i></span></a>`]}
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
