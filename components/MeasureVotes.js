const Component = require('./Component')
const Comment = require('./Comment')

module.exports = class MeasureVotes extends Component {
  autosubmit() {
    document.querySelector('.vote-sort-submit').click()
  }
  render() {
    const { measure } = this.props
    const { comments = [] } = measure
    const { order } = this.location.query

    return this.html`
      <div id="votes">
        <h4 class="title is-size-6 has-text-grey has-text-weight-semibold">
          Votes
        </h4>
        <form name="vote-sort" class="vote-sort" style="margin-bottom: 2rem;" method="GET" action="${this.location.path}">
          <div class="field has-addons">
            <div class="control">
              <label for="vote_sort" class="button is-static is-small">
                Sort by
              </label>
            </div>
            <div class="control">
              <div class="select is-small">
                <select autocomplete="off" name="order" onchange=${this.autosubmit}>
                  <option value="most_recent" selected=${!order || order === 'most_recent'}>Most recent</option>
                  <option value="vote_power" selected=${order === 'vote_power'}>Vote power</option>
                </select>
              </div>
              <button type="submit" class="vote-sort-submit is-hidden"></button>
            </div>
          </div>
        </form>
        ${comments.length
          ? comments.map(c => Comment.for(this, c, `comment-${c.id}`))
          : [`<p class="has-text-grey-light">No votes.</p>`]
        }
      </div>
    `
  }
}
