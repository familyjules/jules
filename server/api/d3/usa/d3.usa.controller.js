'use strict';

var _ = require('lodash'),
        config = require('../../.././config/environment'), 
        pmongo = require('promised-mongo'),
        Promise = require("bluebird");
      
// Get list of citydatas
exports.index = function(req, res) {
  var db = pmongo(config.mongo.uri);
  var retObj = {};
  db.collection('requests').distinct("state").then(function(states){

    var statePromises = states.map(function (state) {
      return db.collection('requests').count({"state": state})
    });

    Promise.all(statePromises).then(function (results) {
      res.json(results);
    });

  });
};