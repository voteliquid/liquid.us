const { api } = require('../helpers')

exports.fetchMeasure = (shortId, offices, user) => (dispatch) => {
  return api(dispatch, `/measures_detailed?short_id=eq.${shortId}`, { user }).then(([measure]) => {
    if (measure) {
      return Promise.all([
        api(dispatch, `/measure_vote_counts?measure_id=eq.${measure.id}`, { user }),
        fetchMeasureVoteCountsByOffice(dispatch, measure, offices, user),
        api(dispatch, `/votes_detailed?measure_id=eq.${measure.id}&public=eq.true&comment=not.is.null&comment=not.eq.&position=eq.yea&order=proxy_vote_count.desc.nullslast,created_at.desc`, { user }),
        api(dispatch, `/votes_detailed?measure_id=eq.${measure.id}&public=eq.true&comment=not.is.null&comment=not.eq.&position=eq.nay&order=proxy_vote_count.desc.nullslast,created_at.desc`, { user }),
        api(dispatch, `/votes_detailed?select=id&measure_id=eq.${measure.id}&public=eq.true&comment=not.is.null&comment=not.eq.&limit=1`, {
          method: 'COUNT',
          user,
        }),
        user && api(dispatch, `/rpc/vote_power_for_measure`, {
          method: 'POST',
          body: JSON.stringify({ user_id: user.id, measure_id: measure.id }),
          user
        }),
      ]).then(([voteCounts, officeVoteCounts, [topYea], [topNay], commentCount, votePower]) => {
        const measureWithVotes = { ...measure, vote_counts: voteCounts.concat(officeVoteCounts) }
        dispatch({ type: 'measure:received', measure: measureWithVotes, topYea, topNay, commentCount, votePower })
        return measureWithVotes
      })
    }
    dispatch({ type: 'measure:received', measure: null })
  })
}

const fetchMeasureVoteCountsByOffice = (dispatch, measure, offices, user) => {
  const officesInChamber = offices.filter(({ chamber, legislature }) => {
    return chamber === measure.chamber && measure.legislature_name === legislature.name
  })
  const office = officesInChamber[0]
  if (office) {
    return api(dispatch, `/measure_vote_counts_by_office?measure_id=eq.${measure.id}&office_id=eq.${office.id}`, { user })
      .then((voteCounts) => {
        if (voteCounts.length === 0) {
          return [{ measure_id: measure.id, office_name: office.short_name, office_id: office.id || null, yeas: 0, nays: 0, abstains: 0 }]
        }
        return voteCounts
      })
  }
  return Promise.resolve([])
}

exports.fetchMeasureVotes = (shortId, order = 'most_recent', position = 'all', user) => (dispatch) => {
  const orders = {
    most_recent: 'created_at.desc',
    vote_power: 'proxy_vote_count.desc.nullslast,created_at.desc',
  }

  const positions = {
    all: '',
    yea: '&position=eq.yea',
    nay: '&position=eq.nay',
  }

  return api(dispatch, `/votes_detailed?short_id=eq.${shortId}&endorsed_vote=is.null&comment=not.is.null&comment=not.eq.&order=${orders[order]}${positions[position]}`, { user })
    .then((votes) => dispatch({ type: 'measure:votesReceived', shortId, votes }))
}
