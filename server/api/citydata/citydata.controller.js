'use strict';

var _ = require('lodash'),
        mongoConfig = require('../../config/environment'), 
        mongo = require('mongodb').MongoClient;
      
// Get list of citydatas
exports.index = function(req, res) {
  mongo.connect(mongoConfig.mongo.uri, function (err, db){
    console.log(db)
    db.collection('requests').find().toArray(function(err, data){
      res.json(data);
    });
  });


};