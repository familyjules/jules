'use strict';

angular.module('julesApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/dataVisualizer', {
        templateUrl: 'app/dataVisualizer/dataVisualizer.html',
        controller: 'DataVisualizerCtrl'
      });
  });
