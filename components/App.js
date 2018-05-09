const { Router } = require('hyperloop')
const Component = require('./Component')
const Footer = require('./Footer')
const LoadingIndicator = require('./LoadingIndicator')
const YourLegislators = require('./YourLegislators')
const NavBar = require('./NavBar')
const NotFound = require('./NotFound')
const routes = require('../routes')

module.exports = class App extends Component {
  oninit() {
    const { user } = this.state
    const jwt = this.storage.get('jwt')
    const user_id = this.storage.get('user_id')
    let promise = Promise.resolve()

    if (!user && jwt) {
      promise = this.api(`/users?select=id,about,intro_video_url,email,first_name,last_name,username,cc_verified,voter_status,update_emails_preference,address:user_addresses(id,address)&id=eq.${user_id}`).then(users => this.setState({ user: { ...users[0], address: users[0].address[0] } }))
    }

    return promise
      .then(() => Promise.resolve(YourLegislators.prototype.fetchElectedLegislators.call(this)))
      .then(newState => this.setState(newState))
      .catch((error) => {
        console.log(error)
        this.storage.unset('jwt')
        return { user: false }
      })
  }
  render() {
    return this.html`
      <div id="wrapper">
        <div class="container">${NavBar.for(this)}</div>
        ${Router.for(this, {
          afterPageChange: () => {
            this.setState({ loading_page: false, error: false }, false)
          },
          beforePageChange: () => {
            this.setState({
              hamburgerVisible: false,
              loading_page: true,
              error: false,
            }, false)
          },
          loading: LoadingIndicator,
          notFound: () => {
            this.setState({ page_title: 'Not Found' }, false)
            return NotFound
          },
          pageTitle: ({ config, page_title }) => {
            const APP_NAME = config.APP_NAME
            return page_title ? `${page_title} ★ ${APP_NAME}` : `${APP_NAME} ★ Liquid Democracy for America`
          },
          routes,
        })}
      </div>
      <div>${Footer.for(this)}</div>
    `
  }
}
