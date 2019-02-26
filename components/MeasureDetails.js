const Component = require('./Component')
const MeasureProxyVotes = require('./MeasureProxyVotes')
const Sidebar = require('./MeasureDetailsSidebar')
const TopComments = require('./MeasureTopComments')
const Votes = require('./MeasureVotes')
const MeasureSummary = require('./MeasureSummary')

module.exports = class MeasureDetails extends Component {
  render() {
    const { user } = this.state
    const { measure: l } = this.props
    const next_action_at = l.next_agenda_action_at || l.next_agenda_begins_at
    const index = l.legislature_name.indexOf(',')
    const legName = l.legislature_name === 'U.S. Congress' ? 'Congress' : index ? l.legislature_name.slice(0, index) : l.legislature_name
    console.log(l.legislature_name.slice(','))
    const title = l.type === 'nomination' ? `Do you support ${l.title.replace(/\.$/, '')}?` : l.title
    const status = l.published === false ? `Draft legislation created on ${(new Date(l.created_at)).toLocaleDateString()}` : next_action_at ? [`
      Scheduled for House floor action ${!l.next_agenda_action_at ? 'during the week of' : 'on'} ${new Date(next_action_at).toLocaleDateString()}
      <br />
    `] : l.status === 'Introduced' && l.sponsor_username === null ? `Published on Liquid ${legName}` : l.status === 'Introduced' ? `Introduced on ${(new Date(l.introduced_at)).toLocaleDateString()}` : `${l.status}`
    return this.html`
      <section class="section">
        <div class="container is-widescreen">
          ${l.published ? '' : UnpublishedMsg.for(this, { measure: l, user })}
          ${(l.vote_position && !user.verified) ? [`
            <p class="notification is-info">
              <span class="icon"><i class="fa fa-exclamation-triangle"></i></span>
              <strong>Help hold your reps accountable!</strong><br />
              Your vote has been saved, and we'll send it to your elected reps, but it won't be counted publicly until you <a href="/get_started">verify your identity</a>.
            </p>
          `] : ''}
          <div class="columns">
            <div class="column is-two-thirds-tablet is-three-quarters-desktop">
              <h2 class="title has-text-weight-normal is-4">${title}</h2>
                <h2 class="title has-text-weight-normal is-6"><i>${status}</i></h2>
                ${l.type !== 'nominatioon' ? MeasureSummary.for(this, { measure: l }) : ''}
              ${TopComments.for(this, { measure: l, yea: l.top_yea, nay: l.top_nay })}
              ${user ? MeasureProxyVotes.for(this, { measure: l }) : ''}
              ${Votes.for(this, { measure: l })}
            </div>
            <div class="${`column ${l.introduced_at ? `column is-one-third-tablet is-one-quarter-desktop` : ''}`}">
              ${Sidebar.for(this, { ...l, user }, `measure-sidebar-${l.id}`)}
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
