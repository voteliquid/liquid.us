const Component = require('./Component')
const Comment = require('./Comment')

module.exports = class MeasureTopComments extends Component {
  render() {
    const { measure, yea, nay } = this.props
    const { short_id, type, vote_position } = measure
    const measureVoteUrl = `/${type === 'PN' ? 'nominations' : 'legislation'}/${short_id}/vote`
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
        <div class="columns is-gapless is-multiline is-marginless">
          ${!vote_position ? [`
          <div class="column is-half">
            <a href="${measureVoteUrl}" class="button vote-button-yea is-success has-text-weight-semibold is-fullwidth">
              <span class="icon is-small"><i class="fa fa-check"></i></span>
              <span>Vote Yea</span>
            </a>
          </div>
          <div class="column is-half">
            <a href="${measureVoteUrl}" class="button vote-button-nay is-danger has-text-weight-semibold is-fullwidth">
              <span class="icon is-small"><i class="fa fa-close"></i></span>
              <span>Vote Nay</span>
            </a>
          </div>
          `] : ''}
          <div class="column is-half" style="background-color: hsla(141, 71%, 97%, 1); color: #222;">
            <div style="padding: 1rem;">
              <h4 style="color: hsl(141, 80%, 38%); padding-bottom: 1rem;" class="${`${vote_position ? 'has-text-weight-semibold' : ''} has-text-centered`}">Top Argument In Favor</h4>
              ${yea
              ? Comment.for(this, yea, `topcomment-${yea.id}`)
              : [`
                <p class="has-text-grey-light has-text-centered">
                  No arguments in favor yet.
                </p>
              `]}
            </div>
          </div>
          <div class="column is-half" style="background-color: hsla(348, 100%, 98%, 1); color: #222;">
            <div style="padding: 1rem;">
              <h4 style="padding-bottom: 1rem;" class="${`${vote_position ? 'has-text-weight-semibold' : ''} has-text-centered has-text-danger`}">Top Argument Against</h4>
              ${nay
              ? Comment.for(this, nay, `topcomment-${nay.id}`)
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
