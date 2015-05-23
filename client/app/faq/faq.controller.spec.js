'use strict';

describe('Controller: FaqCtrl', function () {

  // load the controller's module
  beforeEach(module('julesApp'));

  var AboutCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    AboutCtrl = $controller('FaqCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
