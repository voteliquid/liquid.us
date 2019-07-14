const { api } = require('../helpers')

exports.fetchMeasure = (shortId, offices, user) => (dispatch) => {
  return api(dispatch, `/measures_detailed?short_id=eq.${shortId}`, { user }).then(([measure]) => {
    if (measure) {
      return Promise.all([
        api(dispatch, `/measure_vote_counts?measure_id=eq.${measure.id}`, { user }),
        fetchMeasureVoteCountsByOffice(dispatch, measure, offices, user),
        api(dispatch, `/votes_detailed?measure_id=eq.${measure.id}&public=eq.true&comment=not.is.null&comment=not.eq.&position=eq.yea&order=proxy_vote_count.desc.nullslast,created_at.desc`, { user }),
        api(dispatch, `/votes_detailed?measure_id=eq.${measure.id}&public=eq.true&comment=not.is.null&comment=not.eq.&position=eq.nay&order=proxy_vote_count.desc.nullslast,created_at.desc`, { user }),
        user && api(dispatch, `/rpc/vote_power_for_measure`, {
          method: 'POST',
          body: JSON.stringify({ user_id: user.id, measure_id: measure.id }),
          user
        }),
      ]).then(([voteCounts, officeVoteCounts, [topYea], [topNay], votePower]) => {
        const measureWithVotes = { ...measure, vote_counts: voteCounts.concat(officeVoteCounts) }
        dispatch({ type: 'measure:received', measure: measureWithVotes, topYea, topNay, votePower })
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
  const officeId = officesInChamber.map((office) => office.id).shift()
  const officeParam = officeId ? `&office_id=eq.${officeId}` : '&office_id=is.null'
  return api(dispatch, `/measure_vote_counts_by_office?measure_id=eq.${measure.id}${officeParam}`, { user })
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
