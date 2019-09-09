const { avatarURL, html } = require('../helpers')

module.exports = (state, dispatch) => {
  const { location, measures, votes } = state
  const measure = measures[location.params.shortId]
  const latestVotes = (measure.votes || []).map((id) => votes[id]).slice(0, 12)
  return html`
    <div onconnected=${() => dispatch({ type: 'measure:votesRequested', measure, })}>
      ${latestVotes.map((vote) => {
        return html`
          <div class="is-flex" style="padding: .5em 0;">
            <div style="margin-right: .5em;">
              <figure class="image is-24x24">
                <img src="${avatarURL(vote.user)}" />
              </figure>
            </div>
            <div>
              <p>${vote.user ? vote.user.name : '[private]'}</p>
            </div>
          </div>
        `
      })}
    </div>
  `
}
