const { NODE_ENV, WWW_URL } = process.env
const { api, makePoint } = require('./helpers')
const atob = require('atob')
const fetch = require('isomorphic-fetch')

exports.fetchConstituentVotes = function fetchConstituentVotes(measure, office_ids) {
  const { id, short_id } = measure
  const officeParam = office_ids.length ? `&or.(office_id.in.(${office_ids.join(',')},office_id.is.null)` : '&limit=1'
  return this.api(`/measure_votes?measure_id=eq.${id}${officeParam}`).then((results) => {
    const votes = results[0] || {}
    const measures = this.state.measures || {}
    this.setState({
      measures: {
        ...measures,
        [short_id]: {
          ...measures[short_id],
          ...votes
        },
      },
    })
  })
}

const fetchOffices = exports.fetchOffices = ({ location = {}, storage, user }) => (dispatch) => {
  const address = user && user.address

  if (address) {
    return api('/user_offices', { storage })
    .then((offices) => dispatch({ type: 'officesReceived', offices: offices || [] }))
    .catch((error) => dispatch({ type: 'error', error }))
  }

  let ip = location.ip

  if (!ip || (ip === '::1' && NODE_ENV !== 'production')) ip = '198.27.235.190'

  return fetch(`${WWW_URL}/rpc/geoip/${ip}`, {
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-cache',
    mode: 'no-cors',
  })
  .then(response => response.json())
  .then((geoip) => {
    if (!geoip) {
      return dispatch({ type: 'officesReceived', offices: [] })
    }
    return api('/rpc/point_to_offices', {
      method: 'POST',
      body: JSON.stringify({
        lon: Number(geoip.lon),
        lat: Number(geoip.lat),
        city: `${geoip.city}, ${geoip.region}`,
        state: geoip.region,
      }),
    })
    .then((offices) => {
      dispatch({ type: 'officesReceived', offices, geoip })
    })
  })
  .catch((error) => {
    console.error(error)
    dispatch({ type: 'error', error })
  })
}

exports.updateNameAndAddress = ({ addressData, nameData, storage, user }) => (dispatch) => {
  // Update users name
  return api(`/users?select=id&id=eq.${user.id}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(nameData),
    storage,
  })
  // Update users address
  .then(() => {
    if (!addressData.lon) {
      return geocode(addressData.address).then((newAddressData) => updateAddress(newAddressData, user, storage))
    }
    return updateAddress(addressData, user, storage)
  })
  .catch((error) => {
    console.log(error)
  })
  .then(() => {
    const user = { ...nameData, address: addressData }
    dispatch({ type: 'userUpdated', user })
    return fetchOffices({ storage, user })(dispatch)
  })
}

const updateAddress = (addressData, user, storage) => {
  return api(`/user_addresses?select=id&user_id=eq.${user.id}`, {
    method: user && user.address && user.address.address ? 'PATCH' : 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(user && user.address && user.address.address ? addressData : { ...addressData, user_id: user.id }),
    storage,
  })
}

const geocode = (address) => {
  return fetch(`/rpc/geocode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address }),
  })
  .then((res) => res.json())
  .then(([place]) => {
    const newAddressData = { address }
    const geocoords = place.geometry.location
    newAddressData.geocoords = makePoint(geocoords.lng, geocoords.lat)
    newAddressData.city = place.address_components.filter((item) => {
      return item.types.some((type) => type === 'locality')
    }).map((item) => item.long_name).shift() || ''
    newAddressData.state = place.address_components.filter((item) => {
      return item.types.some((type) => type === 'administrative_area_level_1')
    }).map((item) => item.short_name).shift() || ''
    return newAddressData
  })
  .catch((error) => {
    console.log(error)
    return { address }
  })
}

