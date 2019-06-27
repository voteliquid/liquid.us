const { html } = require('../helpers')

module.exports = () => {
  return html`
    <section class="section">
      <div class="container is-widescreen">
        <style>
          p, ul {
            font-size: 1rem;
          }
        </style>
        <div class="content">
          <h2 class="title is-5">Privacy and Security</h2>
          <p>Privacy and security are critical priorities for Liquid US.</p>
          <p>We operate on a few basic principles:</p>
          <ul>
            <li>Privacy is a basic right.</li>
            <li>All activity defaults private unless the author chooses differently.</li>
            <li>We only collect the minimum amount of user information to enable and express trustworthy voting and policy intention.</li>
            <li>Passwords are inherently difficult to secure. We never require you to create or remember a new password. Rather, we base authentication on the security of your email inbox, like most <em>Forgot Password</em> processes.</li>
            <li>We employ as much encryption as possible, including TLS encryption for all data in transit and database encryption at rest.</li>
          </ul>
        </div>
        <div class="content">
          <h2 class="title is-5">Community Guidelines</h2>
          <p>Liquid US is an online community hub where we come together to debate critical issues facing our country and communities. We can introduce legislation, read different perspectives on issues and endorse those that most closely resonates, share our opinions, and/or proxy our vote to trusted personal representatives.</p>

          <p>The spirit of this community is one of honesty and tolerance for other viewpoints. We strive to make this a place for expressing and discussing nuanced opinion. There is no place here for violence or its threat.</p>

          <p>We are actively evolving our procedures for dealing with content that a user or users consider to be explicit, harassing, or dangerous. We welcome your participation in this process and building robust guidelines.</p>

          <p>Our mission at Liquid US is to put systems — both technological and human — that bring fairness and transparency to working through content and appropriateness disputes. We’ll always consider suggestions for improvement, though may not always implement them.</p>

          <p>Ultimately, all questions related to content moderation and user participation are the discretion of Liquid US. We generally attempt to work with users to remove questionable content and address any problems, and reserve the right to impose penalties, including temporary or permanent restrictions from parts of the service.</p>
        </div>
      </div>
    </section>
  `
}
