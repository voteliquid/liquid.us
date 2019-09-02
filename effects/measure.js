const { api } = require('../helpers')

exports.fetchMeasure = (shortId, { user }) => (dispatch) => {
  return api(dispatch, `/measures_detailed?short_id=eq.${shortId}`, { user })
    .then(([measure]) => dispatch({ type: 'measure:received', measure }))
}

exports.fetchMeasureDetails = (measure, state) => (dispatch) => {
  const { offices, user } = state
  return Promise.all([
    fetchMeasureVoteCountsByOffice(dispatch, measure, offices, user),
    fetchMeasureTopVote(dispatch, measure, 'yea', user),
    fetchMeasureTopVote(dispatch, measure, 'nay', user),
    fetchMeasureVotePower(dispatch, measure, user),
  ]).then(([officeVoteCounts, [topYea], [topNay], votePower]) => {
    dispatch({
      type: 'measure:detailsReceived',
      measure,
      voteCounts: officeVoteCounts,
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
  return api(dispatch, `/votes_detailed?measure_id=eq.${measure.id}&public=eq.true&comment=not.is.null&comment=not.eq.&position=eq.${position}&delegate_rank=eq.-1&order=vote_power.desc.nullslast,created_at.desc`, { user })
}

const fetchMeasureVoteCountsByOffice = (dispatch, measure, offices, user) => {
  const officesInChamber = offices.filter(({ chamber, legislature }) => {
    return chamber === measure.chamber && measure.legislature_name === legislature.name
  })
  const office = officesInChamber[0]
  if (office) {
    return api(dispatch, `/measure_vote_counts?measure_id=eq.${measure.id}&office_id=eq.${office.id}`, { user })
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
    vote_power: 'vote_power.desc.nullslast,created_at.desc',
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

const fetchVotesReport = exports.fetchVotesReport = (measure, state, pagination = { offset: 0, limit: 500 }) => (dispatch) => {
  const { user } = state
  return api(dispatch, `/votes_detailed_with_offices?select=id,position,public,comment,user->>first_name,user->>last_name,city:locality,state:administrative_area_level_1,district:offices->0->>short_name,registered_voter:voter_verified,date:created_at&measure_id=eq.${measure.id}`, {
    headers: { Accept: 'text/csv' },
    pagination,
    user,
  })
  .then(({ pagination: nextPagination, results: csv }) => {
    dispatch({
      type: 'measure:voteCSVReceivedChunk',
      csv: pagination.offset ? csv.substring(csv.indexOf('\n') + 1) : csv,
      measure,
      pagination,
      nextPagination,
    })
    if ((pagination ? pagination.count : nextPagination.count) > nextPagination.offset) {
      return fetchVotesReport(measure, state, { ...pagination, ...nextPagination })(dispatch)
    }
    dispatch({ type: 'measure:voteCSVReceived', measure, pagination, nextPagination })
  })
}

exports.confirmDeleteMeasure = (measure) => (dispatch) => {
  const confirmed = window.confirm('Are you sure you want to delete? This cannot be undone!')
  if (confirmed) {
    dispatch({ type: 'measure:deleteConfirmed', measure })
  }
}

exports.deleteMeasure = (measure, user) => (dispatch) => {
  return api(dispatch, `/measures?id=eq.${measure.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ deleted_at: new Date() }),
    user,
  })
  .then(() => dispatch({ type: 'redirected', status: 302, url: '/legislation/yours' }))
  .then(() => dispatch({ type: 'measure:deleted', measure }))
}

exports.fetchUserMeasures = (user) => (dispatch) => {
  return api(dispatch, `/measures_detailed?author_id=eq.${user.id}&order=created_at.desc`, { user })
    .then((measures) => dispatch({ type: 'measure:receivedList', measures }))
}

exports.saveMeasure = (measure, { oldShortId, ...form }, state) => (dispatch) => {
  return (measure && measure.id ? updateMeasure : insertMeasure)(measure, form, state)(dispatch)
}

const insertMeasure = (measure, form, state) => (dispatch) => {
  const { user } = state
  return api(dispatch, '/measures', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      author_id: user.id,
      legislature_id: form.legislature_id,
      title: form.title,
      summary: form.summary,
      chamber: 'Lower',
      type: form.measure_type,
      short_id: form.short_id.toLowerCase(),
    }),
    user,
  })
  .then(() => exports.fetchMeasure(form.short_id, state)(dispatch))
  .then(() => {
    dispatch({ type: 'redirected', status: 303, url: `/${user.username}/${form.short_id}` })
  })
  .catch(handleError(dispatch))
}

const updateMeasure = (measure, form, state) => (dispatch) => {
  const { user } = state
  return api(dispatch, `/measures?id=eq.${measure.id}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ ...form, short_id: form.short_id.toLowerCase(), type: form.measure_type }),
    user,
  })
  .then(() => exports.fetchMeasure(form.short_id, state)(dispatch))
  .then(() => {
    dispatch({ type: 'redirected', status: 303, url: `/${user.username}/${form.short_id}` })
  })
  .catch(handleError(dispatch))
}

exports.fetchUpdates = (measure, { user }) => (dispatch) => {
  return api(dispatch, `/measure_updates?measure_id=eq.${measure.id}&order=created_at.desc`, { user }).then((updates) => dispatch({
    type: 'measure:updatesReceived',
    updates,
    measure,
  })).catch((error) => dispatch({ type: 'measure:error', measure, error }))
}

exports.postUpdate = ({ measure, ...form }, { user }) => (dispatch) => {
  return api(dispatch, `/measure_updates${form.id ? `?id=eq.${form.id}` : ''}`, {
    method: form.id ? 'PATCH' : 'POST',
    body: JSON.stringify({
      measure_id: measure.id,
      message: form.message,
      notify_voters: !!form.notify_voters,
    }),
    user,
  })
  .then(() => dispatch({ type: 'measure:updatesRequested', measure }))
}

exports.deleteUpdate = ({ measure, ...form }, { user }) => (dispatch) => {
  return api(dispatch, `/measure_updates?id=eq.${form.id}`, {
    method: 'DELETE',
    user,
  })
  .then(() => dispatch({ type: 'measure:updatesRequested', measure }))
}

exports.toggleNotifications = ({ measure }, { user }) => (dispatch) => {
  if (measure.notifications) {
    return api(dispatch, `/unsubscribes`, {
      method: 'POST',
      body: JSON.stringify({ user_id: user.id, measure_id: measure.id }),
      user,
    })
  }
  return api(dispatch, `/unsubscribes?user_id=eq.${user.id}&measure_id=eq.${measure.id}`, {
    method: 'DELETE',
    user,
  })
}

const handleError = (dispatch) => (error) => {
  dispatch({ type: 'error', error })
  switch (error.message) {
    case 'new row for relation "measures" violates check constraint "short_id_length"':
      error.message = 'URL ID must be between 2 and 32 characters.'
      break
    case 'duplicate key value violates unique constraint "legislation_unique"':
      error.message = 'There is already a bill with this URL. Please choose another.'
      break
    default:
      dispatch({ type: 'contactForm:toggled' })
      error.message = 'An error on our end occurred. Please contact support.'
  }
  dispatch({ type: 'measure:editFormError', error })
}
