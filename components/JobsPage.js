const { html } = require('../helpers')

module.exports = {
  init: [{
  }],
  update: (event, state) => {
    return [state]
  },
  view: () => {
    return html()`
      <section class="section">
        <div class="container">
          <div class="content">
            <h2>Open Jobs</h2>

            <h3>Software Engineer</h3>
            <ul>
              <li>$80K, no benefits, equity negotiable</li>
              <li>Remote (within USA)</li>
              <li>Flexible hours, with opportunity to learn and grow</li>
            </ul>

            <h5>The Company</h5>

            <p>Liquid US (liquid.us) is a liquid democracy voting startup based in San Francisco. We’re dedicated to upgrading the hyper-partisan, money-dominated iteration of Democracy gripping America to one that prioritizes transparency and nuanced debate. We empower issue experts to curate and weigh in on the policy decisions facing their community so that citizens are better-informed and can vote directly on issues or choose personal representatives they trust.</p>

            <h5>The Role</h5>

            <ul>
              <li>Extend and maintain our web app and API using JavaScript, SQL (PostgreSQL), and AWS.</li>
              <li>Collaborate in the product development process to design and scope new features.</li>
              <li>Move between back-end and front-end.</li>
              <li>Analyze trade-offs when scoping a feature, and connect what we’re building to Liquid's mission.</li>
            </ul>

            <h5>The Requirements</h5>
            <ul>
              <li>Proven experience developing web applications with JavaScript (React, Vue, etc.)</li>
              <li>Comfortable with Git</li>
              <li>SQL experience or willingness to learn</li>
              <li>Collaborative, open-minded, and curious</li>
            </ul>

            <a href="mailto:engineering@liquid.us" class="button is-primary">Apply</a>
          </div>
        </div>
      </section>
    `
  },
}
