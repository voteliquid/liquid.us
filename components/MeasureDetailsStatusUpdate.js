const Component = require('./Component')

module.exports = class MeasureDetailsStatusUpdate extends Component {
  render() {
    const { selected_bill = {}, user } = this.state
    const l = selected_bill
    const next_action_at = l.next_agenda_action_at || l.next_agenda_begins_at
    const index = l.legislature_name.indexOf(',')

    const status = l.published === false
    ? `Draft legislation created on ${(new Date(l.created_at)).toLocaleDateString()}`
    : next_action_at
    ? [`
      Scheduled for House floor action ${!l.next_agenda_action_at ? 'during the week of' : 'on'} ${new Date(next_action_at).toLocaleDateString()}
      <br />
    `]
    : l.status === 'Introduced' && l.sponsor_username === null
    ? `Published on Liquid ${l.legislature_name === 'U.S. Congress' ? 'Congress' : index ? l.legislature_name.slice(0, index) : l.legislature_name}`
    : l.status === 'Introduced'
    ? `Introduced on ${(new Date(l.introduced_at)).toLocaleDateString()}`
    : `${l.status}`
    const title = l.type === 'nomination' ? `Do you support ${l.title.replace(/\.$/, '')}?` : l.title

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
              <h2 class="title is-5">Current Status: ${status}</h2>
              <h2 class="title is-5">New Status:</h2>
              ${this.state.loading === 'populating' ? ' ' : EditStatusForm.for(this)}
              <br />
              ${l.type !== 'nomination' ? MeasureSummary.for(this, { measure: l }) : ''}
            </div>
            <div class="${`column ${l.introduced_at ? `column is-one-third-tablet is-one-quarter-desktop` : ''}`}">
            </div>
          </div>
        </div>
      </section>
    `
  }
}

class UnpublishedMsg extends Component {
  render() {
    const { selected_bill = {}, user } = this.state
    return this.html`
      <div class="notification">
        <span class="icon"><i class="fa fa-exclamation-triangle"></i></span>
        ${user && selected_bill.author_id === user.id
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
    const { expanded } = this.props
    const { selected_bill = {} } = this.state
    const measure = selected_bill
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
        <div class="content">
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
class EditStatusForm extends Component {
  onkeyup(event) {
    this.setProps({ [event.target.getAttribute('name')]: event.target.value }).render()
  }
  onchange(event) {
    this.setProps({ [event.target.getAttribute('name')]: event.target.value }).render()
  }
  onsubmit(event, form) {
    event.preventDefault()

    const { selected_bill = {}, loading } = this.state
    if (!loading) {
      if (selected_bill.id) {
        return this.updateStatus(event, form)
      }
    }
  }
  updateStatus(event, form) {
    const { selected_bill = {}, user } = this.state
    this.setState({ loading: 'saving' })

    return this.api(`/measures?id=eq.${selected_bill.id}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(form),
    })
    .then((bills) => {
      const bill = bills[0]
      this.setState({
        loading: false,
        yourUpdate: (this.state.yourUpdate || []).map((old) => (old.id === selected_bill.id ? bill : old)),
      })
      this.location.redirect(303, `/${user.username}/legislation/${bill.short_id}`)
      })
    .catch((api_error) => this.handleError(api_error))
  }

  render() {
    const { selected_bill = {}, error, loading } = this.state
    const { created_at, introduced_at, status, sponsor_username, legislature_name, next_agenda_action_at, next_agenda_begins_at, published } = selected_bill
    const index = legislature_name.indexOf(',')
    const next_action_at = next_agenda_action_at || next_agenda_begins_at

    const reviseStatus = published === false
    ? `Draft legislation created on ${(new Date(created_at)).toLocaleDateString()}`
    : next_action_at
    ? [`
      Scheduled for House floor action ${!next_agenda_action_at ? 'during the week of' : 'on'} ${new Date(next_action_at).toLocaleDateString()}
      <br />
    `]
    : status === 'Introduced' && sponsor_username === null
    ? `Published on Liquid ${legislature_name === 'U.S. Congress' ? 'Congress' : index ? legislature_name.slice(0, index) : legislature_name}`
    : status === 'Introduced'
    ? `Introduced on ${(new Date(introduced_at)).toLocaleDateString()}`
    : `${status}`

    return this.html`
      <form method="POST" onsubmit=${this} action=${this}>
        ${error ? [`<div class="notification is-danger">${error}</div>`] : ''}
        <div class="field">
          <div class="control">
            <input name="status" class="input" type="text" autocomplete="off" placeholder="${reviseStatus}" onkeyup="${this}" onchange="${this}" required value="${reviseStatus || ''}" />
          </div>
        </div>
        <div class="field is-grouped">
          <div class="control">
            <button class=${`button is-primary ${loading === 'saving' ? 'is-loading' : ''}`} disabled="${loading}" type="submit">
              <span class="icon"><i class="fa fa-edit"></i></span>
              <span>Save</span>
            </button>
          </div>
        </div>
        </form>
    `
  }
}
