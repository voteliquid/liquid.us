const { api } = require('../helpers')

exports.fetchMeasure = (shortId, { user }) => (dispatch) => {
  return api(dispatch, `/measures_detailed?short_id=eq.${shortId}`, { user })
    .then(([measure]) => {
      dispatch({ type: 'cookieSet', key: 'measure_title', value: measure.title })
      dispatch({ type: 'cookieSet', key: 'measure_id', value: measure.id })
      dispatch({ type: 'cookieSet', key: 'measure_short_id', value: measure.short_id })
    })
  }
