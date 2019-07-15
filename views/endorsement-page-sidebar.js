const { html } = require('../helpers')
const endorsementComment = require('./endorsement-reply')
const endorsementCount = require('./endorsement-count')
const endorsementForm = require('./endorsement-form')
const endorsementSignupForm = require('./endorsement-signup-form')
const endorsementSocialShare = require('./endorsement-social-share')
const endorsementCallReps = require('./endorsement-call-reps')

module.exports = (state, dispatch) => {
  const { loading, measure, vote, user, reps } = state
  const reply = (vote.replies || []).filter(({ user_id }) => (user && user.id === user_id))[0]
  const shouldShowRepPhones = (measure) => (
    [
      'expand-long-term-services-sb-512',
      'hold-charter-schools-accountable',
    ].includes(measure.short_id)
  )


  return html`
    <div style="z-index: 30;" class=${`${vote.showMobileEndorsementForm ? 'modal is-active' : 'not-modal'} mobile-only`}>
      <div class="${vote.showMobileEndorsementForm ? 'modal-background' : ''}" onclick=${(event) => dispatch({ type: 'vote:toggledMobileEndorsementForm', vote, event })}></div>
      <div class="${vote.showMobileEndorsementForm ? 'modal-content' : ''}">
        ${user && measure.vote_position && measure.vote_position !== vote.position
          // logged in, voted differently
          ? endorsedOpposingPosition(measure, vote)
          : user && measure.vote_position && !vote.endorsed
          ? endorsedPositionNotVote(measure)
          : ''
        }
        <nav class="box">
          ${endorsementCount(vote)}

          ${shouldShowRepPhones(measure) // Show 'Call reps' flow only for CARA and EDS item
            ? html`
              ${!user || loading.endorsedFromSignupForm
                ? endorsementSignupForm(state, dispatch) // case 1: not logged in
                : !vote.endorsed
                  ? endorsementForm(state, dispatch) // - case 2: logged in, haven't endorsed
                  : html`
                    ${endorsementCallReps({ measure, reps })}
                    ${!reply
                      ? endorsementComment(state, dispatch) // - case 3: endorsed, haven't commented
                      : endorsementSocialShare(measure, vote) // - case 4: after commenting
                    }
                  `
              }
            ` : html`
              ${!user || loading.endorsedFromSignupForm // logged out
                ? endorsementSignupForm(state, dispatch)
                : vote.endorsed // logged in, already endorsed
                  ? endorsementSocialShare(measure, vote)
                  : endorsementForm(state, dispatch) // logged in, voted differently or haven't voted
               }
              ${user && !loading.endorsedFromSignupForm && vote.endorsed && !reply
                ? endorsementComment(state, dispatch)
              : ''}
            `
          }
        </nav>
      </div>
      <button class="${`modal-close is-large ${vote.showMobileEndorsementForm ? '' : 'is-hidden'}`}" aria-label="close" onclick=${(event) => dispatch({ type: 'vote:toggledMobileEndorsementForm', vote, event })}></button>
      <style>
        .modal-content, .modal-card {
          max-height: calc(100vh - 100px) !important;
        }
        @media (max-width: 1050px) {
          .not-modal.mobile-only {
            display: none !important;
          }
        }
      </style>
    </div>
  `
}

const endorsedPositionNotVote = (measure) => {
  let previousVote = 'voted yes'
  if (measure.vote_position === 'nay') { previousVote = 'voted no' }
  if (measure.vote_position === 'abstained') { previousVote = 'abstained' }

const userCommented = measure.comment ? 'and added your own argument' : 'and may have already backed an argument'
const voteHistoryText = measure.delegate_name ? html`
  Your proxy, ${measure.delegate_name}, has already <strong>${previousVote}</strong> on this item and may have included an argument.<br /><br />
  Endorse to back this argument instead.`
  : html`
  You previously <strong>${previousVote}</strong> on this item ${userCommented}.<br /><br />
  Endorse to back this argument instead.
`
  return html`
    <div class="notification is-warning is-marginless is-size-7">
      ${voteHistoryText}
    </div>
  `
}
const endorsedOpposingPosition = (measure, vote) => {
  let previousVote = 'endorsed'
  if (measure.vote_position === 'nay') { previousVote = 'opposed' }
  if (measure.vote_position === 'abstain') { previousVote = html`abstained <span class="has-text-weight-normal">on</span>` }
  const proxyVote = measure.delegate_rank !== -1 ? `r proxy, ${measure.delegate_name},` : ''

  return html`
    <div class="notification is-warning is-marginless is-size-7">
      You${proxyVote} previously <strong>${previousVote}</strong> this item.<br /><br />
      This will switch your vote from ${measure.vote_position} to ${vote.position}.
    </div>
  `
}
