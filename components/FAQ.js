const Component = require('./Component')

module.exports = class FAQController extends Component {
  render() {
    const slug = this.props.params.slug
    return this.html`
      ${slug
        ? FAQIndiv.for(this, { slug })
        : FAQIndex.for(this)
      }
    `
  }
}

class FAQIndiv extends Component {
  oninit() {
    const { slug } = this.props
    const faq = questionsBySlug[slug]

    if (this.isBrowser) {
      const page_title = `${faq.q} ★ United`
      window.document.title = page_title
      window.history.replaceState(window.history.state, page_title, document.location)
    }

    return this.setState({
      page_title: faq.q,
      page_description: faq.a,
    })
  }

  onclick(event) {
    event.preventDefault()
    return { isContactWidgetVisible: !this.state.isContactWidgetVisible }
  }

  render() {
    const { slug } = this.props
    const faq = questionsBySlug[slug]
    return this.html`
      <section class="section">
        <div class="columns is-centered" oninit=${this}>
          <div class="column is-half">
            <div class="content">
              <p class="title is-4">
                ${faq
                  ? faq.q
                  : [`Can't find a question <strong>${this.props.params.slug}</strong>`]}
              </p>
              ${faq ? [`
                <p>
                  ${faq.a.split('\n').join('<br />')}
                </p>
              `] : []}
              <hr />
              <p><em>Please <a onclick=${this}>send a message</a> if you have more questions.</em></p>
              <br />
              <p><a href="/faq">&larr; Back to FAQ</a></p>
            </div>
          </div>
        </div>
      </section>
    `
  }
}

class FAQIndex extends Component {
  onclick(event) {
    event.preventDefault()
    return { isContactWidgetVisible: !this.state.isContactWidgetVisible }
  }

  render() {
    return this.html`
      <section class="section">
        <div class="columns is-centered" oninit=${this}>
          <div class="column is-half">
            <div class="content">
              <p class="title is-4">
                Frequently Asked Questions
              </p>
              ${Object.keys(questionsBySlug).map(slug => (
                `<p><a href="/faq/${slug}">${questionsBySlug[slug].q}</a></p>`
              ))}
              <hr />
              <p><em>Please <a onclick=${this}>send a message</a> if you have more questions.</em></p>
            </div>
          </div>
        </div>
      </section>
    `
  }
}

const questions = [
{
  slug: 'is-united-free',
  q: "Is United free to use?",
  a: "Yes, United is 100% free. Enjoy!",
},
{
  slug: 'other-verification',
  q: "Are there other ways to verify?",
  a: `Not yet.

  In-person verification will be available in the District office anywhere a Liquid Candidate is elected.

  We're working on other methods as well, like mailing postcards with a unique code, but these have much greater logistical challenges and we have limited resources right now.`,
},
{
  slug: 'can-i-use-united-without-verifying',
  q: "Can I use United without verifying?",
  a: `In limited ways. You're welcome to try out United without verifying.

 You can vote on items and we'll send your comments to your rep. You can begin proxying to people, and we can send you automatic updates about what your elected representatives are doing.

But your votes won't be counted towards your legislators' Scorecards until you verify.`
},
]

const questionsBySlug = questions.reduce((memo, question) => {
  if (question.slug) {
    memo[question.slug] = question
  }
  return memo
}, {})
