const Component = require('./Component')
const LoadingIndicator = require('./LoadingIndicator')
const YourLegislators = require('./YourLegislators')

module.exports = class LegislatorsPage extends Component {
  oninit() {
    if (!this.state.legislators) {
      this.setState({ loading_legislators: true })
      return this.api('/user_profiles?select=user_id,username,first_name,last_name,party_affiliation,elected_office_chamber,elected_office_short_name,num_verified_constituents,representation_grade&elected_office_name=neq.null&order=representation_grade.asc.nullslast,num_verified_constituents.desc.nullslast,last_name.asc')
        .then(legislators => ({ loading_legislators: false, legislators }))
        .catch(error => ({ error, loading_legislators: false, legislators: [] }))
    }
  }

  render() {
    const { config, loading_legislators } = this.state

    return this.html`
      <section class="section">
        <div class="container is-widescreen">
          <nav class="breadcrumb has-succeeds-separator is-left is-small" aria-label="breadcrumbs">
            <ul>
              <li><a class="has-text-grey" href="/">${config.APP_NAME}</a></li>
              <li class="is-active"><a class="has-text-grey" href="/legislators" aria-current="page">Congress Members</a></li>
            </ul>
          </nav>
          ${loading_legislators ? LoadingIndicator.for(this) : LegislatorsPageContent.for(this)}
        </div>
      </section>
    `
  }
}

class LegislatorsPageContent extends Component {
  render() {
    const { legislators = [] } = this.state

    return this.html`
      ${YourLegislators.for(this)}
      <hr />
      <div class="columns">
        <div class="column">
          <h2 class="title is-5">House</h2>
        </div>
        <div class="column">
          <h2 class="title is-5">Senate</h2>
        </div>
      </div>
      <div class="columns">
        <div class="column">
          <p class="is-size-7 has-text-grey">Legislators are graded on how often they vote the same way as their verified constituents. <br />Grades are relative within chamber and party.</p>
        </div>
      </div>
      <div class="columns">
        <div class="column">
          ${CongressMembers.for(this, { legislators: legislators.filter(l => l.elected_office_chamber === 'Lower') }, `house-members-table`)}
        </div>
        <div class="column">
          ${CongressMembers.for(this, { legislators: legislators.filter(l => l.elected_office_chamber === 'Upper') }, `senate-members-table`)}
        </div>
      </div>
    `
  }
}

class CongressMembers extends Component {
  render() {
    const { legislators } = this.props
    return this.html`
      <table class="table is-fullwidth is-narrow is-striped">
        <thead>
          <tr>
            <th style="vertical-align: bottom">Name</th>
            <th style="vertical-align: bottom">District</th>
            <th>Verified<br /> constituents</th>
            <th style="vertical-align: bottom">Grade</th>
          </tr>
        </thead>
        <tbody>
          ${legislators.map(legislator => CongressMembersRow.for(this, legislator, `members-table-row-${legislator.user_id}`))}
        </tbody>
      </table>
    `
  }
}

class CongressMembersRow extends Component {
  render() {
    const l = this.props
    return this.html`
      <tr>
        <td>
          <a href=${`/${l.username}`}>
            <span>${l.first_name} ${l.last_name}</span>
            <span class="has-text-grey is-size-7">(${l.party_affiliation[0]})</span>
          </a>
        </td>
        <td>
          <span class="has-text-grey">${l.elected_office_short_name}</span>
        </td>
        <td>${l.num_verified_constituents}</td>
        <td>${l.representation_grade}</td>
      </tr>
    `
  }
}
