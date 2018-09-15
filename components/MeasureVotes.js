const Component = require('./Component')
const Comment = require('./Comment')
const MeasureVoteForm = require('./MeasureVoteForm')

module.exports = class MeasureVotes extends Component {
  autosubmit() {
    document.querySelector('.vote-filters-submit').click()
  }
  onclick(event) {
    event.preventDefault()
    this.setState({ showMeasureVoteForm: !this.state.showMeasureVoteForm })
  }
  render() {
    const { showMeasureVoteForm } = this.state
    const { measure } = this.props
    const { comments = [] } = measure
    const { order, position } = this.location.query

    return this.html`
      <div id="votes">
        <form name="vote-filters" style="margin-bottom: 2rem;" class="vote-filters" method="GET" action="${this.location.path}">
          <div class="field is-horizontal">
            <div class="field-body">
              <div class="field is-narrow" style="margin-right: 1rem;">
                <h4 class="title is-size-6 has-text-grey has-text-weight-semibold is-inline">
                  All Arguments
                </h4>
              </div>
              <div class="field is-narrow has-addons">
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
              <div class="field is-narrow has-addons">
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
              <div class="field is-narrow">
                <div class="control">
                  <button onclick=${this} class="${`button is-primary has-text-weight-semibold is-small ${showMeasureVoteForm ? 'is-hidden' : ''}`}">
                    <span class="icon"><i class="fa fa-edit"></i></span>
                    <span>Add an argument</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
        ${showMeasureVoteForm ? MeasureVoteForm.for(this, { measure }) : ''}
        ${comments.length
          ? comments.map(c => Comment.for(this, c, `comment-${c.id}`))
          : [`<p class="notification has-background-light has-text-grey">No ${position ? `${position} ` : ''}arguments.</p>`]
        }
      </div>
    `
  }
}
