const { ASSETS_URL } = process.env
const { api, combineEffects, combineEffectsInSeries, download, preventDefault, redirect } = require('../helpers')
const { fetchMeasure, fetchMeasureDetails, fetchComments, fetchVotes } = require('../effects/measure')
const { changePageTitle } = require('../effects/page')

module.exports = (event, state) => {
  switch (event.type) {
    case 'pageLoaded':
      switch (state.location.route) {
        case '/legislation/:shortId':
        case '/nominations/:shortId':
        case '/:username/:shortId':
          return [{
            ...state,
            loading: {
              ...state.loading,
              page: !state.measures[state.location.params.shortId],
              comments: state.location.query.tab !== 'votes',
              votes: state.location.query.tab === 'votes',
            },
            location: {
              ...state.location,
              description: `Discuss with your fellow voters & be heard by your elected officials.`,
            },
            measures: {
              ...state.measures,
              [state.location.params.shortId]: {
                ...state.measures[state.location.params.shortId],
                showVoteForm: state.location.hash === 'measure-vote-form',
                expanded: state.location.query.show_more === 'true',
              },
            },
          }, combineEffectsInSeries([
            fetchMeasure(state.location.params.shortId, state),
            state.location.hash === 'measure-vote-form' && scrollVoteFormIntoView,
          ])]
        case '/petitions/create':
          if (!state.user) return [state, redirect('/join')]
          return [{
            ...state,
            location: {
              ...state.location,
              title: 'Start a petition',
            },
            loading: { ...state.loading, page: false },
            forms: { ...state.forms, editMeasureShortId: null },
          }, changePageTitle('Start a Petition')]
        case '/legislation/create':
          if (!state.user) return [state, redirect('/join')]
          return [{
            ...state,
            location: {
              ...state.location,
              title: 'Propose Legislation',
            },
            loading: { ...state.loading, page: false },
            forms: { ...state.forms, editMeasureShortId: null },
          }, changePageTitle('Propose Legislation')]
        case '/:username/:shortId/edit':
          if (!state.user) return [state, redirect('/sign_in')]
          return [{
            ...state,
            location: {
              ...state.location,
              title: 'Edit Measure',
            },
            loading: { ...state.loading, page: true },
            forms: { ...state.forms, editMeasureShortId: null },
          }, combineEffects([
            changePageTitle('Edit Measure'),
            fetchMeasure(state.location.params.shortId, state)
          ])]
        case '/petitions/yours':
          if (!state.user) return [state, redirect('/sign_in')]
          return [{
            ...state,
            loading: { ...state.loading, page: true },
            location: {
              ...state.location,
              title: 'Petitions',
            },
          }, combineEffects([
            changePageTitle('Petitions'),
            fetchUserMeasures(state.user)
          ])]
        case '/legislation/yours':
          if (!state.user) return [state, redirect('/sign_in')]
          return [{
            ...state,
            loading: { ...state.loading, page: true },
            location: {
              ...state.location,
              title: 'Legislation',
            },
          }, combineEffects([
            changePageTitle('Legislation'),
            fetchUserMeasures(state.user)
          ])]
        default:
          return [state]
      }
    case 'measure:votePowerUpdated':
      return [{
        ...state,
        measures: {
          ...state.measures,
          [event.shortId]: {
            ...state.measures[event.shortId],
            votePower: event.votePower,
          },
        },
      }]
    case 'measure:received':
    case 'measure:updated':
      if (!event.measure) {
        return [{ ...state, loading: {}, location: { ...state.location, status: 404 } }]
      }
      return [{
        ...state,
        loading: {
          ...state.loading,
          comments: state.location.query.tab !== 'votes',
          votes: state.location.query.tab === 'votes',
        },
        location: {
          ...state.location,
          title: isMeasureDetailPage(state.location.route) ? `${hideLegNameSocial ? '' : `${event.measure.legislature_name}: `}${event.measure.title}` : state.location.title,
          ogImage: isMeasureDetailPage(state.location.route) && measureOgImage(event.measure),
        },
        measures: {
          ...state.measures,
          [event.measure.short_id]: {
            ...state.measures[event.measure.short_id],
            ...event.measure,
            votes: state.measures[event.measure.short_id] && state.measures[event.measure.short_id].votes || [],
            comments: state.measures[event.measure.short_id] && state.measures[event.measure.short_id].comments || [],
          },
        },
      }, combineEffectsInSeries([
        changePageTitle(
          isMeasureDetailPage(state.location.route) ? `${event.measure.legislature_name}: ${event.measure.title}` : state.location.title
        ),
        fetchMeasureDetails(event.measure, state),
        (state.location.query.tab === 'votes' ? fetchVotes : fetchComments)(event.measure, state),
      ])]
    case 'measure:detailsReceived':
      return [{
        ...state,
        loading: { ...state.loading, measure: false, form: false },
        measures: {
          ...state.measures,
          [event.measure.short_id]: {
            ...state.measures[event.measure.short_id],
            ...event.measure,
            voteCounts: event.voteCounts,
            topYea: event.topYea ? event.topYea.id : null,
            topNay: event.topNay ? event.topNay.id : null,
            votePower: event.votePower ? event.votePower : (state.measures[event.measure.short_id] && state.measures[event.measure.short_id].votePower),
            commentCount: event.commentCount,
          },
        },
      }]
    case 'measure:commentsRequested':
      return [{
        ...state,
        loading: { ...state.loading, comments: true },
      }, fetchComments(event.measure, state)]
    case 'measure:commentsReceived':
      return [{
        ...state,
        loading: { ...state.loading, page: false, comments: false },
        measures: {
          ...state.measures,
          [event.measure.short_id]: {
            ...state.measures[event.measure.short_id],
            // only store ids on measure to keep one vote object shared by various views
            comments: event.votes.map((vote) => vote.id),
            commentsPagination: event.pagination,
          },
        },
        votes: event.votes.reduce((votes, vote) => {
          votes[vote.id] = { ...votes[vote.id], ...vote }
          return votes
        }, state.votes),
      }]
    case 'measure:votesRequested':
      return [{
        ...state,
        loading: { ...state.loading, votes: true },
      }, fetchVotes(event.measure, state)]
    case 'measure:votesReceived':
      return [{
        ...state,
        loading: { ...state.loading, page: false, votes: false },
        measures: {
          ...state.measures,
          [event.measure.short_id]: {
            ...state.measures[event.measure.short_id],
            // only store ids on measure to keep one vote object shared by various views
            votes: event.votes.map((vote) => vote.id),
            votesPagination: event.pagination,
          },
        },
        votes: event.votes.reduce((votes, vote) => {
          votes[vote.id] = { ...votes[vote.id], ...vote }
          return votes
        }, state.votes),
      }]
    case 'measure:receivedList':
      return [{
        ...state,
        loading: { ...state.loading, page: false, measures: false },
        measures: {
          ...state.measures,
          ...event.measures.reduce((b, a) => Object.assign(b, { [a.short_id]: a }), {}),
        },
        measuresByUrl: {
          [state.location.url]: event.measures.map(({ short_id }) => short_id),
        },
      }]
    case 'measure:voteFormActivated':
      if (!event.measure) return [state]
      return [{
        ...state,
        measures: {
          ...state.measures,
          [event.measure.short_id]: {
            ...state.measures[event.measure.short_id],
            showVoteForm: true,
          },
        },
      }, combineEffects([preventDefault(event.event), scrollVoteFormIntoView, selectVotePosition(event.position)])]
    case 'measure:voteFormToggled':
      if (!event.measure) return [state]
      return [{
        ...state,
        measures: {
          ...state.measures,
          [event.measure.short_id]: {
            ...state.measures[event.measure.short_id],
            showVoteForm: !state.measures[event.measure.short_id].showVoteForm,
          },
        },
      }, combineEffects([preventDefault(event.event), scrollVoteFormIntoView])]
    case 'measure:toggleSummaryExpanded':
      return [{
        ...state,
        measures: {
          ...state.measures,
          [event.measure.short_id]: {
            ...state.measures[event.measure.short_id],
            expanded: !state.measures[event.measure.short_id].expanded,
          },
        },
      }, preventDefault(event.event)]
    case 'measure:deleteFormSubmitted':
      return [state, combineEffects([
        preventDefault(event.event),
        confirmDeleteMeasure(event.measure)
      ])]
    case 'measure:deleteConfirmed':
      return [state, deleteMeasure(event.measure, state.user)]
    case 'measure:deleted':
      return [{
        ...state,
        measures: Object.keys(state.measures).reduce((b, a) => {
          if (a !== event.measure.short_id) b[a] = state.measures[a]
          return b
        }, {}),
      }]
    case 'measure:editFormError':
      return [{ ...state, error: event.error }]
    case 'measure:editFormSaved':
      return [{
        ...state,
        loading: { ...state.forms, editMeasure: true },
        forms: { ...state.forms, editMeasure: {}, editMeasureShortId: null },
        measures: Object.values(state.measures).reduce((measures, measure) => {
          if (event.oldShortId !== measure.short_id) {
            measures[measure.short_id] = measure
          }
          return measures
        }, {}),
      }, saveMeasure(state.measures[state.location.params.shortId], event, state)]
    case 'measure:editFormChanged':
      return [{ ...state, forms: { ...state.forms, editMeasure: event } }]
    case 'measure:editFormShortIdChanged':
      return [{ ...state, forms: { ...state.forms, editMeasureShortId: event.shortId } }]
    case 'measure:voteCSVRequested':
      return [{
        ...state,
        loading: { ...state.loading, voteReport: true },
      }, combineEffects([preventDefault(event.event), fetchVotesReport(event.measure, state)])]
    case 'measure:voteCSVReceivedChunk':
      return [{
        ...state,
        measures: {
          [event.measure.short_id]: {
            ...state.measures[event.measure.short_id],
            csv: (state.measures[event.measure.short_id] && state.measures[event.measure.short_id].csv || '') + event.csv,
          },
        },
      }]
    case 'measure:voteCSVReceived':
      return [{
        ...state,
        loading: { ...state.loading, voteReport: false },
      }, () => download(state.measures[event.measure.short_id].csv, `${event.measure.short_id}-votes.csv`, 'text/csv;encoding=utf-8')]
    default:
      return [state]
  }
}

