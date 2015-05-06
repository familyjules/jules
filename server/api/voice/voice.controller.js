'use strict';

var _ = require('lodash');

exports.index = function(req, res){

  var twilio = require('twilio')
  var resp = new twilio.TwimlResponse();
  resp.say({voice:'woman'}, 'Welcome to the family Jules!');
  resp.gather({ timeout:1 }, function() {
          // In the context of the callback, "this" refers to the parent TwiML
          // node. The parent node has functions on it for all allowed child
          // nodes. For <Gather>, these are <Say> and <Play>.
    this.say({voice:'woman'}, 'This is Jules. What would you like to know')
 

  }).record({
      maxLength:5,
      action:'/api/recording'
    });
  res.writeHead(200, {
      'Content-Type':'text/xml'
  });
  // res.send(msg)
  res.end(resp.toString());

};  