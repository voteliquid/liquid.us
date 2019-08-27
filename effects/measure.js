const { api } = require('../helpers')

exports.fetchMeasure = (shortId, { user }) => (dispatch) => {
  return api(dispatch, `/measures_detailed?short_id=eq.${shortId}`, { user })
    .then(([measure]) => dispatch({ type: 'measure:received', measure }))
}

exports.fetchMeasureDetails = (measure, state) => (dispatch) => {
  const { offices, user } = state
  return Promise.all([
    fetchMeasureVoteCounts(dispatch, measure, user),
    fetchMeasureVoteCountsByOffice(dispatch, measure, offices, user),
    fetchMeasureTopVote(dispatch, measure, 'yea', user),
    fetchMeasureTopVote(dispatch, measure, 'nay', user),
    fetchMeasureVotePower(dispatch, measure, user),
  ]).then(([voteCounts, officeVoteCounts, [topYea], [topNay], votePower]) => {
    dispatch({
      type: 'measure:detailsReceived',
      measure,
      voteCounts: voteCounts.concat(officeVoteCounts),
      topYea,
      topNay,
      votePower,
    })
    return measure
  })
}

const fetchMeasureVotePower = (dispatch, measure, user) => {
  return user && api(dispatch, `/rpc/vote_power_for_measure`, {
    method: 'POST',
    body: JSON.stringify({ user_id: user.id, measure_id: measure.id }),
    user
  })
}

const fetchMeasureTopVote = (dispatch, measure, position, user) => {
  return api(dispatch, `/votes_detailed?measure_id=eq.${measure.id}&public=eq.true&comment=not.is.null&comment=not.eq.&position=eq.${position}&delegate_rank=eq.-1&order=proxy_vote_count.desc.nullslast,created_at.desc`, { user })
}

const fetchMeasureVoteCounts = (dispatch, measure, user) => {
  return api(dispatch, `/measure_vote_counts?measure_id=eq.${measure.id}`, { user })
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

exports.fetchVotes = (measure, { location, user }, pagination) => (dispatch) => {
  const { offset = 0, limit = 50 } = location.query
  return api(dispatch, `/votes_detailed_with_offices?measure_id=eq.${measure.id}&order=created_at.desc`, {
    pagination: pagination || { offset, limit },
    user,
  })
  .then(({ pagination, results }) => {
    dispatch({ type: 'measure:votesReceived', measure, votes: results, pagination })
  })
}

exports.fetchComments = (measure, { location, user }, pagination) => (dispatch) => {
  const { order = 'most_recent', position = 'all', offset = 0, limit = 25 } = location.query
  const orders = {
    most_recent: 'created_at.desc',
    vote_power: 'proxy_vote_count.desc.nullslast,created_at.desc',
  }

  const positions = {
    all: '',
    yea: '&position=eq.yea',
    nay: '&position=eq.nay',
  }

  const params = {
    measure_id: `eq.${measure.id}`,
    comment: 'not.is.null&comment=not.eq.',
    delegate_rank: 'eq.-1',
    order: `${orders[order]}${positions[position]}`,
  }

  const qs = Object.keys(params).map((key) => `${key}=${params[key]}`).join('&')

  return api(dispatch, `/votes_detailed?${qs}`, {
    pagination: pagination || { offset, limit },
    user,
  }).then(({ pagination, results }) => {
    dispatch({ type: 'measure:commentsReceived', measure, votes: results, pagination })
  })
}
