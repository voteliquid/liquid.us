const { avatarURL, html } = require('../helpers')

module.exports = ({ measure, reps }) => {

  const targetReps = reps.filter(r =>
    r.legislature.short_name === measure.legislature_name
    || r.legislature.name === measure.legislature_name
  )

  return html`
    <div class="content">
      <p class="title is-4 has-text-centered" style="margin-bottom: 5px;">Call Your Reps</p>
      ${targetReps.map(rep)}
    </div>
  `
}

const rep = (r) => {
  const rep = r.office_holder
  const isState = r.legislature.name !== 'U.S. Congress'
  const nameLine = isState
    ? `${rep.first_name} ${rep.last_name}, ${r.legislature.short_name}`
    : `${r.chamber === 'Upper' ? 'Sen' : 'Rep'}. ${rep.first_name} ${rep.last_name}`
  const num = '5109876543'
  function displayNum(num) {
    return `(${num.slice(0, 3)}) ${num.slice(3, 6)}-${num.slice(6)}`
  }

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
          <a class="button is-success is-small" src=${`tel:+1${num}`}>${displayNum(num)}</a>
        </div>
      </div>
    </div>
  `
}
