const { html, svg } = require('../helpers')
const activityIndicator = require('./activity-indicator')

module.exports = ({ loading, metrics }, dispatch) => {
  return html`
    <div class="section" onconnected="${() => dispatch({ type: 'metric:requested' })}">
      <style>
        .bar {
          fill: transparent;
        }
        .green {
          fill: hsl(171, 100%, 41%);
        }
        .yellow {
          fill: hsl(48, 100%, 67%);
        }
      </style>
      <div class="container is-widescreen">
        <h1 class="has-text-centered title" style="padding-bottom: 1em;">Metrics</h1>
        ${graphs(loading.metrics, metrics)}
      </div>
    </div>
  `
}

const graphs = (metricsLoading = {}, metrics = {}) => {
  const loading = ['users', 'active_users', 'votes', 'proposals', 'measure_users'].reduce((b, a) => {
    b[a] = metricsLoading[a] || !metrics[a]
    return b
  }, {})
  return html`
    <div class="columns is-multiline is-variable is-7">
      <section class="column is-half" style="padding-bottom: 3em;">
        <h2 class="has-text-centered title is-size-6">Users</h2>
        ${loading.users ? activityIndicator() : graph(metrics.users, ['users', 'users_proxied'])}
      </section>
      <section class="column is-half" style="padding-bottom: 3em;">
        <h2 class="has-text-centered title is-size-6">Active users</h2>
        ${loading.active_users ? activityIndicator() : graph(metrics.active_users, ['active_users'])}
      </section>
      <section class="column is-half" style="padding-bottom: 3em;">
        <h2 class="has-text-centered title is-size-6">Votes</h2>
        ${loading.votes ? activityIndicator() : graph(metrics.votes, ['votes', 'direct_votes'])}
      </section>
      <section class="column is-half" style="padding-bottom: 3em;">
        <h2 class="has-text-centered title is-size-6">Proposals</h2>
        ${loading.proposals ? activityIndicator() : graph(metrics.proposals, ['proposals'])}
      </section>
      <section class="column is-half" style="padding-bottom: 3em;">
        <h2 class="has-text-centered title is-size-6">Top Measures</h2>
        ${loading.measure_users ? activityIndicator() : topMeasuresTable(metrics.measure_users)}
      </section>
    </div>
  `
}

const topMeasuresTable = (topMeasures) => {
  return html`
    <table class="table is-fullwidth is-striped">
      <thead>
        <tr>
          <th>Measure</th>
          <th>Users</th>
        </tr>
      </thead>
      <tbody>
        ${topMeasures.map(({ author_username, short_id, users }) => {
          return html`
            <tr>
              <td>
                <a href="${`/${author_username || 'legislation'}/${short_id}`}">${short_id}</a>
              </td>
              <td>${users}</td>
            </tr>
          `
        })}
      </tbody>
    </table>
  `
}

const graph = (groups, keys) => {
  const width = 600
  const height = 100
  const barWidth = width / groups.length / 2
  const maxValue = groups.reduce((b, a) => {
    const m = keys.length > 1 ? Math.max(Number(a[keys[0]]), Number(a[keys[1]])) : Number(a[keys[0]])
    if (b < m) return m
    return b
  }, 0)
  const scale = height / maxValue
  const isEven = !(groups.length % 2)
  const y1 = maxValue * scale ? height - (maxValue * scale) : 0
  const y2 = maxValue * scale ? height - (((maxValue / 4) * 3) * scale) : 0
  const y3 = maxValue * scale ? height - (((maxValue / 4) * 2) * scale) : 0
  const y4 = maxValue * scale ? height - (((maxValue / 4) * 1) * scale) : 0
  return svg`
    <svg viewBox="${`0 0 ${width - (isEven ? barWidth : 0)} ${height}`}" style="overflow: visible;" aria-labelledby="title" role="img">
      <line x1="0" y1="${y1}" x2="${600 - barWidth}" y2="${y1}" style="stroke:#eeeeee;stroke-width:1" />
      <line x1="0" y1="${y2}" x2="${600 - barWidth}" y2="${y2}" style="stroke:#eeeeee;stroke-width:1" />
      <line x1="0" y1="${y3}" x2="${600 - barWidth}" y2="${y3}" style="stroke:#eeeeee;stroke-width:1" />
      <line x1="0" y1="${y4}" x2="${600 - barWidth}" y2="${y4}" style="stroke:#eeeeee;stroke-width:1" />
      ${groups.map((group, i) => {
        const week = group.week
        const val1 = group[keys[0]]
        const val2 = group[keys[1]]
        const title = `Week of ${new Date(week).toLocaleDateString()} ${keys[0].replace(/_/g, ' ')}: ${val1}${val2 ? `, ${keys[1].replace(/_/g, ' ')}: ${val2}` : ''}`
        const x = i * (barWidth * 2)
        const val1H = Number(val1) * scale
        const val1Y = val1H ? height - val1H : 0
        const val2H = keys[1] ? Number(val2) * scale : 0
        const val2Y = val2H ? height - val2H : 0
        return svg`
          <g>
            <g class="bar"><title>${title}</title><rect x="${x}" y="0" width="${barWidth}" height="${height}"></rect></g>
            <g class="green"><title>${title}</title><rect x="${x}" y="${val1Y}" width="${barWidth}" height="${val1H}"></rect></g>
            ${keys[1] ? svg`<g class="yellow"><title>${title}</title><rect x="${x}" y="${val2Y}" width="${barWidth}" height="${val2H}"></rect></g>` : ''}
          </g>
        `
      })}
      <text x="0" y="${y1 + 5}" fill="#999" font-size="13px">${formatValue(maxValue)}</text>
      <text x="0" y="${y2 + 5}" font-size="13px" fill="#999">${formatValue((maxValue / 4) * 3)}</text>
      <text x="0" y="${y3 + 5}" font-size="13px" fill="#999">${formatValue((maxValue / 4) * 2)}</text>
      <text x="0" y="${y4 + 5}" font-size="13px" fill="#999">${formatValue(maxValue / 4)}</text>
    </svg>
  `
}

const formatValue = (val) => val.toFixed(2).replace('.00', '')
