const { handleForm, html } = require('../helpers')
const activityIndicator = require('./activity-indicator')
const voteView = require('./vote')
const { icon } = require('@fortawesome/fontawesome-svg-core')
const { faCircle } = require('@fortawesome/free-regular-svg-icons/faCircle')
const { faCheck } = require('@fortawesome/free-solid-svg-icons/faCheck')
const { faTimes } = require('@fortawesome/free-solid-svg-icons/faTimes')

module.exports = (state, dispatch) => {
  const { loading, measure, yea, nay, user } = state
  const { vote } = measure
  return html`
    <div>
      <style>
        .vote-button-yea {
          border-radius: 4px 0 0 0;
        }
        .vote-button-nay {
          border-radius: 0 4px 0 0;
        }
        @media screen and (max-width: 800px) {
          .vote-button-yea {
            border-radius: 4px;
            margin-bottom: .5rem;
          }
          .vote-button-nay {
            border-radius: 4px;
            margin-bottom: .5rem;
          }
        }
      </style>
      ${voteButtons({ loading, measure }, dispatch)}
      <div class="columns is-gapless is-multiline is-marginless">
        <div class="column is-half" style="background-color: hsla(141, 71%, 97%, 1); color: #222;">
          <div style="padding: 1rem;">
            <h4 style="color: hsl(141, 80%, 38%); padding-bottom: 1rem;" class="${`${vote ? 'has-text-weight-semibold' : ''} has-text-centered`}">Top Argument In Favor</h4>
            ${loading.vote
              ? activityIndicator()
              : yea
                ? voteView({ measure, vote: yea, key: 'top-comment-yea', user }, dispatch)
                : noArgumentsMsg(measure, 'yea', dispatch)}
          </div>
        </div>
        <div class="column is-half" style="border-left: 1px solid white; background-color: hsla(348, 100%, 98%, 1); color: #222;">
          <div style="padding: 1rem;">
            <h4 style="padding-bottom: 1rem;" class="${`${vote ? 'has-text-weight-semibold' : ''} has-text-centered has-text-danger`}">Top Argument Against</h4>
            ${loading.vote
              ? activityIndicator()
              : nay
                ? voteView({ measure, vote: nay, user, key: 'top-comment-nay' }, dispatch)
                : noArgumentsMsg(measure, 'nay', dispatch)}
          </div>
        </div>
      </div>
      <hr style="margin: 0 0 2rem" />
    </div>
  `
}

const noArgumentsMsg = (measure, position, dispatch) => {
  return html`
    <p class="has-text-grey-light has-text-centered">
      No arguments ${position === 'yea' ? 'in favor' : 'against'} yet.
      ${!measure.vote || measure.vote.position !== position
        ? addArgumentLink(measure, position, dispatch)
        : ''}
    </p>
  `
}

const addArgumentLink = (measure, position, dispatch) => {
  return html`
    <span><a onclick=${(event) => dispatch({ type: 'measure:voteFormActivated', event, measure })} href="#" class="has-text-grey">Add one</a>.</span>
  `
}

const abstainButton = ({ loading, measure }, dispatch) => {
  const { delegate_name } = measure
  return html`
    <div class="column is-full">
      <a href="#" onclick=${(event) => dispatch({ type: 'measure:voteFormActivated', event, measure })} style="display: block; line-height: 100%; height: 100%; white-space: normal;" class="${`${loading.vote ? 'is-loading' : ''} button vote-button-yea is-outline has-text-weight-semibold is-fullwidth`}">
        <span class="icon is-small">${icon(faCircle)}</span>
        <span>${delegate_name ? `Inherited Abstain vote from ${delegate_name}` : 'You Abstained'}</span>
      </a>
    </div>
  `
}

const voteButtons = ({ loading, measure }, dispatch) => {
  const { delegate_name, vote } = measure
  const { my_vote = { position: vote ? vote.position : null } } = measure
  return html`
    <div class="columns is-gapless is-multiline is-marginless">
      ${my_vote.position === 'abstain' ? abstainButton({ loading, measure }, dispatch) : html``}
      <div class="column is-half">
        <form method="POST" onsubmit=${handleForm(dispatch, { type: 'measure:voteFormActivated', measure })} style="height: 100%;">
          <input type="hidden" name="vote_id" value="${my_vote.position || ''}" />
          <input type="hidden" name="position" value="yea" />
          <input type="hidden" name="public" value="${typeof my_vote.public === 'boolean' ? my_vote.public : 'true'}" />
          <input type="hidden" name="comment" value="${my_vote.comment || ''}" />
          <button type="submit" style="${`${vote && my_vote.position !== 'yea' ? 'opacity: .3;' : ''} display: block; line-height: 100%; height: 100%; white-space: normal;`}" class="${`${loading.vote ? 'is-loading' : ''} button vote-button-yea is-success has-text-weight-semibold is-fullwidth`}">
            <span class="icon is-small">${icon(faCheck)}</span>
            <span>${my_vote.position === 'yea' ? delegate_name ? `Inherited Yea vote from ${delegate_name}` : 'You voted Yea' : 'Vote Yea'}</span>
          </button>
        </form>
      </div>
      <div class="column is-half" style="border-left: 1px solid white;">
        <form method="POST" onsubmit=${handleForm(dispatch, { type: 'measure:voteFormActivated', measure })} style="height: 100%;">
          <input type="hidden" name="vote_id" value="${my_vote.position || ''}" />
          <input type="hidden" name="position" value="nay" />
          <input type="hidden" name="public" value="${typeof my_vote.public === 'boolean' ? my_vote.public : 'true'}" />
          <input type="hidden" name="comment" value="${my_vote.comment || ''}" />
          <button type="submit" style="${`${vote && my_vote.position !== 'nay' ? 'opacity: .3;' : ''} display: block; line-height: 100%; height: 100%; white-space: normal;`}" class="${`${loading.vote ? 'is-loading' : ''} button vote-button-nay is-danger has-text-weight-semibold is-fullwidth`}">
            <span class="icon is-small">${icon(faTimes)}</span>
            <span>${my_vote.position === 'nay' ? delegate_name ? `Inherited Nay vote from ${delegate_name}` : 'You voted Nay' : 'Vote Nay'}</span>
          </button>
        </form>
      </div>
    </div>
  `
}
