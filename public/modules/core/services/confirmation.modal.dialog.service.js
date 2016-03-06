'use strict';

angular.module('core').factory('ConfirmationDialogService', [
  function () {
    var confirmationDialogService = {};
    confirmationDialogService.confirm = false;
    confirmationDialogService.setConfirmation = function(val){
      this.confirm = val;
    };
    return confirmationDialogService;
  }
]);
