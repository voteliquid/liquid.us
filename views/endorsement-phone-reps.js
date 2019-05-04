const { avatarURL, html } = require('../helpers')

module.exports = ({ measure, reps }) => {

  const targetReps = reps.filter(r =>
    [r.legislature.short_name, r.legislature.name].includes(measure.legislature_name)
  )
  .map(r => ({ ...r, // TODO: Temp code to add placeholder phone numbers for CA Reps
    // Remove this map function once we get phone numbers from the API
    phone: r.legislature.name === 'CA' ? '5109876543' : null
  }))
  .filter(r => r.phone)

  return html`
    <div class="content">
      ${targetReps.length ? html`
        <p class="title is-4 has-text-centered" style="margin-bottom: 5px;">Call Your Reps</p>
        ${targetReps.map(rep)}
      ` : ''}
    </div>
  `
}

const rep = (r) => {
  const rep = r.office_holder
  const isState = r.legislature.name !== 'U.S. Congress'
  const nameLine = isState
    ? `${rep.first_name} ${rep.last_name}, ${r.legislature.short_name}`
    : `${r.chamber === 'Upper' ? 'Sen' : 'Rep'}. ${rep.first_name} ${rep.last_name}`
  const displayNum = (phone) => `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`

  return html.for(r, `call-rep-${r.id}`)`
    <div class="column is-narrow">
      <div class="media">
        <div class="media-left">
          <div class="image is-48x48 is-clipped">
            <img src=${avatarURL(rep)} />
          </div>
        </div>
        <div class="media-content has-text-weight-semibold is-size-5" style="line-height: 24px;">
          ${nameLine}<br />
          <a class="button is-success is-small" src=${`tel:+1${r.phone}`}>${displayNum(r.phone)}</a>
        </div>
      </div>
    </div>
  `
}
