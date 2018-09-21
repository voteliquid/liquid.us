const { APP_NAME } = process.env
const routes_ = require('../routes')
const pathToRegexp = require('path-to-regexp')

const routes = Object.keys(routes_).map((path) => {
  const keys = []
  const regexp = pathToRegexp(path, keys)
  return { keys, loader: routes_[path].fn, title: routes_[path].page_title, path, regexp }
})

routes.notFound = { ...routes[0], status: 404 }

const match = (url) => {
  for (let i = 0, l = routes.length; i < l; i++) {
    const route = routes[i]
    if (route.regexp.test(url)) {
      const matches = route.regexp.exec(url)
      route.params = matches.slice(1).reduce((b, a, i) => {
        b[route.keys[i].name] = a
        return b
      }, {})
      return route
    }
  }

  const notFound = routes.notFound
  return typeof notFound === 'function' ? notFound.call(this) : notFound
}

exports.loadPage = (url, status = 200, dispatch) => {
  const pathname = url.split('?')[0]
  const search = url.split('?')[1]
  const matched = match(pathname)
  const location = {
    params: matched.params,
    path: pathname,
    query: (search || '').split('&').reduce((b, a) => {
      const [key, val] = a.split('=')
      b[key] = val
      return b
    }, {}),
    status: matched.status || status,
    url,
  }

  if (typeof window === 'object' && search) {
    window.history.replaceState({}, null, url)
  }

  const page_title = matched.title ? `${matched.title} ★ ${APP_NAME}` : `${APP_NAME} ★ Liquid Democracy for America`
  dispatch({ type: 'pageChanged', location, page_title })

  if (matched.loader) {
    const loader = typeof matched.loader === 'function' ? matched.loader.call(this) : matched.loader
    if (loader.then) {
      return loader.then((loaded) => {
        dispatch({ type: 'routeLoaded', program: loaded.default || loaded })
      })
    }
    dispatch({ type: 'routeLoaded', program: loader.default || loader })
  }
}
