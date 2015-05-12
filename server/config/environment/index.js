'use strict';

var path = require('path');
var _ = require('lodash');

function requiredProcessEnv(name) {
  if(!process.env[name]) {
    throw new Error('You must set the ' + name + ' environment variable');
  }
  return process.env[name];
}

// All configurations will extend these options
// ============================================
var all = {
  env: process.env.NODE_ENV,

  // Root path of server
  root: path.normalize(__dirname + '/../../..'),

  // Server port
  port: process.env.PORT || 9000,

  apiKeys: require('./api.keys.js') || {},

  mongo: {
    uri: 'mongodb://boss:boss@ds031862.mongolab.com:31862/jules'
  },

  confidenceLevel: .35,

  lowConfidenceMessage: 'I was unable to answer your question. Please rephrase it so I can try again!'
};

// Export the config object based on the NODE_ENV
// ==============================================

if(process.env.NODE_ENV == 'production'){
  module.exports = _.merge(all, require('./production.js'));
} else if(process.env.NODE_ENV == 'development') {
  module.exports = _.merge(all, require('./development.js'));
}