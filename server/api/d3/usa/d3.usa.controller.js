'use strict';

var _ = require('lodash'),
        config = require('../../.././config/environment'), 
        pmongo = require('promised-mongo'),
        Promise = require("bluebird");
      
// Get list of citydatas
exports.index = function(req, res) {
  var db = pmongo(config.mongo.uri);
  var retArr = [];
  Promise(db.collection('requests').find({"state" : {$ne : null}}).on('data', function(states){
      retArr.push(states)
    })).then(function () {
      res.json(retArr);
    });

};
// 'use strict';

// var _ = require('lodash'),
//         config = require('../../.././config/environment'), 
//         mongo = require('mongodb').MongoClient,
//         request = require('request'),
//         DB;

// // Get list of citydatas
// mongo.connect(config.mongo.uri, function (err, db){
//   DB = db;
// });
// exports.index = function(req, res) {
//   var responseArr = [];
//   var states = DB.collection('requests').find({"state" : {$ne : null}});
//   states.on('data', function(st){
//       responseArr.push(st)
//     }).then()