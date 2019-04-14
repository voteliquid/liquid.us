const legislatorProfile = require('./legislator-profile-page')
const userProfile = require('./user-profile-page')

module.exports = (state, dispatch) => {
  const { location, profiles = {} } = state
  const profile = profiles[location.params.username.toLowerCase()]
  return (profile.elected_office_name ? legislatorProfile : userProfile)(state, dispatch)
}
