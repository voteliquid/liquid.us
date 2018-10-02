const { APP_NAME } = process.env
const Component = require('./Component')

module.exports = class AdvocacyPage extends Component {
  render() {
    return this.html`
    <style>
        .is-horizontal-center {
            justify-content: center;
        }

        .quote-section {
            background-color: rgb(218, 225, 237);
        }

    </style>
    <section class="section">
        <div class="container">
            <div class="content">
                <h1 class="title is-1 has-text-centered" style="margin-bottom: 65px">Hold Politicians Accountable to Your Members</h1>
                <div class="columns">
                    <div class="column">
                        <figure class=".image">
                            <img src="/assets/scorecard.png" alt="${`${APP_NAME} Scorecard`}" />
                        </figure>
                    </div>
                    <div class="column">
                        <p class="is-size-4">Your members want accountability, but phone calls stats aren’t transparent, and the legislative process is overly-complicated. <br><br> ${APP_NAME} grades politicians on how well they listen to their constituents and gives your members an ongoing say on policy without being overwhelmed.</p>
                        <br>
                        <div class="has-text-centered"><a class="button is-link is-large">Learn More</a></div>
                        <p class="is-size-6 has-text-centered" style="margin-top: 30px">$0 cost &middot; 100% verified results &middot; Seconds to use
                    </div>
                </div>
            </div>
        </div>
    </section>
    <section class="section quote-section">
        <div class="container">
            <div class="content">
                <div class="columns has-text-centered" style="margin: -10px 0 0 0">
                    <div class="column" style="margin-bottom: 10px">
                        <div class="is-size-6">"I want to see it tried in many contexts."</div>
                        <div class="is-flex is-horizontal-center">
                            <figure class="image is-128x128">
                                <img src="/assets/larrylessig.png" />
                            </figure>
                        </div>
                        <div class="is-size-6">Larry Lessig<br>Harvard Law Professor</div>
                    </div>
                    <div class="column" style="margin-bottom: 10px">
                        <div class="is-size-6">“An opportunity to vastly change the DC quagmire.”</div>
                        <div class="is-flex is-horizontal-center">
                            <figure class="image is-128x128">
                                <img src="https://pbs.twimg.com/profile_images/984831266888577026/0Igh-3Rs_400x400.jpg"
                            </figure>
                        </div>
                        <div class="is-size-6">Danny Crichton<br>TechCrunch</div>
                    </div>
                    <div class="column" style="margin-bottom: 10px">
                        <div class="is-size-6">“Much better than calling your rep.”</div>
                        <div class="is-flex is-horizontal-center">
                            <figure class="image is-128x128">
                                <img src="https://pbs.twimg.com/profile_images/889800149463117824/pBO0VcsJ_400x400.jpg"
                            </figure>
                        </div>
                        <div class="is-size-6">Brian Forde<br>Congressional Candidate</div>
                    </div>
                </div>
            </div>
        </div>
    </section>
    <section>
        <div class="container">
            <div class="content">
                    <h1 class="title has-text-centered" style="margin-top: 80px">${APP_NAME} adapts to any level of a member's participation</h2>
                    <div class="is-flex is-horizontal-center">
                        <ol class="is-size-3">
                            <li>Represent yourself</li>
                            <li>Rely on people you trust</li>
                            <li>Change your mind any time</li>
                        </ol>
                    </div>
                    <div class="has-text-centered" style="margin: 50px 0 50px 0"><a class="button is-link is-large">Learn More</a></div>
            </div>
        </div>
    </section>
    `
  }
}
