const stateNames = require('datasets-us-states-abbr-names')

module.exports = (event, state) => {
  switch (event.type) {
    case 'office:receivedList':
      return [{
        ...state,
        geoip: event.geoip || state.geoip,
        offices: event.offices,
        officesRequested: true,
        reps: event.offices.filter((office) => office.office_holder),
        legislatures: legislaturesFromOffices(event.offices, event.geoip || state.geoip, state.user),
      }]
    default:
      return [state]
  }
}

const legislaturesFromOffices = (offices, geoip = {}, user) => {
  const city = user && user.address ? user.address.city : geoip.city
  const state = user && user.address ? user.address.state : geoip.region

  const deduped = Object.values(offices.reduce((b, a) => {
    b[a.legislature.id] = a
    return b
  }, {}))

  return deduped.map((office) => office.legislature).sort((a, b) => {
    if (a.short_name === `${city}, ${state}` && b.short_name === state) return 1
    if (a.short_name === state && b.short_name === `${city}, ${state}`) return -1
    return 0
  }).map((legislature) => {
    legislature.abbr = legislature.name
    legislature.name = stateNames[legislature.name] || legislature.name
    return legislature
  })
}
