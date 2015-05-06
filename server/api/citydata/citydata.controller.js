'use strict';

var _ = require('lodash'),
        mongoConfig = require('../../config/environment'), 
        mongo = require('mongodb').MongoClient, 
        DB;

mongo.connect(mongoConfig.mongo.uri, function (err, db){
  if(err){
    console.log(err)
  } else {
    DB = db;
    console.log('connected to mongo')
  }
})        
// Get list of citydatas
exports.index = function(req, res) {
  DB.collectionNames(function(err, data){
  	res.json(data);
  });
};