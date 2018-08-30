const Component = require('./Component')
const Comment = require('./Comment')

module.exports = class MeasureTopComments extends Component {
  render() {
    const { measure, yea, nay } = this.props
    const { vote_position } = measure
    return this.html`
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
        ${VoteButtons.for(this, { measure })}
        <div class="columns is-gapless is-multiline is-marginless">
          <div class="column is-half" style="background-color: hsla(141, 71%, 97%, 1); color: #222;">
            <div style="padding: 1rem;">
              <h4 style="color: hsl(141, 80%, 38%); padding-bottom: 1rem;" class="${`${vote_position ? 'has-text-weight-semibold' : ''} has-text-centered`}">Top Argument In Favor</h4>
              ${yea
              ? Comment.for(this, yea, `topcomment-yea-${yea.id}`)
              : [`
                <p class="has-text-grey-light has-text-centered">
                  No arguments in favor yet.
                </p>
              `]}
            </div>
          </div>
          <div class="column is-half" style="border-left: 1px solid white; background-color: hsla(348, 100%, 98%, 1); color: #222;">
            <div style="padding: 1rem;">
              <h4 style="padding-bottom: 1rem;" class="${`${vote_position ? 'has-text-weight-semibold' : ''} has-text-centered has-text-danger`}">Top Argument Against</h4>
              ${nay
              ? Comment.for(this, nay, `topcomment-nay-${nay.id}`)
              : [`
                <p class="has-text-grey-light has-text-centered">
                  No arguments against yet.
                </p>
              `]}
            </div>
          </div>
        </div>
        <hr style="margin: 0 0 2rem" />
      </div>
    `
  }
}

class VoteButtons extends Component {
  onconnected() {
    const { measure } = this.props
    return require('./MeasureVoteForm').prototype.fetchVote.call(this, measure)
  }
  onsubmit(event, form) {
    event.preventDefault()

    const saveVote = require('./MeasureVoteForm').MeasureVoteForm.prototype.onsubmit
    const { measure } = this.props

    if (measure.vote_position === form.vote_position) {
      if (measure.type === 'PN') {
        return this.location.redirect(303, `/nominations/${measure.short_id}/vote`)
      }
      return this.location.redirect(303, `/legislation/${measure.short_id}/vote`)
    }

    return saveVote.call(this, event, form)
  }
  render() {
    const { saving_vote } = this.state
    const { measure } = this.props
    const { vote_position } = measure
    const { my_vote = { vote_position } } = measure
    return this.html`
      <div class="columns is-gapless is-multiline is-marginless">
        <div onconnected=${this} class="column is-half">
          <form action=${this} method="POST" onsubmit=${this}>
            <input type="hidden" name="vote_position" value="yea" />
            <input type="hidden" name="public" value="${my_vote.public || 'false'}" />
            <input type="hidden" name="comment" value="${my_vote.comment || ''}" />
            <button type="submit" style="${vote_position !== 'yea' ? 'opacity: .3;' : ''}" class="${`${saving_vote ? 'is-loading' : ''} button vote-button-yea is-success has-text-weight-semibold is-fullwidth`}">
              <span class="icon is-small"><i class="fa fa-check"></i></span>
              <span>${vote_position === 'yea' ? 'You voted Yea' : 'Vote Yea'}</span>
            </button>
          </form>
        </div>
        <div class="column is-half" style="border-left: 1px solid white;">
          <form action=${this} method="POST" onsubmit=${this}>
            <input type="hidden" name="vote_position" value="nay" />
            <input type="hidden" name="public" value="${my_vote.public || 'false'}" />
            <input type="hidden" name="comment" value="${my_vote.comment || ''}" />
            <button type="submit" style="${vote_position !== 'nay' ? 'opacity: .3;' : ''}" class="${`${saving_vote ? 'is-loading' : ''} button vote-button-nay is-danger has-text-weight-semibold is-fullwidth`}">
              <span class="icon is-small"><i class="fa fa-close"></i></span>
              <span>${vote_position === 'nay' ? 'You voted Nay' : 'Vote Nay'}</span>
            </button>
          </form>
        </div>
      </div>
    `
  }
}
