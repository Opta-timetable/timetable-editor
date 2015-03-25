/*jshint unused: false */
'use strict';

angular.module('timetables').controller('TimetablesController', ['$scope', '$stateParams', '$location', 'Authentication', 'Timetables', 'Curriculums',
  function ($scope, $stateParams, $location, Authentication, Timetables, Curriculums) {
    $scope.authentication = Authentication;

    $scope.find = function () {
        //one timetable each for one curriculum
      $scope.curriculums = Timetables.query();
        //need to share with other views
      Curriculums.set($scope.curriculums);
    };
  }
]);

angular.module('timetables').controller('TimetableController', ['$scope', '$stateParams', '$location', 'Authentication', 'Timetables', 'Curriculums',
    function ($scope, $stateParams, $location, Authentication, Timetables, Curriculums) {
        $scope.authentication = Authentication;

        $scope.findOne = function () {
            Timetables.get({
                curriculumId : $stateParams.curriculumId
            }, function(result){
                //Translating lectures array into a timetable here. Have to discuss with Hari
                //using DataTables for now for helping with the export feature
                var timeTableData = [];
                var dayName = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

                //Initialise - Assuming hardcoded metadata (number of days, number of periods)
                for (var i=0; i<5; i++){
                    var allocationsForDayOfWeek = {};
                    allocationsForDayOfWeek.dayOfWeek = dayName[i];
                    allocationsForDayOfWeek.dayIndex = i;
                    for (var k=0; k<7; k++){
                        allocationsForDayOfWeek["Period-"+(k+1)] = "";
                    }
                    timeTableData.push(allocationsForDayOfWeek);
                }

                for(var j=0; j<result.lectures.length; j++){
                    var dayIndex = result.lectures[j]._period.dayIndex;
                    var period = result.lectures[j]._period.timeslotIndex;
                    var subject = result.lectures[j]._course.code;

                    timeTableData[parseInt(dayIndex)]["Period-"+(parseInt(period)+1)] = subject;
                }
                //console.log(JSON.stringify(timeTableData));
                $scope.timetable = timeTableData;
                //console.log("$scope.curriculums here : " + JSON.stringify($scope.curriculums));
                //Which curriculum was selected?
                var curriculums = Curriculums.get();
                for(var k=0; k<curriculums.length; k++){
                    if (curriculums[k].id === $stateParams.curriculumId){
                        $scope.curriculumSelected = curriculums[k];
                    }
                }
            });
        };
    }
]);
