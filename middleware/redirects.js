const express = require('express')

const server = express()

server
  .all('/bills', (req, res) => res.redirect(301, '/legislation'))
  .all('/congress', (req, res) => res.redirect(301, '/legislation'))
  .all('/representatives', (req, res) => res.redirect(301, '/delegates'))
  .all('/delegates', (req, res) => res.redirect(301, '/proxies'))
  .all('/constituents', (req, res) => res.redirect(301, '/proxies/requests'))
  .all('/l/:short_id', (req, res) => res.redirect(301, `/legislation/${req.params.short_id}`))
  .all('/u/:username', (req, res) => res.redirect(301, `/${req.params.username}`))
  .all('/reps/:username', (req, res) => res.redirect(301, `/${req.params.username}`))
  .all('/new-homepage', (req, res) => res.redirect(301, '/'))
  .all('/elon', (req, res) => res.redirect(301, '/twitter/elonmusk'))
  .all('/wisconsin', (req, res) => res.redirect(301, '/legislation?order=proposed&legislature=WI&terms='))
  .all('/madison', (req, res) => res.redirect(301, '/legislation?order=proposed&legislature=Madison,%20WI&terms='))
  .all('/:username/legislation/:shortId', (req, res) => res.redirect(301, `/${req.params.username}/${req.params.shortId}`))
  .all('/:username/legislation/:shortId/votes/:voteId', (req, res) => res.redirect(301, `/${req.params.username}/${req.params.shortId}/votes/${req.params.voteId}`))

  // Redirect from old to new get_started flow
  .all('/verification', (req, res) => res.redirect(301, '/get_started'))
  .all('/verification/registration_status', (req, res) => res.redirect(301, '/get_started/voter_status'))
  .all('/verification/registration_status/eligible', (req, res) => res.redirect(301, '/get_started/voter_status/eligible'))
  .all('/verification/registration_status/ineligible', (req, res) => res.redirect(301, '/get_started/voter_status/ineligible'))
  .all('/verification/identity', (req, res) => res.redirect(301, '/get_started/verification'))
  .all('/get_started/username', (req, res) => res.redirect(301, '/get_started/profile'))
  .all('/get_started/delegates', (req, res) => res.redirect(301, '/get_started/proxies'))


module.exports = server
