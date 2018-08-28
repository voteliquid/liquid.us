const Component = require('./Component')
const Comment = require('./Comment')

module.exports = class MeasureVotes extends Component {
  autosubmit() {
    document.querySelector('.vote-filters-submit').click()
  }
  render() {
    const { measure } = this.props
    const { comments = [] } = measure
    const { order, position } = this.location.query

    return this.html`
      <div id="votes">
        <form name="vote-filters" class="vote-filters" style="margin-bottom: 2rem;" method="GET" action="${this.location.path}">
          <div class="field is-horizontal">
            <div class="field" style="margin-right: 1rem;">
              <h4 class="title is-size-6 has-text-grey has-text-weight-semibold is-inline">
                All Arguments
              </h4>
            </div>
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
                <button type="submit" class="vote-filters-submit is-hidden"></button>
              </div>
            </div>
            <div>&nbsp;</div>
            <div class="field has-addons">
              <div class="control">
                <label for="vote_sort" class="button is-static is-small">
                  Position
                </label>
              </div>
              <div class="control">
                <div class="select is-small">
                  <select autocomplete="off" name="position" onchange=${this.autosubmit}>
                    <option value="all" selected=${!position || position === 'all'}>All</option>
                    <option value="yea" selected=${position === 'yea'}>Yea</option>
                    <option value="nay" selected=${position === 'nay'}>Nay</option>
                  </select>
                </div>
                <button type="submit" class="vote-filters-submit is-hidden"></button>
              </div>
            </div>
          </div>
          ${comments.length
            ? comments.map(c => Comment.for(this, c, `comment-${c.id}`))
            : [`<p class="has-text-grey-light">No ${position ? `${position} ` : ''}arguments.</p>`]
          }
        </form>
      </div>
    `
  }
}
