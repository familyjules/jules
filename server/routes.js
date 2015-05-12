'use strict';

var errors = require('./components/errors');

module.exports = function(app) {

  // Insert routes below
  app.use('/api/d3/usa', require('./api/d3/usa'));
  app.use('/api/voice', require('./api/voice'));
  app.use('/api/sms', require('./api/sms'));

  // All undefined asset or api routes should return a 404
  app.route('/:url(api|auth|components|app|bower_components|assets)/*').get(errors[404]);

  app.route('/about').get(function(req, res){
    res.redirect('/#/about')
  });

  app.route('/visualizations').get(function(req, res){
    res.redirect('/#/visualizations')
  });

  // All other routes should redirect to the index.html
  app.route('/*').get(function(req, res) {
    res.sendfile(app.get('appPath') + '/index.html');
  });
};
