const Component = require('./Component')
const ordinalSuffix = require('ordinal-suffix')

module.exports = class RepCard extends Component {
  render() {
    const { rep } = this.props
    return this.html`
      <div class="media">
        <figure class="media-left">
          <p class="image is-96x96">
            <a href=${`/${rep.username}`}>
              <img src=${this.avatarURL(rep)}>
            </a>
          </p>
        </figure>
        <div class="media-content">
          <style>
            .space-between {
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              min-height: 120px;
            }
          </style>
          <div class="content space-between">
            <p class="is-small">
              <a href=${`/${rep.username}`}>
                <strong>${rep.first_name} ${rep.last_name}</strong> <small>@${rep.twitter_username}</small>
              </a>
              <br />
              <span class="is-size-6">${rep.office_name}</span>
            </p>
            <p>
              <span class="tag is-size-6 is-dark has-text-weight-bold">${rep.representation_grade || [`<span class="icon"><i class="fa fa-question"></i></span>`]}</span>
              <span class="is-size-7 has-text-grey">
                ${rep.representation_grade ?
                  `${ordinalSuffix(rep.representation_percentile)} percentile among ${rep.office_chamber === 'Lower' ? 'House' : 'Senate'} ${rep.party_affiliation}s` :
                  `Need more constituent votes to calculate grade`}
              </span>
            </p>
          </div>
        </div>
      </div>
    `
  }
}
