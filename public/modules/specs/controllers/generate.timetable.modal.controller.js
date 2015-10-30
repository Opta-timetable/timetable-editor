'use strict';
angular.module('specs').controller('GenerateModalInstanceCtrl', function ($scope, $modalInstance, $http, $interval, $timeout, specId) {

  $scope.specId = specId;
  $scope.progress = 0;
  $scope.state = 'Initializing';
  $scope.solutionHealth = 'Unavailable';
  $scope.disableStop = false;
  console.log('SpecID for this modal is ' + specId);
  var worstScore = 0; //Used for Progress indicator

  $scope.checkProgress = function(){
    $http.get('/specs/' + $scope.specId + '/solution')
      .success(function (data, status, headers, config) {
        console.log('Invoked isSolving successfully');
        console.log('Data is ' + data);
        getCurrentStatusAndScore(data);
        $scope.progress = calculateProgress($scope.solutionHealth, $scope.progress); //TODO calculateProgress(); using current number of hard constraints which is a reasonable indicator

      })
      .error(function (data, status, headers, config) {
        console.log('Error while getting solution status');
      });
    };

  $scope.progressPromise = $interval($scope.checkProgress, 10000); //Check every 10 secs

  $scope.terminateSolving = function(){
    console.log('You want to solve? Are you sure?');
    $http.delete('/specs/' + $scope.specId + '/solution')
      .success(function (data, status, headers, config) {
        console.log('Terminated Solving');
      })
      .error(function (data, status, headers, config) {
        console.log('Error in termination');
      });
    $interval.cancel($scope.progressPromise);
    $modalInstance.close();
  };

  $scope.dismiss = function(){
    $interval.cancel($scope.progressPromise);
    $modalInstance.close();
  };

  function getHardConstraints(score){
    var re = /\d+/;
   var hardConstraints = score.match(re);
    if (hardConstraints !== null && hardConstraints.length >= 1 ){
      console.log('Hard Constraints =' + hardConstraints[0]);
      return parseInt(hardConstraints[0]);
    }
    return 0; //send a default and let the progress incrementer take care
  }

  function parseSolutionFile(){
    $scope.state = 'Importing Solution to Database...';
    $http.get('/specs/' + $scope.specId + '/solutionFile')
      .success(function (data, status, headers, config){
        console.log('Got and parsed solution');
        $scope.state = 'Complete';
      })
      .error(function (data, status, headers, config){
        console.log('Error in picking solution');
        $scope.state = 'Error. Please retry...';
      });
  }

  // Parse response to get Solution state and score values
  function getCurrentStatusAndScore(response){
    var tokenisedString = response.split(', ');
    if (tokenisedString.length !== 2){
      console.log('Incorrect Response format. Unable to calculate progress');
      $scope.state = 'Error';
    }else{
      var stateString = tokenisedString[0];
      var scoreString = tokenisedString[1];
      if (stateString.split(': ')[1].indexOf('true') !== -1){ //contains 'true'
        $scope.state = 'Solving';
      }else{
        $scope.state = 'Solution complete. Waiting for solution...';
        $scope.disableStop = true;
        $scope.progress = 100;
        $interval.cancel($scope.progressPromise);
        //Pick up the solution file after waiting for the closing formalities to get done at the J2EE server
        $timeout(parseSolutionFile(), 10000);
      }
      $scope.solutionHealth = scoreString.split(': ')[1];
    }
  }

  // Use the highest hard constraints and current hard constraints value and use it for find out solution progress
  // As the solution progresses, the number of hard constraints will reduce
  function calculateProgress(newScore, currentProgress){
    var newHardConstraints = getHardConstraints(newScore);
    if (newHardConstraints > worstScore){
      worstScore = newHardConstraints;
    }

    if (worstScore !== 0 && newScore < worstScore){
      var newProgress = 100 - (100/worstScore)*currentProgress;
      return newProgress;
    }
    //In the unlikely case the hard constraints starts at 0, there is no other way to find the progress. So give the user some indication of activity
    return currentProgress+1;

  }

});
