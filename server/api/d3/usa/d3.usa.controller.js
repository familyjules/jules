'use strict';

var _ = require('lodash'),
        config = require('../../.././config/environment'), 
        pmongo = require('promised-mongo'),
        Promise = require("bluebird");
      
// Get list of citydatas
exports.index = function(req, res) {
  var db = pmongo(config.mongo.uri);
  var retArr = []
  var stuff = db.collection('requests').find({"state" : {$ne : null}}).on('data', function(datum){
    retArr.push(datum)
  }).on('end', function(){res.json(retArr)})
  //   var statePromises = states.map(function (state) {
  //     return retArr.push(state)

  //   Promise.all(statePromises).then(function () {
  //     res.json(retArr);
  //   });

  // });
};

