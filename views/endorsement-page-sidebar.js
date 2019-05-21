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
        ${user && measure.vote_position && !vote.endorsed
          // logged in, voted differently
          ? votedDifferentlyMessage(measure) : ''
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

const votedDifferentlyMessage = (measure) => {
  let previousVote = 'endorsed'
  if (measure.vote_position === 'nay') { previousVote = 'opposed' }
  if (measure.vote_position === 'abstain') { previousVote = html`abstained <span class="has-text-weight-normal">on</span>` }

  return html`
    <div class="notification is-warning is-marginless is-size-7">
      You previously <strong>${previousVote}</strong> this item.<br />
      This will switch your vote.
    </div>
  `
}
