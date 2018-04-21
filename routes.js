module.exports = {
  '/': route('Liquid Democracy for America', () => import('./components/Home')),
  '/join': route('Join', () => import('./components/Join')),
  '/legislation': route('Legislation for U.S. Congress', () => import('./components/LegislationList')),
  '/legislation/:short_id': route('Legislation', () => import('./components/LegislationPage')),
  '/legislation/:short_id/vote': route('Vote', () => import('./components/LegislationVotePage')),
  '/sign_in': route('Sign in', () => import('./components/SignIn')),
  '/sign_in/verify': route('Sign in', () => import('./components/VerifyOTP')),
  '/sign_out': route('Sign out', () => import('./components/SignOut')),
  '/settings': route('Settings', () => import('./components/Settings')),
  '/proxies': route('Your Proxies', () => import('./components/Proxies')),
  '/proxies/requests': route('Proxy Requests', () => import('./components/ProxyRequests')),
  '/drip_emails/next': route('Next introductory email', () => import('./components/DripEmailRequestNextStage')),
  '/drip_emails/unsubscribe': route('Unsubscribe', () => import('./components/DripEmailUnsubscribe')),
  '/get_started': route('Get Started', () => import('./components/get_started')),
  '/get_started/basics': route('Get Started', () => import('./components/get_started/Basics')),
  '/get_started/proxies': route('Your First Proxy', () => import('./components/get_started/Proxies')),
  '/get_started/voter_status': route('Voter Status', () => import('./components/get_started/voter_status')),
  '/get_started/voter_status/eligible': route('Voter Status - Eligible', () => import('./components/get_started/voter_status/Eligible')),
  '/get_started/voter_status/ineligible': route('Voter Status - Ineligible', () => import('./components/get_started/voter_status/Ineligible')),
  '/get_started/verification': route('Verify your identity', () => import('./components/get_started/Verification')),
  '/get_started/profile': route('Create Profile', () => import('./components/get_started/Profile')),
  '/change_address': route('Change Address', () => import('./components/ChangeAddress')),
  '/legislators': route('Legislators', () => import('./components/Legislators')),
  '/new_legislatures': route('New Legislatures', () => import('./components/NewLegislatures')),
  '/twitter/:username': route('Profile', () => import('./components/ProfilePage')),
  '/:username': route('Profile', () => import('./components/ProfilePage')),
}

function route(page_title, fn) {
  return function route() {
    this.setState({ page_title }, false)
    return fn.call(this)
  }
}
