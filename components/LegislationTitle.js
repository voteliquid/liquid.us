const Component = require('./Component')

module.exports = class LegislationTitle extends Component {
  render() {
    const { selected_bill: l } = this.state

    let bill_details_name = false
    let bill_details_url = false

    if (l.introduced_at) {
      if (l.legislature_name === 'U.S. Congress') {
        bill_details_name = 'congress.gov'
        bill_details_url = `https://www.congress.gov/bill/${l.congress}th-congress/${l.chamber === 'Lower' ? 'house' : 'senate'}-bill/${l.number}`
      }
      if (l.legislature_name === 'California') {
        bill_details_name = 'leginfo.legislature.ca.gov'
        bill_details_url = `https://leginfo.legislature.ca.gov/faces/billTextClient.xhtml?bill_id=${l.congress}0${l.type}${l.number}`
      }
    }

    const bill_id = l.introduced_at ? `${l.type} ${l.number}` : l.title

    return this.html`
      <h2 class="title has-text-weight-normal is-4 is-marginless">${[l.introduced_at ? `${bill_id} &mdash; ${l.title}` : l.title]}</h2>
      ${l.legislature_name === 'U.S. Congress' && l.introduced_at ? StatusTracker.for(this) : ''}
      <p class="is-size-7 has-text-grey">
        ${l.introduced_at ? l.legislature_name : `Proposed for ${l.legislature_name}`} &bullet;
        ${[l.sponsor_username
          ? `Introduced by <a href=${`/${l.sponsor_username}`}>${l.sponsor_first_name} ${l.sponsor_last_name}</a> on ${(new Date(l.introduced_at)).toLocaleDateString()} &bullet; Last action on ${new Date(l.last_action_at).toLocaleDateString()}`
          : l.introduced_at
            ? `Introduced on ${(new Date(l.introduced_at)).toLocaleDateString()} &bullet; last action on ${new Date(l.last_action_at).toLocaleDateString()}`
            : l.author_username
              ? `Authored by <a href="/${l.author_username}">${l.author_first_name} ${l.author_last_name}</a> on ${(new Date(l.created_at)).toLocaleDateString()}`
              : `Authored anonymously on ${(new Date(l.created_at)).toLocaleDateString()}`
        ]}
        ${bill_details_url ? [`&bullet; <a href=${bill_details_url} target="_blank">Bill details at ${bill_details_name} <span class="icon is-small"><i class="fa fa-external-link"></i></span></a>`] : ''}
      </p>
    `
  }
}

class StatusTracker extends Component {
  render() {
    const { selected_bill: l } = this.state
    const steps = [{ step: 'Introduced', fulfilled: !!l.introduced_at }]

    if (l.chamber === 'Upper') {
      steps.push({ step: 'Passed Senate', fulfilled: !!l.passed_upper_at })
      steps.push({ step: 'Passed House', fulfilled: !!l.passed_lower_at })
    } else {
      steps.push({ step: 'Passed House', fulfilled: !!l.passed_lower_at })
      steps.push({ step: 'Passed Senate', fulfilled: !!l.passed_upper_at })
    }

    steps.push({ step: 'Enacted', fulfilled: !!l.enacted_at })

    return this.html`
      <style>
      .status_tracker {
        list-style: none;
        display: inline-block;
        margin-left: 1rem;
        margin-bottom: .5rem;
      }
      .status_tracker .step {
        float: left;
        padding-top: .5rem;
      }
      .status_tracker .step:first-child {
        margin-left: -1rem;
      }
      .status_tracker .step .step_label {
        display: block;
        background: rgba(0, 0, 0, 0.06);
        text-decoration: none;
        position: relative;
        height: 2rem;
        line-height: 2rem;
        padding: 0 .7rem 0 0;
        text-align: center;
        margin-right: 1.2rem;
      }
      .status_tracker .step.fulfilled .step_label {
        background: rgba(0, 0, 0, 0.09);
      }
      .status_tracker .step:first-child .step_label {
        padding-left: .7rem;
        border-radius: 4px 0 0 4px;
      }
      .status_tracker .step:first-child .step_label:before {
        border: none;
      }
      .status_tracker .step:last-child .step_label {
        padding-right: 1rem;
        border-radius: 0 4px 4px 0;
      }
      .status_tracker .step:last-child .step_label:after {
        border: none;
      }
      .status_tracker .step .step_label:before, .status_tracker .step .step_label:after {
        content: "";
        position: absolute;
        top: 0;
        border: 0 solid rgba(0, 0, 0, 0.06);
        border-width: 1rem .5rem;
        width: 0;
        height: 0;
      }
      .status_tracker .step .step_label:before {
        left: -1rem;
        border-left-color: transparent;
      }
      .status_tracker .step .step_label:after {
        left: 100%;
        border-color: transparent;
        border-left-color: rgba(0, 0, 0, 0.06);
      }
      .status_tracker .step.fulfilled .step_label {
        background-color: rgba(0, 0, 0, 0.09);
      }
      .status_tracker .step.fulfilled .step_label:before {
        border-color: rgba(0, 0, 0, 0.09);
        border-left-color: transparent;
      }
      .status_tracker .step.fulfilled .step_label:after {
        border-left-color: rgba(0, 0, 0, 0.09);
      }
      </style>
      <div class="is-size-7 status_tracker">
        ${steps.map(({ fulfilled, step }) => `
          <div class="${`step ${fulfilled ? 'fulfilled' : 'has-text-grey'}`}"><div class="step_label"><span class="icon"><i class="fa ${fulfilled ? 'fa-check-circle-o' : 'fa-circle-o'}"></i></span>${step}</div></div>
        `)}
      </div>
    `
  }
}
