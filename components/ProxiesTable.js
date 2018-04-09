const Component = require('./Component')

module.exports = class ProxiesTable extends Component {
  render() {
    const { proxies = [] } = this.state
    const show_help = this.props.show_help !== false

    return this.html`
      <div>
        ${show_help ? [`
          <p class="is-size-7 has-text-grey">
            You can reorder proxies by clicking the <span class="icon"><i class="fa fa-bars"></i></span> icon and dragging it to a new position.<br />Alternatively, click the <span class="icon"><i class="fa fa-arrow-up"></i></span> up and <span class="icon"><i class="fa fa-arrow-down"></i></span> down icons to move up and down.
          </p>
          <br />
        `] : []}
      </div>
      <style>
        .no-border tr td {
          border: none;
        }
      </style>
      <table class="table is-fullwidth no-border">
        <tbody>
          ${proxies.map((d, idx) => ProxyListItem.for(this, { ...d, idx }, `proxylist-${d.id}`))}
          <style>
            .square-img {
              height: 100% !important;
              object-fit: cover;
            }
          </style>
        </tbody>
      </table>
    `
  }
}

class ProxyListItem extends Component {
  onsubmit(event, formData) {
    const { proxies } = this.state
    if (event) event.preventDefault()
    if (!formData || !formData.remove_proxy) return this.state

    const { id, to_id } = formData.remove_proxy

    const proxy = proxies.filter(d => d.id === id).pop()
    if (typeof window === 'object' && !window.confirm(`Are you sure you want to remove ${proxy.first_name} ${proxy.last_name}?`)) return this.state

    proxies.forEach(d => {
      if (d.delegate_rank > proxy.delegate_rank) d.delegate_rank -= 1
    })

    return this.api(`/delegations?id=eq.${id}`, {
      method: 'DELETE',
    })
    .then(() => {
      if (this.storage.get('proxied_user_id') === to_id) this.storage.unset('proxied_user_id')
      return { error: false, proxies: (proxies || []).filter(d => d.id !== id) }
    })
    .catch((error) => {
      console.log(error)
      if (error.code === 42501) return { error: 'You cannot proxy to yourself' }
      if (error.code === 23514) return { error: 'Invalid email address' }
      if (error.code === 23505) return { error: `You've already added ${formData.add_proxy.first_name} ${formData.add_proxy.last_name}` }
      return { error: error.message }
    })
  }

  ondragover(event) {
    const { idx } = this.props
    const { proxies } = this.state
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

    return { proxies: reordered }
  }

  ondragstart(event) {
    const { id, idx } = this.props

    // set cursor: move and enable dragging by setting data
    event.dataTransfer.dropEffect = 'move'
    event.dataTransfer.setData('text/plain', id)

    // Save starting draggable element's index for later.
    // It changes as it's dragged around the list.
    const table = event.currentTarget.parentNode
    table.drag_curr_index = idx
  }

  ondragend(event) {
    const { proxies } = this.state
    const table = event.currentTarget.parentNode
    const proxy = proxies[table.drag_curr_index]
    const proxy_id = proxy.id
    const old_rank = proxy.delegate_rank
    const new_rank = table.new_rank

    // send new delegate rank to API
    this.setState({ proxies: reorderProxyRanks(proxies, proxy, old_rank, new_rank) })

    return this.api('/rpc/reorder_delegation', {
      method: 'POST',
      body: JSON.stringify({ delegation_id: proxy_id, new_rank }),
    })
  }

