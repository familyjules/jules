'use strict';

describe('Controller: DataVisualizerCtrl', function () {

  // load the controller's module
  beforeEach(module('julesApp'));

  var DataVisualizerCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    DataVisualizerCtrl = $controller('DataVisualizerCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
