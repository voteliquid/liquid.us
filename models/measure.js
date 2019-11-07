const { ASSETS_URL } = process.env
const { combineEffects, combineEffectsInSeries, download, preventDefault, redirect } = require('../helpers')
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
            importEffect('fetchMeasure', state.location.params.shortId, state),
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
            importEffect('fetchMeasure', state.location.params.shortId, state)
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
            importEffect('fetchUserMeasures', state.user)
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
            importEffect('fetchUserMeasures', state.user)
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
          description: `Sign the peition to be heard by the ${event.measure.legislature_name}.`,
          ogTitle: event.measure.title,
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
      }, combineEffects([
        changePageTitle(
          isMeasureDetailPage(state.location.route) ? `${event.measure.legislature_name}: ${event.measure.title}` : state.location.title
        ),
        combineEffectsInSeries([
          importEffect('fetchMeasureDetails', event.measure, state),
          importEffect(
            state.location.query.tab === 'votes'
              ? 'fetchVotes'
              : state.location.query.tab === 'updates'
              ? 'fetchUpdates'
              : 'fetchComments',
            event.measure,
            state
          ),
        ]),
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
      }, importEffect('fetchComments', event.measure, state)]
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
      }, importEffect('fetchVotes', event.measure, state)]
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
            showVoteForm: !(state.measures[event.measure.short_id] && state.measures[event.measure.short_id].showVoteForm),
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
        importEffect('confirmDeleteMeasure', event.measure)
      ])]
    case 'measure:deleteConfirmed':
      return [state, importEffect('deleteMeasure', event.measure, state.user)]
    case 'measure:deleted':
      return [{
        ...state,
        measures: Object.keys(state.measures).reduce((b, a) => {
          if (a !== event.measure.short_id) b[a] = state.measures[a]
          return b
        }, {}),
      }]
    case 'measure:error':
    case 'measure:editFormError':
      return [{ ...state, loading: { ...state.loading, form: false }, error: event.error }]
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
      }, combineEffects([
        preventDefault(event.event),
        importEffect('saveMeasure', state.measures[state.location.params.shortId], event, state),
      ])]
    case 'measure:editFormChanged':
      return [{ ...state, forms: { ...state.forms, editMeasure: event } }]
    case 'measure:editFormShortIdChanged':
      return [{ ...state, forms: { ...state.forms, editMeasureShortId: event.shortId } }]
    case 'measure:voteCSVRequested':
      return [{
        ...state,
        loading: { ...state.loading, voteReport: true },
      }, combineEffects([preventDefault(event.event), importEffect('fetchVotesReport', event.measure, state)])]
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
    case 'measure:notificationsToggled':
      return [{
        ...state,
        measures: {
          [event.measure.short_id]: {
            ...state.measures[event.measure.short_id],
            notifications: !state.measures[event.measure.short_id],
          },
        },
      }, combineEffects([preventDefault(event.event), importEffect('toggleNotifications', event, state)])]
    case 'measure:toggledUpdateForm':
      return [{
        ...state,
        measures: {
          [event.measure.short_id]: {
            ...state.measures[event.measure.short_id],
            showUpdateForm: !state.measures[event.measure.short_id].showUpdateForm,
            updateNotification: null,
          },
        },
      }, preventDefault(event.event)]
    case 'measure:updateNotificationDisplayed':
      return [{
        ...state,
        measures: {
          [event.measure.short_id]: {
            ...state.measures[event.measure.short_id],
            updateNotification: event.notification,
          },
        },
      }]
    case 'measure:updateNotificationDismissed':
      return [{
        ...state,
        measures: {
          [event.measure.short_id]: {
            ...state.measures[event.measure.short_id],
            updateNotification: null,
          },
        },
      }, preventDefault(event.event)]
    case 'measure:updateFormSubmitted':
      if (event.publish) {
        if (!window.confirm(`Publishing will send the update to your supporters. Are you sure you want to continue?`)) {
          return [state, preventDefault(event.event)]
        }
      }
      return [{
        ...state,
        loading: { ...state.loading, form: true },
        measures: {
          [event.measure.short_id]: {
            ...state.measures[event.measure.short_id],
            showUpdateForm: !event.publish,
          },
        },
      }, combineEffects([
        preventDefault(event.event),
        combineEffectsInSeries([
          importEffect('postUpdate', event, state),
          event.publish && redirect(`${state.location.path}?tab=updates`, 303),
        ]),
      ])]
    case 'measure:updateDeleted':
      return [{
        ...state,
        loading: { ...state.loading, form: true },
        measures: {
          [event.measure.short_id]: {
            ...state.measures[event.measure.short_id],
            showUpdateForm: false,
          },
        },
      }, combineEffects([preventDefault(event.event), importEffect('deleteUpdate', event, state)])]
    case 'measure:updatesRequested':
      return [{
        ...state,
        loading: { ...state.loading, updates: true },
      }, importEffect('fetchUpdates', event.measure, state)]
    case 'measure:updatesReceived':
      return [{
        ...state,
        loading: { ...state.loading, page: false, form: false, updates: false },
        measures: {
          [event.measure.short_id]: {
            ...state.measures[event.measure.short_id],
            showUpdateForm: !!state.location.query.edit,
            updates: event.updates,
          },
        },
      }]
    default:
      return [state]
  }
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
  return route === '/legislation/:shortId' || route === '/nominations/:shortId' || route === '/:username/:shortId' || route === '/:username/:shortId/edit' || route === '/:username/:shortId/votes/:voteId' || '/legislation/:shortId/votes/:voteId' || '/petitions/:shortId/votes/:voteId'
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

const importEffect = (name, ...args) => (dispatch) => {
  return import('../effects/measure').then((measureEffects) => {
    return (measureEffects.default || measureEffects)[name].apply(null, args)(dispatch)
  })
}
