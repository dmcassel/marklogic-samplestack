var Promise = require('bluebird');
var async = require('async');
var mon = libRequire('monitoring');

var sessionGetter = function (req, res, next) {
  return req.db.contributor.getUniqueContent(
    null, { id: req.user.id }
  )
  .then(function (contributor) {
    // add in the roles of the user, which doesn't come from db
    // but which we've saved in the session
    contributor.role = req.user.roles;
    return res.status(200).send(contributor);
  })
  .catch(next);
};

module.exports = function (app, mw) {
  app.get('/v1/session', [
    mw.auth.tryReviveSession,
    mw.auth.associateBestRole.bind(app, ['default']),
    function (req, res, next) {
      if (req.user && req.user.id) {
        return sessionGetter(req, res, next);
      }
      else {
        // there is isn't an authenticated user -- so generate or regenerate
        // a csrf token
        mw.auth.createSession(req, res, next);
        res.status(204).send();
      }
    },

  ]);

  app.delete('/v1/session', [
    mw.auth.tryReviveSession,
    mw.auth.logout
  ]);

  app.put('/v1/session', [
    mw.auth.tryReviveSession,
    mw.parseBody.json,
    mw.auth.login,
    mw.auth.associateBestRole.bind(app, ['contributors']),
    function (req, res, next) {
      res.status(200).send(req.contributor);
    }
  ]);

  app.post('/v1/session', [
    mw.auth.tryReviveSession,
    mw.parseBody.urlEncoded,
    mw.auth.login,
    mw.auth.associateBestRole.bind(app, ['contributors']),
    function (req, res, next) {
      res.status(200).send(req.contributor);
    }
  ]);
};