  render() {
    const { proxies } = this.state
    const { id, to_id, username, first_name, twitter_username, idx } = this.props

    // Fix for twitter names like 'jack' appearing as 'jack jack'
    let { last_name } = this.props
    if (first_name === last_name) { last_name = '' }

    return this.html`
      <tr draggable="true" ondragover=${this} ondragstart=${this} ondragend=${this}>
        <td>${idx + 1}.</td>
        <td>
          <div class="media">
            <div class="media-left">
              <div class="image is-32x32">
                ${username || twitter_username
                ? [`<a href="${username ? `/${username}` : `/twitter/${twitter_username}`}" target="_blank">
                    <img src=${this.avatarURL(this.props)} class="square-img" />
                  </a>`]
                : [`
                  <img src=${this.avatarURL(this.props)} />
                `]}
              </div>
            </div>
            <div class="media-content">
              ${username || twitter_username
              ? [`<a href="${username ? `/${username}` : `/twitter/${twitter_username}`}" target="_blank">
                  <span>${first_name} ${last_name}</span>
                  <span class="has-text-grey is-size-7">@${username || twitter_username}</span>
                </a>`]
              : [`
                <span>${first_name} ${last_name}</span>
              `]}
            </div>
            <div class="media-right">
              ${idx > 0 ? MoveButton.for(this, { id, idx, direction: 'up' }, `proxy-${id}-moveup`) : ''}
              ${idx < (proxies.length - 1) ? MoveButton.for(this, { id, idx, direction: 'down' }, `proxy-${id}-movedown`) : ''}
              <form style="display: inline;" method="POST" onsubmit=${this}>
                <input value="${to_id}" name="remove_proxy[to_id]" type="hidden" />
                <input value="${id}" name="remove_proxy[id]" type="hidden" />
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
}

class MoveButton extends Component {
  onsubmit(event, form) {
    if (event) event.preventDefault()

    if (!form.reorder_proxies) return

    const { proxies } = this.state

    const index = form.reorder_proxies.index
    const proxy_id = form.reorder_proxies.proxy_id
    const new_index = Number(index) + (form.reorder_proxies.direction === 'up' ? (-1) : 1)

    const reordered = [].concat(proxies)
    reordered.splice(index, 1)
    reordered.splice(new_index, 0, proxies[index])
    const old_rank = proxies[index].delegate_rank
    const new_rank = proxies[new_index].delegate_rank
    const table = event.currentTarget.parentNode.parentNode.parentNode.parentNode.parentNode
    const list_elements = Array.prototype.slice.call(table.childNodes).filter(n => n.tagName === 'TR')

    animateProxies(table, list_elements)

    // send new delegate rank to API
    this.setState({ proxies: reorderProxyRanks(reordered, reordered[new_index], old_rank, new_rank) })

    return this.api('/rpc/reorder_delegation', {
      method: 'POST',
      body: JSON.stringify({ delegation_id: proxy_id, new_rank }),
    })
  }

  render() {
    const { direction, id, idx } = this.props
    return this.html`
      <form style="display: inline;" method="POST" onsubmit=${this} action=${this}>
        <input name="reorder_proxies[proxy_id]" value=${id} type="hidden" />
        <input name="reorder_proxies[direction]" value=${direction} type="hidden" />
        <input name="reorder_proxies[index]" value=${idx} type="hidden" />
        <button class="button is-small" type="submit" title=${`Move ${direction}`}>
          <span class="icon has-text-grey"><i class=${`fa fa-arrow-${direction}`}></i></span>
        </button>
      </form>
    `
  }
}

// reorder delegate_rank's to match server-side algorithm, to avoid refetching proxies after reordering
function reorderProxyRanks(proxies, proxy, old_rank, new_rank) {
  if (new_rank > old_rank) {
    proxies.forEach(d => {
      if (d.delegate_rank > new_rank) d.delegate_rank += 1
    })
    proxy.delegate_rank = new_rank + 1
  } else {
    proxies.forEach(d => {
      if (d.delegate_rank >= new_rank) d.delegate_rank += 1
    })
    proxy.delegate_rank = new_rank
  }

  proxies.forEach(d => {
    if (d.delegate_rank > old_rank) d.delegate_rank -= 1
  })

  return proxies
}

function animateProxies(table, elements) {
  const old_boxes = []

  table.animating = true

  elements.forEach((elm, i) => {
    old_boxes[i] = elm.getBoundingClientRect()
  })

  setTimeout(() => {
    elements.forEach((elm, i) => {
      const old_box = old_boxes[i]
      const new_box = elm.getBoundingClientRect()

      const deltaX = old_box.left - new_box.left
      const deltaY = old_box.top - new_box.top

      window.requestAnimationFrame(() => {
        elm.style.transform = `translate(${deltaX}px, ${deltaY}px)`
        elm.style.transition = 'transform 0s'

        window.requestAnimationFrame(() => {
          elm.style.transform = ''
          elm.style.transition = 'transform 400ms'
          setTimeout(() => {
            table.animating = false
          }, 500)
        })
      })
    })
  }, 0)
}
