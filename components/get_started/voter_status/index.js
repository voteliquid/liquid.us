const Component = require('../../Component')

module.exports = class RegistrationStatusPage extends Component {
  onsubmit(event, formData) {
    if (event) event.preventDefault()
    if (!formData.voter_status) return this.state
    const { user } = this.state
    const { redirect } = this.location

    return this.api(`/users?select=id,voter_status&id=eq.${user.id}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ voter_status: formData.voter_status }),
    })
    .then(() => {
      if (formData.voter_status === 'Eligible') {
        redirect('/get_started/voter_status/eligible')
      } else if (formData.voter_status === 'Ineligible') {
        redirect('/get_started/voter_status/ineligible')
      } else {
        redirect('/get_started/verification')
      }

      return this.state
    })
    .catch((error) => {
      if (error) console.log(error)
      return { error: error.message }
    })
  }

  render() {
    const { error, user } = this.state
    return this.html`
      <section class="section">
        <div class="columns is-centered">
          <div class="column is-half">
            <div class="content">
              <h2 class="subtitle">Are you a registered voter?</h2>
              ${user && user.address ?
                [`<p class="is-size-7 has-text-grey">Based on your address of <strong>${user.address.address}</strong>. <a href="/change_address?from=${this.location.path}">Change</a>`]
                : []
              }
              ${error ? [`<div class="notification is-warning">${error}</div>`] : ''}
              <br />
              <p class="subtitle is-5">Pick one:</p>
              <hr />
              <div class="field">
                <form method="POST" onsubmit=${this}>
                  <div class="control">
                    <input type="hidden" name="voter_status" value="Registered" />
                    <button type="submit" class="button">
                      <span class="icon">
                        <i class="fa fa-check"></i>
                      </span>
                      <span>Registered</span>
                    </button>
                    <p>I'm registered to vote at this address.</p>
                  </div>
                </form>
              </div>
              <hr />
              <div class="field">
                <form method="POST" onsubmit=${this}>
                  <div class="control">
                    <input type="hidden" name="voter_status" value="Eligible" />
                    <button type="submit" class="button">
                      <span class="icon">
                        <i class="fa fa-exclamation-triangle"></i>
                      </span>
                      <span>Eligible</span>
                    </button>
                    <p>I'm eligible to vote, but not registered at this address.</p>
                  </div>
                </form>
              </div>
              <hr />
              <div class="field">
                <form method="POST" onsubmit=${this}>
                  <div class="control">
                    <input type="hidden" name="voter_status" value="Ineligible" />
                    <button type="submit" class="button">
                      <span class="icon">
                        <i class="fa fa-times"></i>
                      </span>
                      <span>Ineligible</span>
                    </button>
                    <p>I'm not eligible to vote.</p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    `
  }
}
