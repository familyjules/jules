'use strict';

angular.module('julesApp')
  .controller('DataVisualizerCtrl', function ($scope, $http) {
    $scope.message = 'goodbye';
    $scope.data;
    $scope.getData = function() {
      console.log('in data');
      $http({
      method: 'GET',
      url: '/api/d3/usa',
    })
    	.then(function(res) {
      		$scope.data = res.data
      		window.data = res.data
      		console.log('got response')
    	})
  	}
    $scope.getData()
  });
