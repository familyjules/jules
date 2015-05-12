'use strict';

angular.module('julesApp')
  .controller('NavbarCtrl', function ($scope, $location) {
    $scope.menu = [
      {
        'title': 'Home',
        'link': '/'
      },
      {
        'title': 'Visualizations',
        'link': '/dataVisualizer'
      },
      {
        'title': 'About Us',
        'link': '/about'
      }
    ];

    $scope.isCollapsed = true;

    $scope.isActive = function(route) {
      return route === $location.path();
    };
  });