const { api, avatarURL, handleForm, html } = require('../helpers')
const { animateProxies, reorderProxyRanks } = require('../effects/proxy')

module.exports = (state, dispatch) => {
  const { proxies = [], user } = state

  return html`
    <style>
      .no-border tr td {
        border: none;
      }
    </style>
    <table class="table is-fullwidth no-border">
      <tbody>
        ${proxies.map((d, idx) => proxyListItem(proxies, d, idx, user, dispatch))}
      </tbody>
    </table>
  `
}

const proxyListItem = (proxies, proxy, idx, user, dispatch) => {
  const { id, to_id, username, first_name, twitter_username } = proxy

  // Fix for twitter names like 'jack' appearing as 'jack jack'
  let { last_name } = proxy
  if (first_name === last_name) { last_name = '' }

  return html`
    <tr draggable="true" ondragover=${ondragover({ idx, proxies }, dispatch)} ondragstart=${ondragstart({ id, idx })} ondragend=${ondragend({ proxies, user }, dispatch)}>
      <td>${idx + 1}.</td>
      <td>
        <div class="media">
          <div class="media-left">
            <div class="image is-32x32">
              ${username || twitter_username
              ? html`<a href="${username ? `/${username}` : `/twitter/${twitter_username}`}" target="_blank">
                  <img src=${avatarURL(proxy)} class="round-avatar-img" />
                </a>`
              : html`
                <img src=${avatarURL(proxy)} class="round-avatar-img" />
              `}
            </div>
          </div>
          <div class="media-content">
            ${username || twitter_username
            ? html`<a href="${username ? `/${username}` : `/twitter/${twitter_username}`}" target="_blank">
                <span>${first_name} ${last_name}</span>
                <span class="has-text-grey is-size-7">@${username || twitter_username}</span>
              </a>`
            : html`
              <span>${first_name} ${last_name}</span>
            `}
          </div>
          <div class="media-right">
            ${idx > 0 ? moveButton({ id, idx, direction: 'up' }, dispatch) : ''}
            ${idx < (proxies.length - 1) ? moveButton({ id, idx, direction: 'down' }, dispatch) : ''}
            <form style="display: inline;" method="POST" onsubmit=${handleForm(dispatch, { type: 'proxy:removed' })}>
              <input value="${to_id}" name="to_id" type="hidden" />
              <input value="${id}" name="id" type="hidden" />
              <button class="button is-small" type="submit" title="Remove">
                <span class="icon has-text-grey"><i class="fa fa-times"></i></span>
              </button>
            </form>
            <span style="cursor: move;" class="icon has-text-grey is-hidden-touch" title="Click and hold to drag to a new position"><i class="fa fa-bars"></i></span>
          </div>
        </div>
      </td>
    </tr>
  `
}

const moveButton = ({ direction, id, idx }, dispatch) => {
  return html`
    <form style="display: inline;" method="POST" onsubmit=${handleForm(dispatch, { type: 'proxy:reordered' })}>
      <input name="reorder_proxies[proxy_id]" value=${id} type="hidden" />
      <input name="reorder_proxies[direction]" value=${direction} type="hidden" />
      <input name="reorder_proxies[index]" value=${idx} type="hidden" />
      <button class="button is-small" type="submit" title=${`Move ${direction}`}>
        <span class="icon has-text-grey"><i class=${`fa fa-arrow-${direction}`}></i></span>
      </button>
    </form>
  `
}

const ondragover = ({ idx, proxies }, dispatch) => (event) => {
  const table = event.currentTarget.parentNode
  const { animating, childNodes, drag_curr_index } = table

  // if we are hovering over the draggable element or animating don't do anything
  if (drag_curr_index === idx || animating) return

  const list_elements = Array.prototype.filter.call(childNodes, n => n.tagName === 'TR')

  // reorder proxies list based on draggable element's new position/index
  const reordered = [].concat(proxies)
  reordered.splice(drag_curr_index, 1)
  reordered.splice(idx, 0, proxies[drag_curr_index])
  table.new_rank = proxies[idx].delegate_rank
  table.drag_curr_index = idx

  // calculate offset before and after list is reordered to add appropriate CSS
  // transforms to animate elements into new position
  // https://medium.com/developers-writing/animating-the-unanimatable-1346a5aab3cd
  animateProxies(table, list_elements)

  return dispatch({ type: 'proxy:proxiesUpdated', proxies: reordered })
}

const ondragstart = ({ id, idx }) => (event) => {
  // set cursor: move and enable dragging by setting data
  event.dataTransfer.dropEffect = 'move'
  event.dataTransfer.setData('text/plain', id)

  // Save starting draggable element's index for later.
  // It changes as it's dragged around the list.
  const table = event.currentTarget.parentNode
  table.drag_curr_index = idx
}

const ondragend = ({ proxies, user }, dispatch) => (event) => {
  const table = event.currentTarget.parentNode
  const proxy = proxies[table.drag_curr_index]
  const proxy_id = proxy.id
  const old_rank = proxy.delegate_rank
  const new_rank = table.new_rank

  // send new delegate rank to API
  dispatch({ type: 'proxy:proxiesUpdated', proxies: reorderProxyRanks(proxies, proxy, old_rank, new_rank) })

  return api(dispatch, `/delegations?id=eq.${proxy_id}`, {
    method: 'PATCH',
    body: JSON.stringify({ delegate_rank: new_rank, updated_at: new Date() }),
    user,
  })
}
