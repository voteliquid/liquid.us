const { WWW_URL } = process.env
const { html } = require('../helpers')

module.exports = (measure, vote) => {
  const { author_username, short_id, title, type } = measure
  const measure_url = `${author_username ? `/${author_username}/` : '/'}${type === 'nomination' ? 'nominations' : 'legislation'}/${short_id}`
  const comment_url = `${measure_url}/votes/${vote.id}`
  const share_url = `${WWW_URL}${comment_url}`

  let actionIng = 'endorsing'; let actionTo = 'endorse'
  if (vote.position === 'nay') { actionIng = 'opposing'; actionTo = 'oppose' }
  if (vote.position === 'abstain') { actionIng = 'weighing in on'; actionTo = 'weigh in' }
  const share_text = `Join me in ${actionIng} ${title}: ${share_url}`

  return html`
    <div class="content">
      <p class="has-text-weight-semibold">Share your comment and invite your friends and family to ${actionTo} as well.</p>
      <div class="buttons is-centered">
        <a class="button is-link has-text-weight-bold" title="Share on Facebook" target="_blank" href="${`https://www.facebook.com/sharer/sharer.php?u=${share_url}`}">
          <span class="icon"><i class="fab fa-facebook"></i></span>
          <span>Post on Facebook</span>
        </a>
        <a class="button is-link has-text-weight-bold" title="Share on Twitter" target="_blank" href="${`https://twitter.com/intent/tweet?text=${share_text}`}">
          <span class="icon"><i class="fab fa-twitter"></i></span>
          <span>Tweet your people</span>
        </a>
        <a class="button is-link has-text-weight-bold" title="Share with Email" target="_blank" href="${`mailto:?subject=${title}&body=${share_text}`}">
          <span class="icon"><i class="fa fa-envelope"></i></span>
          <span>Email</span>
        </a>
      </div>
    </div>
  `
}
