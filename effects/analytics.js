const log = (tag) => {
  if (typeof window === 'object') {
    // https://help.luckyorange.com/article/126-tagging-with-javascript
    if (!window._loq) {
      window._loq = []
    }
    window._loq.push(['tag', tag])
  }
}

exports.logVote = () => log('Voted')

exports.logPublicProfileCreated = () => log('Created Public Profile')

exports.logEndorsement = () => {
  log('Voted')
  log('Endorsed')
}

exports.logUnendorsement = () => log('Unendorsed')

exports.logAddedProxy = () => log('Added Proxy')

exports.logUser = (user) => () => {
  if (typeof window === 'object') {
    // https://help.luckyorange.com/article/41-passing-in-custom-user-data
    window._loq = window._loq || []
    window._loq.push(['custom', {
      name: `${user.first_name} ${user.last_name}`,
      user_id: user.id,
    }])
  }
}
