'use strict';

var _ = require('lodash');
var accountSid = 'AC0d4f667900e2a6fea95046313f539958'; 
var authToken = '8dd9c7e404b9b17113030ae34db27443'; 
//require the Twilio module and create a REST client 
var client = require('twilio')(accountSid, authToken); 
 
// Get list of replys
exports.index = function(req, res){
  //req.body should contain all of the information from the incoming messages
  client.messages.create({
    to: "+15105990762",
    from: "+14153196727",
    body: JSON.stringify(req.body)
  }, function(err, message){
    console.log(res);
    res.status(200);z
    res.end();
  });
};