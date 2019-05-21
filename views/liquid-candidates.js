const { handleForm, html } = require('../helpers')

module.exports = (state, dispatch) => {
  const { error } = state

  return html`
    <section class="section">
      <div class="container is-widescreen is-size-5">
        <h2 class="title has-text-weight-normal is-4">Nominate a Liquid Candidate</h2>
          <div>
            <p>Since 2014, candidates all over the country have ran for office with a commitment to use digital democracy tools.</p><br />
            <p>Our goal is take the next step by electing candidates pledged to follow the will of their constituents as expressed through Liquid or a similar liquid system.</p><br />
            <p><b>This means we need liquid supporters like you to run for office.</b></p><br />
            <p>Running is arguably the single best way to help liquid democracy reach a wider audience.</p><br />
            <p>We'll help you get on the ballot, connect you with other local liquid supporters, and provide as much guidance and support as we can.</p><br />
            <p>Intrigued? Fill out the form below to nominate yourself or anyone else who might be interested:</p>
          </div><br />
        <form method="POST" onsubmit=${handleForm(dispatch, { type: 'measure:editFormSaved' })}>
          ${error ? html`<div class="notification is-danger">${error.message}</div>` : ''}
          <div class="field">
              <div class="columns">
                <div class="column is-mobile">
                  <input name="name" class="input" type="text" autocomplete="off" placeholder="Name" />
                </div>
                <div class="column is-mobile">
                  <input name="email" class="input" type="text" autocomplete="off" placeholder="Email address" />
                </div>
                <div class="column is-mobile">
                  <input name="phone" class="input" type="text" autocomplete="off" placeholder="Phone (optional)" />
                </div>
              </div>
              <div class="columns">
                <div class="column is-mobile">
                  <input name="website" class="input" type="text" autocomplete="off" placeholder="Website (optional)" />
                </div>
                <div class="column is-mobile">
                  <input name="office" class="input" type="text" autocomplete="off" placeholder="Office suggested (optional)" />
                </div>
            </div>
          </div><br />
          <div class="field">
            <label for="explanation" class="label is-size-5">Why do you think this person would make a good liquid candidate?</label>
            <div class="control">
              <textarea name="explanation" autocomplete="off" class="textarea" rows="3" placeholder="Optional"></textarea>
            </div>
          </div>
          <div class="field is-grouped">
            <div class="control submit-button">
              <button class="button is-primary" type="submit">
                <span class="icon"><i class="fa fa-edit"></i></span>
                <span>Submit</span>
              </button>
            </div>
          </div>
          <div>
            <p>Not able to run yourself, but ready for Liquid? <a href="/dallascole/legislation/ready-for-liquid">Encourage</a> someone to run in your area.</p>
        </form>
      </div>
      <style>
        @media (min-width: 1050px) {
          .submit-button {
            text-align: center;
            left: 50%;
          }
        </style>
    </section>
  `
}
