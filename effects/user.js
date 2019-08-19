const { WWW_URL } = process.env
const { api, makePoint } = require('../helpers')
const fetch = require('isomorphic-fetch')
const { fetchOfficesFromAddress, fetchOfficesFromIP } = require('./office')

exports.fetchUser = (id, jwt, refresh_token, ip) => (dispatch) => {
  if (id && jwt) {
    return api(dispatch, `/users?select=id,about,intro_video_url,email,first_name,last_name,username,phone_verified,inherit_votes_public,voter_status,update_emails_preference,is_admin,address:user_addresses(*)&id=eq.${id}`, { user: { id, jwt, refresh_token } })
    .then(([result]) => {
      if (result) {
        const user = { ...result, address: result.address[0], jwt, refresh_token }
        return api(dispatch, `/votes?user_id=eq.${id}&delegate_rank=eq.-1&order=updated_at.desc`, { user }).then(([vote]) => {
          dispatch({
            type: 'user:received',
            user: { ...user, last_vote_public: vote ? vote.public : true },
          })
          return user && user.address ? fetchOfficesFromAddress(user)(dispatch) : fetchOfficesFromIP(ip)(dispatch)
        })
      }
    })
    .catch((error) => dispatch({ type: 'error', error }))
  }
}


exports.updateNameAndAddress = ({ addressData, nameData, user }) => (dispatch) => {
  // Update users name
  return api(dispatch, `/users?select=id&id=eq.${user.id}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(nameData),
    user,
  })
  // Update users address
  .then(() => {
    if (!addressData.lon) {
      return geocode(addressData.address).then((newAddressData) => updateAddress(newAddressData, user, dispatch))
    }
    return updateAddress(addressData, user, dispatch)
  })
  .then(() => {
    const user = { ...nameData, address: addressData }
    dispatch({ type: 'user:updated', user })
  })
  .catch((error) => dispatch({ type: 'error', error }))
}

const updateAddress = exports.updateAddress = (addressData, user, dispatch) => {
  return api(dispatch, `/user_addresses?select=id&user_id=eq.${user.id}`, {
    method: user && user.address && user.address.address ? 'PATCH' : 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(user && user.address && user.address.address ? addressData : { ...addressData, user_id: user.id }),
    user,
  })
}

const geocode = exports.geocode = (address) => {
  return fetch(`${WWW_URL}/rpc/geocode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address }),
  })
  .then((res) => res.json())
  .then(([place]) => {
    if (!place) return Promise.reject(new Error(`Could not find address. Try including a city and state, or contact support if the address includes city and state.`))
    const newAddressData = { address }
    const geocoords = place.geometry.location
    newAddressData.formatted_address = place.formatted_address
    newAddressData.geocoords = makePoint(geocoords.lng, geocoords.lat)
    newAddressData.locality = place.address_components.filter((item) => {
      return item.types.some((type) => type === 'locality')
    }).map((item) => item.long_name).shift() || ''
    newAddressData.administrative_area_level_1 = place.address_components.filter((item) => {
      return item.types.some((type) => type === 'administrative_area_level_1')
    }).map((item) => item.long_name).shift() || ''
    newAddressData.administrative_area_level_2 = place.address_components.filter((item) => {
      return item.types.some((type) => type === 'administrative_area_level_2')
    }).map((item) => item.long_name).shift() || ''
    newAddressData.postal_code = place.address_components.filter((item) => {
      return item.types.some((type) => type === 'postal_code')
    }).map((item) => item.long_name).shift() || ''
    newAddressData.country = place.address_components.filter((item) => {
      return item.types.some((type) => type === 'country')
    }).map((item) => item.short_name).shift() || ''
    return newAddressData
  })
}
