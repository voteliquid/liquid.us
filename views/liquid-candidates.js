const { handleForm, html } = require('../helpers')

module.exports = (state, dispatch) => {
  const { error } = state

  return html`
    <section class="section">
      <div class="container is-widescreen is-size-5">
        <h2 class="title has-text-weight-normal is-4">Become a Liquid Candidate</h2>
        <div>
          <p>American citizens all over the country have ran for office while committing to use digital democracy tools.</p><br />
          <p> We want to take the next step: elect candidates pledged to follow the will of their constituents as expressed through Liquid US or a similar liquid system.</p><br />
          <p><b>This means we need liquid supporters like you to run for office.</b></p><br />
          <p>We'll help you get on the ballot, connect you with other local liquid supporters, and provide as much guidance and support as we can.</p><br />
          <p>Intrigued? Fill out the form below to get started:</p>
        </div><br />
        <form method="POST" onsubmit=${handleForm(dispatch, { type: 'measure:editFormSaved' })}>
          ${error ? html`<div class="notification is-danger">${error.message}</div>` : ''}
          <div class="field has-text-centered">
            <div class="contact-info-box">
              <input name="name" class="input" type="text" autocomplete="off" placeholder="Name" />
            </div>
            <div class="contact-info-box">
              <input name="email" class="input" type="text" autocomplete="off" placeholder="Email address" />
            </div>
            <div class="contact-info-box">
              <input name="phone" class="input" type="text" autocomplete="off" placeholder="Phone (optional)" />
            </div>
          </div>
          <div class="field is-grouped">
            <div class="control submit-button">
              <button class="button is-primary" type="submit">
                <span class="icon"><i class="fa fa-edit"></i></span>
                <span>Submit</span>
              </button>
            </div>
        </form>
      </div>
      <style>
        @media (min-width: 1050px) {
          .contact-info-box {
            max-width: 500px;
            padding: 3px;
          }
        </style>
    </section>
  `
}