const fetchVotesReport = (measure, state, pagination = { offset: 0, limit: 500 }) => (dispatch) => {
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

const confirmDeleteMeasure = (measure) => (dispatch) => {
  const confirmed = window.confirm('Are you sure you want to delete? This cannot be undone!')
  if (confirmed) {
    dispatch({ type: 'measure:deleteConfirmed', measure })
  }
}

const deleteMeasure = (measure, user) => (dispatch) => {
  const redirectTo = measure.type === 'petition' ? '/petitions/yours' : '/legislation/yours'
  return api(dispatch, `/measures?id=eq.${measure.id}`, {
    method: 'DELETE',
    user,
  })
  .then(() => dispatch({ type: 'redirected', status: 302, url: redirectTo }))
  .then(() => dispatch({ type: 'measure:deleted', measure }))
}

const fetchUserMeasures = (user) => (dispatch) => {
  return api(dispatch, `/measures_detailed?author_id=eq.${user.id}&order=created_at.desc`, { user })
    .then((measures) => dispatch({ type: 'measure:receivedList', measures }))
}

const saveMeasure = (measure, { event, oldShortId, ...form }, state) => (dispatch) => {
  if (event) event.preventDefault()
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
  .then(() => fetchMeasure(form.short_id, state)(dispatch))
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
  .then(() => fetchMeasure(form.short_id, state)(dispatch))
  .then(() => {
    dispatch({ type: 'redirected', status: 303, url: `/${user.username}/${form.short_id}` })
  })
  .catch(handleError(dispatch))
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


const scrollVoteFormIntoView = () => {
  const elem = document.getElementById('measure-vote-form')

  if (elem) {
    const scrollY = elem.getBoundingClientRect().top + window.scrollY
    if (scrollY) {
      window.scrollTo(0, scrollY, { behavior: 'smooth' })
    }
  }
}

const selectVotePosition = (position) => () => {
  if (position) {
    setTimeout(() => {
      document.querySelector(`input[type="radio"][name="position"][value="${position}"]`).checked = true
    }, 20)
  }
}

const isMeasureDetailPage = (route) => {
  return route === '/legislation/:shortId' || route === '/nominations/:shortId' || route === '/:username/:shortId' || route === '/:username/:shortId/edit'
}

const hideLegNameSocial = (l) => (
  l.short_id === 'press-pause-on-227m-new-jail'
)

const measureOgImage = (measure) => {
  const dbImage = measure.image_name ? `${ASSETS_URL}/measure-images/${measure.image_name}` : ''
  const isCity = ~measure.legislature_name.indexOf(',')
  const inlineImageMatch = measure && measure.summary && measure.summary.match(/\bhttps?:\/\/\S+\.(png|jpg|jpeg|gif)\b/i)
  const inlineImage = inlineImageMatch && inlineImageMatch[0]
  const measureImage = !isCity ? `${ASSETS_URL}/legislature-images/${measure.legislature_name}.png` : ''
  return dbImage || inlineImage || measureImage
}
