'use strict';

angular.module('julesApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ngRoute',
  'ui.bootstrap'
])
  .config(function ($routeProvider, $locationProvider) {
    $routeProvider
      .otherwise({
        redirectTo: '/'
      });

    $locationProvider.html5Mode(true);
  });

  /*!
   * Start Bootstrap - Creative Bootstrap Theme (http://startbootstrap.com)
   * Code licensed under the Apache License v2.0.
   * For details, see http://www.apache.org/licenses/LICENSE-2.0.
   */

  (function($) {

      // Closes the Responsive Menu on Menu Item Click
      $('.navbar-collapse ul li a').click(function() {
          $('.navbar-toggle:visible').click();
      });

  })(jQuery); // End of use strict