exports.signIn = ({ location, channel = 'join-page', email, redirectTo = '/get_started', storage }) => (dispatch) => {
  const phone_number = location.query.ph ? atob(location.query.ph) : null
  const proxying_user_id = storage.get('proxying_user_id')
  const vote_position = storage.get('vote_position')
  const endorsed_vote_id = storage.get('endorsed_vote_id')
  const endorsed_measure_id = storage.get('endorsed_measure_id')
  const device_desc = location.userAgent || 'Unknown'

  return api('/totp?select=device_id,first_seen', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      email: email.toLowerCase().trim(),
      phone_number,
      device_desc,
      channel,
    }),
  })
  .then((results) => results[0])
  .then(({ device_id, first_seen }) => {
    if (first_seen) {
      return api('/sessions?select=refresh_token,user_id,jwt', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({ device_id, device_desc }),
      }).then((results) => results[0])
      .then(({ jwt, refresh_token, user_id }) => {
        const oneYearFromNow = new Date(Date.now() + (365 * 24 * 60 * 60 * 1000))

        storage.set('jwt', jwt, { expires: oneYearFromNow })
        storage.set('refresh_token', refresh_token, { expires: oneYearFromNow })
        storage.set('user_id', user_id, { expires: oneYearFromNow })

        return api(`/users?select=id,email,first_name,last_name,username,verified,voter_status,update_emails_preference,address:user_addresses(id,address)&id=eq.${user_id}`, {
          storage,
        })
        .then(users => {
          const proxy_to = location.query.proxy_to

          dispatch({ type: 'userUpdated', user: { ...users[0], address: users[0].address[0] }, jwt })

          if (proxying_user_id) {
            return api('/delegations', {
              method: 'POST',
              headers: { Prefer: 'return=representation' }, // returns created delegation in response
              body: JSON.stringify({
                from_id: user_id,
                to_id: proxying_user_id,
                delegate_rank: 0,
              }),
              storage,
            })
            .then(() => {
              storage.set('proxied_user_id', proxying_user_id)
              storage.unset('proxying_user_id')
              return dispatch({ type: 'redirected', url: redirectTo, status: 303 })
            })
            .catch(error => {
              console.log(error)
              return dispatch({ type: 'redirected', url: redirectTo, status: 303 })
            })
          }

          if (proxy_to) {
            return api('/delegations', {
              method: 'POST',
              headers: { Prefer: 'return=representation' }, // returns created delegation in response
              body: JSON.stringify({
                from_id: user_id,
                username: proxy_to,
                delegate_rank: 0,
              }),
              storage,
            })
            .then(() => {
              storage.set('proxied_user_id', proxying_user_id)
              storage.unset('proxying_user_id')
              return dispatch({ type: 'redirected', url: redirectTo, status: 303 })
            })
            .catch(error => {
              console.log(error)
              return dispatch({ type: 'redirected', url: redirectTo, status: 303 })
            })
          }

          if (endorsed_vote_id) {
            return api(`/endorsements?user_id=eq.${user_id}`, {
              method: 'POST',
              body: JSON.stringify({ user_id, vote_id: endorsed_vote_id, measure_id: endorsed_measure_id }),
              storage,
            })
            .then(() => {
              storage.unset('endorsed_vote_id')
              storage.unset('endorsed_measure_id')
              return dispatch({ type: 'redirected', url: redirectTo, status: 303 })
            })
          }

          if (vote_position) {
            return api('/rpc/vote', {
              method: 'POST',
              body: JSON.stringify({
                user_id,
                measure_id: storage.get('vote_bill_id'),
                vote_position,
                comment: storage.get('vote_comment') || null,
                public: storage.get('vote_public') === 'true',
              }),
              storage,
            })
            .then(() => {
              if (typeof window === 'object' && window._loq) window._loq.push(['tag', 'Voted'])
              storage.unset('vote_position')
              storage.unset('vote_bill_id')
              storage.unset('vote_public')
              storage.unset('vote_comment')
              return dispatch({ type: 'redirected', url: redirectTo, status: 303 })
            })
            .catch(error => {
              console.log(error)
              return dispatch({ type: 'redirected', url: redirectTo, status: 303 })
            })
          }

          dispatch({ type: 'redirected', url: redirectTo, status: 303 })
          return users[0]
        })
      })
    }

    storage.set('sign_in_email', email)
    storage.set('device_id', device_id)

    dispatch({ type: 'redirected', url: '/sign_in/verify', status: 303 })
  })
  .catch((error) => {
    console.log(error)
    if (~error.message.indexOf('constraint "email')) {
      error.message = 'Invalid email address'
    } else if (error.message !== 'Please wait 10 seconds and try again') {
      error.message = `There was a problem on our end. Please try again and let us know if you're still encountering a problem.`
    }
    dispatch({ type: 'error', error })
  })
}
