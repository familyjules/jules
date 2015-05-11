'use strict';

// Production specific configuration
// =================================
module.exports = {
  ip: process.env.IP || undefined,
  port: process.env.PORT || 8080,
  mongo: {
    uri: 'mongodb://boss:boss@ds031862.mongolab.com:31862/jules'
  }
};