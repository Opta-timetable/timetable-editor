angular.module('core').controller('ConfirmationDialogController',
  function ($scope, $modalInstance, message) {

  $scope.confirmationMessage = message;
  $scope.selection = {confirm: false};

  $scope.ok = function () {
    $scope.selection.confirm = true;
    $modalInstance.close($scope.selection);
  };

  $scope.cancel = function () {
    $scope.selection.confirm = false;
    $modalInstance.dismiss('Cancel');
  };
});
