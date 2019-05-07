const { avatarURL, html } = require('../helpers')

module.exports = ({ measure, reps }) => {

  const targetReps = reps.filter(r =>
    [r.legislature.short_name, r.legislature.name].includes(measure.legislature_name)
  )
  .filter(r => r.office_holder.elected_office_phone)

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
  const phone = rep.elected_office_phone.replace(/-/g, '')
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
          <a class="button is-success is-small" src=${`tel:+1${phone}`}>${displayNum(phone)}</a>
        </div>
      </div>
    </div>
  `
}
