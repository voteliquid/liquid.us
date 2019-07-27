module.exports = (event, state) => {
  switch (event.type) {
    case 'legislature:legislaturesAndOfficesReceived':
      return [{
        ...state,
        geoip: event.geoip || state.geoip,
        offices: event.legislatures.reduce((offices, legislature) => {
          return offices.concat(legislature.offices.map((office) => ({ ...office, legislature })))
        }, []),
        officesRequested: true,
        reps: event.legislatures.reduce((reps, legislature) => {
          return reps.concat(legislature.offices.filter((office) => office.office_holder).map((rep) => ({ ...rep, legislature })))
        }, []),
        legislatures: event.legislatures,
      }]
    default:
      return [state]
  }
}
