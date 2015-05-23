'use strict';

angular.module('julesApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/visualizations', {
        templateUrl: 'app/dataVisualizer/dataVisualizer.html',
        controller: 'DataVisualizerCtrl'
      });
  });
