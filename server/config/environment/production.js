'use strict';

// Production specific configuration
// =================================
module.exports = {
  ip: process.env.IP || undefined,
  port: process.env.PORT || 80
};