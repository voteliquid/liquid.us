const Component = require('./Component')
const Comment = require('./Comment')

module.exports = class MeasureTopComments extends Component {
  render() {
    const { yea, nay, measure } = this.props
    return this.html`
      <div>
        <div class="columns is-gapless">
          <div class="column">
            <h4 class="title is-size-6 has-text-grey has-text-weight-semibold">
              Top opinions in favor
            </h4>
            ${yea
            ? Comment.for(this, yea, `topcomment-${yea.id}`)
            : [`
              <p class="has-text-grey-light">
                No opinions in favor yet.
                <a href="/${measure.type === 'PN' ? 'nominations' : 'legislation'}/${measure.short_id}/vote">Vote</a> to add one.
              </p>
            `]}
          </div>
          <div class="column">
            <h4 class="title is-size-6 has-text-grey has-text-weight-semibold">
              Top opinions against
            </h4>
            ${nay
            ? Comment.for(this, nay, `topcomment-${nay.id}`)
            : [`
              <p class="has-text-grey-light">
                No opinions against yet.
                <a href="/${measure.type === 'PN' ? 'nominations' : 'legislation'}/${measure.short_id}/vote">Vote</a> to add one.
              </p>
            `]}
          </div>
        </div>
        ${yea || nay ? [`<div class="has-text-centered is-size-7"><a href="#votes">See all opinions</a>`] : ''}
        <hr />
      </div>
    `
  }
}
