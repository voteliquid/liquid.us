const { html } = require('../helpers')

module.exports = () => {
  return html`
    <section class="hero is-light is-bold is-fullheight">
      <div class="hero-body">
        <div class="container">
          <h2 class="title is-3 is-size-2-desktop is-size-3-mobile has-text-centered reveal">Thank you! We received your policy idea.</h2>
          <br />
          <br />
          <p class="subtitle is-4 is-size-4-desktop reveal">Please give us a day or two to think about your policy idea and whether we have any additional questions.</p> 
          <br />
          <p class="subtitle is-4 is-size-4-desktop reveal">Our next step is to sculpt your idea into a digital format designed to go viral.</p>
          <br /> 
          <p class="subtitle is-4 is-size-4-desktop reveal">Meanwhile, read below for some inspiration around building awareness for your policy idea:</p>
          <br />
          <br />
          <br />
          <br />
          <br />
          <div class="container has-text-centered" style="position: relative; bottom: 40px; opacity: .4">
            <span class="learn-more is-hidden-mobile" style="cursor: default">Learn more</span><br />
            <span class="icon is-large  down-arrow"><i class="fa fa-2x fa-chevron-down"></i></span>
          </div
        </div>
      </div>
      </div>
      <style>
            .hero.is-fullheight.subtract-toolbar {
              min-height: calc(100vh - 64px);
            }
            .delayed {
              animation: delayed-animation 0.6s cubic-bezier(0.6, 0.2, 0.1, 1);
            }
            @keyframes delayed-animation {
              0% { opacity: 0; transform: scale(0.9) translate(0, 20px); }
              100% { opacity: 1; transform: scale(1) translate(0, 0); }
            }
            .delayed1 {
              animation: delayed1-animation 1.8s cubic-bezier(0.6, 0.2, 0.1, 1);
            }
            @keyframes delayed1-animation {
              0% { opacity: 0; }
              55% { opacity: 0; transform: scale(0.9) translate(0, 20px); }
              100% { opacity: 1; transform: scale(1) translate(0, 0); }
            }
            .delayed2 {
              animation: delayed2-animation 2.8s cubic-bezier(0.6, 0.2, 0.1, 1);
            }
            @keyframes delayed2-animation {
              0% { opacity: 0; }
              71% { opacity: 0; transform: scale(0.9) translate(0, 20px); }
              100% { opacity: 1; transform: scale(1) translate(0, 0); }
            }
            .down-arrow {
              animation: down-arrow-animation 2s infinite;
              animation-delay: 3s;
              opacity: 0;
            }
            @keyframes down-arrow-animation {
              0% { transform: translate(0, 0); opacity: 0; }
              50% { opacity: 1; }
              100% { transform: translate(0px, 20px); opacity: 0; }
            }
            .learn-more {
              animation: fadein 4s;
            }
            @keyframes fadein {
              0% { opacity: 0; }
              75% { opacity: 0; }
              100% { opacity: 1; }
            }
          </style>
    </section>


    <section class="section">
      <div class="container is-widescreen">
        <style>
          p, ol {
            font-size: 1.25rem;
          }
        </style>
        <div class="content">
          <h2 class="title is-3">How to Make Your Policy Idea Go Viral</h2>
          <ol type="1">
            <li><strong>Build the argument.</strong> Start with an idea and layer in detail. You'll want a headline and image or video to grab attention and then provide sufficient detail to be compelling. We'll help with this part.</li>
            <br />
            <li><strong>Set a launch date.</strong> Policy ideas deserve a coordinated launch. Setting and communicating a launch date helps collaborators and partners to plan their efforts. When possible, coordinate the date with an event that will get broader attention.</li>
            <br />
            <li><strong>Recruit a core group of activists</strong> who strongly support the petition and are willing to put in
            the work to get it out there.
            <br /><br />
            <li><strong>Build your contact list:</strong> It can be helpful to split the list into 1. Influencers (people who have reach), 2. Everyone else you know. (Make sure everyone in
            the core organizing group does this)</li>
            <br />
            <li><strong>Give influencers advanced notice</strong> before the launch date (preferably a week or more before) and
            enroll them in sharing the petition with their network. Listen to concerns, respond to questions
            and make adjustments you think are appropriate.</li>
            <br />
            <li><strong>Create awesome sharing copy.</strong> You're going to be asking influencers first and then everyone you know to share your policy idea. It makes their life easier to have social and email sharing copy to work from.</li>
            <br />
            <li><strong>Format your argument to go viral.</strong> We'll help with this part, but the idea is to use a platform like Liquid.US to prepare your policy idea to go viral.</li>
            <br />
            <li><strong>Send, send, send!</strong> When it's launch day, make sure everyone knows it's time to send, post, msg, and call. Email everyone on your list. Hit up Facebook, Twitter, Instagram,
            NextDoor. Post in relevant online groups and message boards. Remind the influencers and core
            group to go for it!</li>
            <br />
            <li><strong>Follow up.</strong> Make sure your supporters, aligned activists and legislators see the level of support for your proposal. We automatically sends comments to the appropriate legislators on your behalf, but it's valuable to keep the pressure on.</li>
            <br />
            <li><strong>Share with media.</strong> Once you’ve built up a significant level of support, you can garner media
            coverage by sharing the traction you've received. Liquid provides a centralized location for reporters to review comments and votes from verified voters.</li>  
          </ol>
      </div>
    </section>
  `
}
