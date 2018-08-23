const Component = require('./Component')

module.exports = class LegislationTitle extends Component {
  render() {
    const { selected_bill: l } = this.state
    const show_tracker = l.legislature_name === 'U.S. Congress' && l.introduced_at && (l.type === 'HR' || l.type === 'S')

    let bill_details_name = false
    let bill_details_url = false

    if (l.introduced_at) {
      if (l.legislature_name === 'U.S. Congress') {
        bill_details_name = 'congress.gov'
        if (l.type === 'HR' || l.type === 'S') {
          bill_details_url = `https://www.congress.gov/bill/${l.congress}th-congress/${l.chamber === 'Lower' ? 'house' : 'senate'}-bill/${l.number}`
        } else if (l.type === 'PN') {
          bill_details_url = `https://www.congress.gov/nomination/${l.congress}th-congress/${l.number}`
        }
        if (l.legislature_name === 'California') {
          bill_details_name = 'leginfo.legislature.ca.gov'
          bill_details_url = `https://leginfo.legislature.ca.gov/faces/billTextClient.xhtml?bill_id=${l.congress}0${l.type}${l.number}`
        }
      }
    }

    const bill_id = l.introduced_at ? `${l.type} ${l.number}` : l.title

    return this.html`
      <h2 class="title has-text-weight-normal is-4">${[title]}</h2>
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
