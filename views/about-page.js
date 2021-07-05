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
          <h2 class="title is-5">About Liquid US</h2>
          <p>A project of Liquid Democracy Technologies, PBC, Liquid US combines modern digital tools with an idea called liquid democracy to empower voters in the legislative process, fight corruption, and hold legislators accountable.</p>
          <p>Find, add, and speak out on bills or petitions for any level of government. We publicly track comments and votes, update relevant legislators, and measure voter support and opposition by district, city and state.</p>
        </div>
        <div class="content">
          <h2 class="title is-5">What is liquid democracy?</h2>
          <p>Liquid democracy combines elements of direct and electoral democracy to create a better system of representation. Pick anyone you trust to represent you and represent others when you vote.</p>

          <p>Choose and rank your representatives. If you don’t vote on a proposal, the top person on your list who has voted would determine your vote as well. If none of them vote, then their representatives determine your vote. Visit <a href ="demo.liquid.us">demo.liquid.us</a> to see how this works.</p>

          <p>This network of trusted representatives allows us to gauge public opinion on any specific policy proposal.</p>
        </div>
        <div class="content">
          <h2 class="title is-5">About Liquid Democracy Technologies</h2>
          <p>Liquid Democracy Technologies is a public benefit corporation with a specific mandate to make liquid democracy available nationwide.</p>

          <p>We are dedicated to building the tools that are needed for this to be successful. The ability to find, add, debate, and vote on legislation, as well as choose representatives, will always be free.</p>

          <p>Eventually, LDT will sell those tools to unions, corporations, and other private entities for use in internal decision-making.</p>
          <p>Our investors, who are private at their request, are carefully vetted to ensure that they align with and support our mission. They have no influence or control over LDT itself.</p>
        </div>
      </div>
    </section>
  `
}
