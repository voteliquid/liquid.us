const { ASSETS_URL } = process.env
const { api, combineEffects, combineEffectsInSeries, preventDefault, redirect } = require('../helpers')
const { fetchMeasure, fetchMeasureVotes } = require('../effects/measure')
const { changePageTitle } = require('../effects/page')

module.exports = (event, state) => {
  const query = state.location.query
  switch (event.type) {
    case 'pageLoaded':
      switch (state.location.route) {
        case '/legislation':
          return [{
            ...state,
            loading: { ...state.loading, page: !state.browser, measures: true },
            location: {
              ...state.location,
              title: 'Legislation',
              ogImage: query.legislature && query.legislature.length === 2 && `${ASSETS_URL}/legislature-images/${query.legislature}.png`
            },
          }, fetchMeasures({ hide_direct_votes: state.cookies.hide_direct_votes, ...state.location.query }, state.user)]
        case '/legislation/:shortId':
        case '/nominations/:shortId':
        case '/:username/:shortId':
          return [{
            ...state,
            loading: { ...state.loading, page: true },
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
            fetchMeasureVotes(state.location.params.shortId, state.location.query.order, state.location.query.position, state.user),
            fetchMeasure(state.location.params.shortId, state.offices, state.user),
            state.location.hash === 'measure-vote-form' && scrollVoteFormIntoView,
          ])]
        case '/legislation/propose':
        case '/:username/:shortId/edit':
          if (!state.user) return [state, redirect('/sign_in')]
          return [{
            ...state,
            location: {
              ...state.location,
              title: 'Propose Legislation',
            },
            loading: { ...state.loading, page: true },
            forms: { ...state.forms, editMeasureShortId: null },
          }, combineEffects([
            changePageTitle('Propose Legislation'),
            fetchUserMeasure(state.location.params.shortId, state.user)
          ])]
        case '/legislation/yours':
          if (!state.user) return [state, redirect('/sign_in')]
          return [{
            ...state,
            loading: { ...state.loading, page: true },
            location: {
              ...state.location,
              title: 'Proposed Legislation',
            },
          }, combineEffects([
            changePageTitle('Proposed Legislation'),
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
    case 'measure:userMeasureReceived':
      if (!event.measure) {
        return [{ ...state, loading: { ...state.loading, page: false, measure: false } }]
      }
      return [{
        ...state,
        loading: { ...state.loading, page: false, measure: false },
        measures: {
          ...state.measures,
          [event.measure.short_id]: {
            ...state.measures[event.measure.short_id],
            ...event.measure,
            votes: state.measures[event.measure.short_id] ? (state.measures[event.measure.short_id].votes || []) : [],
            // only store ids on measure to keep one vote object shared by various views
            topYea: event.topYea ? event.topYea.id : null,
            topNay: event.topNay ? event.topNay.id : null,
            votePower: event.votePower ? event.votePower : (state.measures[event.measure.short_id] && state.measures[event.measure.short_id].votePower),
          },
        },
        votes: (event.votes || []).concat([event.topYea, event.topNay].filter(v => v)).reduce((votes, vote) => {
          votes[vote.id] = { ...votes[vote.id], ...vote }
          return votes
        }, state.votes),
      }]
    case 'measure:received':
    case 'measure:updated':
      if (!event.measure) {
        return [{
          ...state,
          loading: { ...state.loading, page: false, measure: false },
          location: { ...state.location, status: 404 }
        }]
      }
      return [{
        ...state,
        loading: { ...state.loading, page: isMeasureDetailPage(state.location.route) ? false : state.loading.page, measure: false },
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
            votes: state.measures[event.measure.short_id] ? (state.measures[event.measure.short_id].votes || []) : [],
            // only store ids on measure to keep one vote object shared by various views
            topYea: event.topYea ? event.topYea.id : null,
            topNay: event.topNay ? event.topNay.id : null,
            votePower: event.votePower ? event.votePower : (state.measures[event.measure.short_id] && state.measures[event.measure.short_id].votePower),
          },
        },
        votes: (event.votes || []).concat([event.topYea, event.topNay].filter(v => v)).reduce((votes, vote) => {
          votes[vote.id] = { ...votes[vote.id], ...vote }
          return votes
        }, state.votes),
      }, changePageTitle(isMeasureDetailPage(state.location.route) ? `${event.measure.legislature_name}: ${event.measure.title}` : state.location.title)]
    case 'measure:measureDeleted':
    console.log('is this happening')
      return [state, combineEffects([preventDefault(event.event), deleteMeasure(state)])]
    case 'measure:votesReceived':
      return [{
        ...state,
        loading: { ...state.loading, measure: false, vote: false },
        measures: {
          ...state.measures,
          [event.shortId]: {
            ...state.measures[event.shortId],
            // only store ids on measure to keep one vote object shared by various views
            votes: event.votes.map((vote) => vote.id),
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
      }, combineEffects([preventDefault(event.event), scrollVoteFormIntoView])]
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
    case 'measure:editFormError':
      return [{ ...state, error: event.error }]
    case 'measure:editFormSaved':
      return [{
        ...state,
        forms: { ...state.forms, editMeasure: {}, editMeasureShortId: null },
        measures: Object.values(state.measures).reduce((measures, measure) => {
          if (event.oldShortId !== measure.short_id) {
            measures[measure.short_id] = measure
          }
          return measures
        }, {}),
      }, saveMeasure(state.measures[state.location.params.shortId], event, state.user)]
    case 'measure:editFormChanged':
      return [{ ...state, forms: { ...state.forms, editMeasure: event } }]
    case 'measure:editFormShortIdChanged':
      return [{ ...state, forms: { ...state.forms, editMeasureShortId: event.shortId } }]
    default:
      return [state]
  }
}

const fetchMeasures = (params, user) => (dispatch) => {
  const terms = params.terms && params.terms.replace(/[^\w\d ]/g, '').replace(/(hr|s) (\d+)/i, '$1$2').replace(/(\S)\s+(\S)/g, '$1 & $2')
  const fts = terms ? `&tsv=fts(simple).${encodeURIComponent(terms)}` : ''

  const orders = {
    upcoming: '&status=not.eq.Introduced&introduced_at=not.is.null&failed_lower_at=is.null&failed_upper_at=is.null&or=(passed_lower_at.is.null,passed_upper_at.is.null,and(passed_lower_at.is.null,passed_upper_at.is.null))&order=next_agenda_action_at.asc.nullslast,next_agenda_begins_at.asc.nullslast,next_agenda_category.asc.nullslast,last_action_at.desc.nullslast,number.desc',
    new: '&introduced_at=not.is.null&order=introduced_at.desc,number.desc',
    proposed: '&introduced_at=is.null&order=created_at.desc,title.asc',
  }

  const order = orders[params.order || 'upcoming']

  const hide_direct_votes = params.hide_direct_votes
  const hide_direct_votes_params = hide_direct_votes === 'on' ? '&or=(delegate_rank.is.null,delegate_rank.neq.-1)' : ''
  const policy_area_query = params.policy_area ? `&policy_area=eq.${params.policy_area}` : ''

  const legislature = `&legislature_name=eq.${params.legislature || 'U.S. Congress'}`

  const fields = [
    'title', 'number', 'type', 'short_id', 'id', 'status',
    'sponsor_username', 'sponsor_first_name', 'sponsor_last_name',
    'introduced_at', 'last_action_at', 'next_agenda_begins_at', 'next_agenda_action_at',
    'summary', 'legislature_name', 'created_at', 'author_first_name', 'author_last_name', 'author_username', 'policy_area'
  ]
  if (user) fields.push('vote_position', 'delegate_rank', 'delegate_name')
  const url = `/measures_detailed?select=${fields.join(',')}${hide_direct_votes_params}${policy_area_query}${fts}${legislature}&type=not.eq.nomination${order}&limit=40`

  return api(dispatch, url, { user })
    .then((measures) => dispatch({ type: 'measure:receivedList', measures }))
    .catch((error) => {
      dispatch({ type: 'error', error })
      dispatch({ type: 'measure:receivedList', measures: [] })
    })
}

const fetchUserMeasures = (user) => (dispatch) => {
  return api(dispatch, `/measures_detailed?author_id=eq.${user.id}&order=created_at.desc`, { user })
    .then((measures) => dispatch({ type: 'measure:receivedList', measures }))
}

const fetchUserMeasure = (shortId, user) => (dispatch) => {
  if (!shortId) {
    return dispatch({ type: 'measure:userMeasureReceived', measure: null })
  }
  return api(dispatch, `/measures_detailed?author_id=eq.${user.id}&short_id=eq.${shortId}`, { user }).then(([measure]) => {
    if (measure) {
      dispatch({ type: 'measure:userMeasureReceived', measure })
    } else {
      dispatch({ type: 'redirected', status: 302, url: `/legislation/${measure.short_id}` })
    }
  })
}

const saveMeasure = (measure, { event, oldShortId, ...form }, user) => (dispatch) => {
  if (event) event.preventDefault()
  return (measure && measure.id ? updateMeasure : insertMeasure)(measure, form, user)(dispatch)
}

const insertMeasure = (measure, form, user) => (dispatch) => {
  return api(dispatch, '/measures', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      author_id: user.id,
      legislature_id: form.legislature_id,
      title: form.title,
      summary: form.summary,
      chamber: 'Lower',
      type: 'bill',
      short_id: form.short_id.toLowerCase(),
    }),
    user,
  })
  .then(() => api(dispatch, `/measures_detailed?short_id=eq.${form.short_id}`, { user }))
  .then(([measure]) => dispatch({ type: 'measure:updated', measure }))
  .then(() => dispatch({ type: 'redirected', status: 303, url: `/legislation/yours` }))
  .catch(handleError(dispatch))
}

const updateMeasure = (measure, form, user) => (dispatch) => {
  return api(dispatch, `/measures?id=eq.${measure.id}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ ...form, short_id: form.short_id.toLowerCase() }),
    user,
  })
  .then(() => api(dispatch, `/measures_detailed?id=eq.${measure.id}`, { user }))
  .then(([measure]) => {
    dispatch({ type: 'measure:updated', measure })
    dispatch({ type: 'redirected', status: 303, url: `/${user.username}/${measure.short_id}` })
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
const deleteMeasure = (state) => (dispatch) => {
  const { user } = state

  const measure = state.measures[state.location.params.shortId]
  if (!window.confirm(`Are you sure you want to remove ${measure.title}?`)) return

  return api(dispatch, `/measures?id=eq.${measure.id}`, {
    method: 'DELETE',
    user,
  })
  .then(() => {
    return [state, redirect(`/${user.username}`)]
  })
  .catch(handleError(dispatch))
}
