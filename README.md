# liquid.us

The future of democracy.

### Install

1. Make sure you have the system level dependencies:
    - [git](https://git-scm.com/)
    - [node](https://nodejs.org/)
2. Fork this repo.
3. Clone down: `git clone https://github.com/YOU/liquid.us.git`
4. Install required node modules: `npm install`

### Development

```
source .template.env
npm start
```

Your local version should now be running at [`http://localhost:3000`](http://localhost:3000).

#### On Microsoft Windows

Read `.template.env` and write your own `environment.bat` file. It should look like the text below:

```
set API_URL=https://api.liquid.us
set APP_NAME=Liquid
set WWW_PORT=3000
set WWW_URL=http://localhost:%WWW_PORT%
set WWW_DOMAIN=liquid.us
set ASSETS_URL=%WWW_URL%/assets
set APP_LOGO=%WWW_URL%/assets/liquid-us-logo.png
set GOOGLE_GEOCODER_KEY=AIzaSyCJYJN-fUm5FqN8-DvFYz-9GH8hokSCbdQ
set NODE_ENV=development
set STRIPE_API_PUBLIC_KEY=pk_test_hLhLcJepsaktxBMieH9tApxE
set TWILIO_ACCOUNT_SID=
set TWILIO_AUTH_TOKEN=
set IPAPI_KEY=
```

Then run your `environment.bat` file and start the application:

```
environment.bat
npm start
```

### Architecture

At a high-level, the webapp is a single function (State, Event) -> (State, HTML Event) that is run whenever an event is
dispatched (usually caused by user input). This update function lives in `app.js`.
The library [`raj`](https://jew.ski/raj/) is used to run this loop, and
[`lighterhtml`](https://github.com/WebReflection/lighterhtml) is used to construct the HTML.

The update function in `app.js` is the only update function run, but its
composed of smaller update functions in `models/` to keep the file manageable.

- `views/` contains view functions.
- `models/` contains update functions which take the current event and state
  and produce a new state and effects.
- `effects/` contains effect functions shared by different update functions.
  This can be lazy-loaded to reduce bundle size.

#### Lifecycle

The app is started in `browser.js` or `server.js` in the browser and on the server. This is where initial state
and events are declared.

#### Updates

The update function receives the current state and event, and returns a new state and any effects that produce
more events asynchronously. It lives in `app.js`.

The update function takes two arguments `event` and `state`, and returns an array [newState, effect] which has the new
state and an effect that might produce more events asynchronously (fetching data over the network, for example).
The reason it returns an array is for easy destructuring.

#### Effects

Effects are functions which take the dispatch function as the argument, and
dispatch new events after performing some side effect.

```javascript
const effect = (dispatch) => {
  someAsyncFunction(() => {
    dispatch({ type: 'eventName', data: { some: 'event data' }, otherData: { some: 'other event data' } })
  })
}
```

Events are objects which must have a `type` property with the event name to distinguish them from other events,
and can include any other properties used by the update function.

#### Views

Views are functions that take two arguments `state` and `dispatch`, and return HTML.

```javascript
const { html } = require('../helpers')

const view = (state, dispatch) => {
  return html`
    <div onclick=${(event) => dispatch({ type: 'someClickEvent', event })}>Hello, World</div>
  `
}
```

#### Helpers

##### helpers.handleForm(dispatch, event)

This helper can be used for submit and change form events. It will deal with parsing the form values and merging them
into the event object before dispatching.

#### Debugging

To debug the application, enable
[debug](https://github.com/visionmedia/debug#readme) output by setting the
`DEBUG=liquid:*` environment variable or `localStorage.setItem('debug', 'liquid:*')` in the
browser. Every event and associated state change will be logged to the console.
