const Component = require('./Component')

module.exports = class PublicProfileRequiredMsg extends Component {
  render() {
    return this.html`
      <p class="notification">
        You must create a public profile to propose legislation.
        ${[this.state.user.cc_verified
          ? `<a href="/get_started">Choose a username</a> and make a public profile.</a>`
          : `<a href="/get_started">Verify your identity</a> to choose a username and make a public profile.</a>`
        ]}
      </p>
    `
  }
}
