'use strict';

angular.module('julesApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/feed', {
        templateUrl: 'feed/feed.html',
        controller: 'FeedCtrl'
      });
  });
