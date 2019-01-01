const Component = require('./Component')
const LoadingIndicator = require('./LoadingIndicator')
const Comment = require('./Comment')

module.exports = class MeasureProxyVotes extends Component {
  render() {
    const { measure } = this.props
    const votes = measure.proxyVotes

    return this.html`
      <div>
        <h4 class="title is-size-6 has-text-grey has-text-weight-semibold">
          Your Proxies' Votes
        </h4>
        <div>${!votes ? LoadingIndicator.for(this, 'yourproxyvotes-indicator') : ProxyVotesLoaded.for(this, { votes })}</div>
        <hr />
      </div>
    `
  }
}

class ProxyVotesLoaded extends Component {
  render() {
    const { votes } = this.props
    return this.html`
      <div>
        ${votes.length
        ? votes.map((vote) => Comment.for(this, vote, `yourproxyvotes-${vote.id}`))
        : [`<p class="has-text-grey-light">None of your proxies have voted yet.</p>`]}
      </div>
    `
  }
}
