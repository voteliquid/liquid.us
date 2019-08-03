const { api } = require('../helpers')

module.exports = (state) => (dispatch) => {
  const { cookies, location, user } = state

  api(dispatch, `/pageviews?select=id,fingerprint`, {
    method: 'POST',
    headers: {
      Prefer: `return=${cookies.fingerprint ? 'minimal' : 'representation'}`,
    },
    body: JSON.stringify({
      fingerprint: cookies.fingerprint ? cookies.fingerprint : undefined,
      url: location.url,
    }),
    user,
  })
  .then((pageviews) => {
    const oneYearFromNow = new Date(Date.now() + (365 * 24 * 60 * 60 * 1000))

    if (!cookies.fingerprint && pageviews[0]) {
      dispatch({
        type: 'cookieSet',
        key: 'fingerprint',
        value: pageviews[0].fingerprint,
        opts: { expires: oneYearFromNow },
      })
    }
  })
  .catch((error) => console.log(error))
}
