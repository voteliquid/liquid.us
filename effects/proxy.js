exports.animateProxies = (table, elements) => {
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

// reorder delegate_rank's to match server-side algorithm, to avoid refetching proxies after reordering
exports.reorderProxyRanks = (proxies, proxy, old_rank, new_rank) => {
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
