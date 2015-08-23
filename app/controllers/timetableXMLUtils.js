'use strict';
var mongoose = require('mongoose'),
  xml2js = require('xml2js'),
  fs = require('fs');


// Models
var Course = mongoose.model('Course');
var Period = mongoose.model('Period');
var Lecture = mongoose.model('Lecture');
var Curriculum = mongoose.model('Curriculum');
var Teacher = mongoose.model('Teacher');
var Timetable = mongoose.model('Timetable');

var uniqueId = 0;
var rawData = [];
var idProvider = function () {
  uniqueId++;
  return uniqueId;
};

//a util for utils
var arrayContains = function (array, property, value) {
  var found = false;
  for (var i = 0; i < array.length; i++) {
    if (array[i][property] === value) {
      found = true;
      break;
    }
  }
  return found;
};

var Curriculums = function () {
  //id, curriculumID, code
  this.curriculumList = [];
  this.curriculumListID = idProvider();
  this.addCurriculum = function (curriculumCode) {
    if (arrayContains(this.curriculumList, 'code', curriculumCode)) {
      console.log('Curriculum Already added');
    } else {
      var newCurriculum = {};
      newCurriculum.id = idProvider();
      newCurriculum.curriculumID = this.curriculumList.length;
      newCurriculum.code = curriculumCode;

      this.curriculumList.push(newCurriculum);
      console.log('Added curriculum : ' + curriculumCode);
    }
  };
  this.getCurriculumListXMLContent = function (xmlwriter) {
    //<curriculumList id="6">
    //<Curriculum id="7">
    //<id>0</id>
    //<code>10-A</code>
    //</Curriculum>
    //...
    //</curriculumList>
    var xmlcontent = xmlwriter.startElement('curriculumList').writeAttribute('id', this.curriculumListID);
    for (var j = 0; j < this.curriculumList.length; j++) {
      xmlcontent.startElement('Curriculum').writeAttribute('id', this.curriculumList[j].id);
      xmlcontent.writeElement('id', this.curriculumList[j].curriculumID);
      xmlcontent.writeElement('code', this.curriculumList[j].code);
      xmlcontent.endElement();
    }
    xmlcontent.endElement(); //curriculumList
    return xmlcontent;
  };
  this.getCurriculumIDFromCode = function (classCode) {
    for (var i = 0; i < this.curriculumList.length; i++) {
      if (this.curriculumList[i].code === classCode) {
        return this.curriculumList[i].id;
      }
    }
  };
};

var curriculums = new Curriculums();

var Teachers = function () {
  //id, teacherID, code
  this.teacherList = [];
  this.teacherListID = idProvider();
  this.addTeacher = function (teacherCode) {
    if (arrayContains(this.teacherList, 'code', teacherCode)) {
      console.log('Teacher already added');
    } else {
      var newTeacher = {};
      newTeacher.id = idProvider();
      newTeacher.teacherID = this.teacherList.length;
      newTeacher.code = teacherCode;
      this.teacherList.push(newTeacher);
      console.log('Added teacher : ' + teacherCode);
    }
  };
  this.getTeacherListXMLContent = function (xmlwriter) {
    var xmlcontent = xmlwriter.startElement('teacherList').writeAttribute('id', this.teacherListID);
    for (var j = 0; j < this.teacherList.length; j++) {
      xmlcontent.startElement('Teacher').writeAttribute('id', this.teacherList[j].id);
      xmlcontent.writeElement('id', this.teacherList[j].teacherID);
      xmlcontent.writeElement('code', this.teacherList[j].code);
      xmlcontent.endElement(); //Teacher
    }
    xmlcontent.endElement(); //teacherList
    return xmlcontent;
  };
  this.getTeacherIDFromCode = function (code) {
    for (var i = 0; i < this.teacherList.length; i++) {
      if (this.teacherList[i].code === code) {
        return this.teacherList[i].id;
      }
    }
  };
};

var teachers = new Teachers();

var Lectures = function () {
  //<lectureList id="81">
  //<Lecture id="82">
  //<id>0</id>
  //<course reference="11"/>
  //<lectureIndexInCourse>0</lectureIndexInCourse>
  //<locked>false</locked>
  //<period reference="72"/> --> This is inserted by optaplanner solver
  //<room reference="76"/> --> This is inserted by optaplanner solver
  //</Lecture>
  this.lectureList = [];
  this.lectureListID = idProvider();
  this.addLecture = function (courseReference, lectureIndexInCourse, locked) {
    var lecture = {};
    lecture.id = idProvider();
    lecture.lectureID = this.lectureList.length;
    lecture.courseReference = courseReference;
    lecture.lectureIndexInCourse = lectureIndexInCourse;
    lecture.locked = locked;
    this.lectureList.push(lecture);
  };
  this.getLectureListXMLContent = function (xmlwriter) {
    var xmlcontent = xmlwriter.startElement('lectureList').writeAttribute('id', this.lectureListID);
    for (var j = 0; j < this.lectureList.length; j++) {
      xmlcontent.startElement('Lecture').writeAttribute('id', this.lectureList[j].id);
      xmlcontent.writeElement('id', this.lectureList[j].lectureID);
      xmlcontent.startElement('course').writeAttribute('reference', this.lectureList[j].courseReference);
      xmlcontent.endElement(); //course
      xmlcontent.writeElement('lectureIndexInCourse', this.lectureList[j].lectureIndexInCourse);
      xmlcontent.writeElement('locked', this.lectureList[j].locked);
      xmlcontent.endElement();//Lecture
    }
    xmlcontent.endElement();//lectureList
    return xmlcontent;
  };
};

var lectures = new Lectures();

var Courses = function () {
  //<courseList id="10">
  //<Course id="11">
  //<id>0</id>
  //<code>Maths</code>
  //<teacher reference="4"/>
  //<lectureSize>6</lectureSize>
  //<minWorkingDaySize>4</minWorkingDaySize>
  //<curriculumList id="12">
  //<Curriculum reference="7"/>
  //</curriculumList>
  //<studentSize>10</studentSize>
  //</Course>
  this.courseList = [];
  this.courseListID = idProvider();
  this.addCourse = function (classCode, teacherCode, courseCode, lecturesInAWeek) {
    var course = {};
    course.id = idProvider();
    course.courseID = this.courseList.length;
    course.code = courseCode;
    course.teacherReference = teachers.getTeacherIDFromCode(teacherCode);
    course.lectureSize = lecturesInAWeek;
    course.minWorkingDaySize = 4; //Hardcoding a constraint
    //In timetables for schools - one course belongs to only one curriculum
    course.curriculumListID = idProvider();
    course.curriculumReference = curriculums.getCurriculumIDFromCode(classCode);
    //Hardcoding another constraint. Since all rooms can take 100 students, this constraint will always satisfy
    course.studentSize = 20;
    this.courseList.push(course);
    //Done with the Course, Add the corresponding lectures for the course
    for (var k = 0; k < lecturesInAWeek; k++) {
      lectures.addLecture(course.id, k, 'false');
    }
  };
  this.getCourseXMLContent = function (xmlwriter) {
    var xmlcontent = xmlwriter.startElement('courseList').writeAttribute('id', this.courseListID);
    for (var j = 0; j < this.courseList.length; j++) {
      xmlcontent.startElement('Course').writeAttribute('id', this.courseList[j].id);
      xmlcontent.writeElement('id', this.courseList[j].courseID);
      xmlcontent.writeElement('code', this.courseList[j].code);
      xmlcontent.startElement('teacher').writeAttribute('reference', this.courseList[j].teacherReference);
      xmlcontent.endElement(); //teacher
      xmlcontent.writeElement('lectureSize', this.courseList[j].lectureSize);
      xmlcontent.writeElement('minWorkingDaySize', this.courseList[j].minWorkingDaySize);
      xmlcontent.startElement('curriculumList').writeAttribute('id', this.courseList[j].curriculumListID);
      xmlcontent.startElement('Curriculum').writeAttribute('reference', this.courseList[j].curriculumReference);
      xmlcontent.endElement();//Curriculum
      xmlcontent.endElement();//curriculumList
      xmlcontent.writeElement('studentSize', this.courseList[j].studentSize);
      xmlcontent.endElement();//Course
    }
    xmlcontent.endElement(); //courseList
    return xmlcontent;
  };

};

var Rooms = function () {
  //Set Rooms same as Curriculum, Each class will have their own dedicated room for most schools
  //This 'hard constraint' will always be satisfied and ignored for all practical purposes
  //<roomList id="75">
  //<Room id="76">
  //<id>0</id>
  //<code>A</code>
  //<capacity>50</capacity>
  //</Room>
  this.roomList = [];
  this.roomListID = idProvider();
  this.addRoom = function (roomCode) {
    if (arrayContains(this.roomList, 'code', roomCode)) {
      console.log('Room already added');
    } else {
      var newRoom = {};
      newRoom.id = idProvider();
      newRoom.roomID = this.roomList.length;
      newRoom.code = roomCode;
      newRoom.capacity = 100; //hardcoding here as well, assuming less than 100 students in each class
      this.roomList.push(newRoom);
      console.log('Added room : ' + roomCode);
    }
  };
  this.getRoomListXMLContent = function (xmlwriter) {
    var xmlcontent = xmlwriter.startElement('roomList').writeAttribute('id', this.roomListID);
    for (var j = 0; j < this.roomList.length; j++) {
      xmlcontent.startElement('Room').writeAttribute('id', this.roomList[j].id);
      xmlcontent.writeElement('id', this.roomList[j].roomID);
      xmlcontent.writeElement('code', this.roomList[j].code);
      xmlcontent.writeElement('capacity', this.roomList[j].capacity);
      xmlcontent.endElement();//Room
    }
    xmlcontent.endElement(); //roomList
    return xmlcontent;
  };
};

var Days = function () {
  this.dayList = [];
  this.periodList = [];
  this.timeslotList = [];
  this.dayListID = idProvider();
  this.init = function () {
    for (var dayCount = 0; dayCount < 5; dayCount++) { //5 days in a week
      var day = {};
      day.id = idProvider();
      day.dayID = dayCount;
      day.dayIndex = dayCount;
      day.periodList = [];
      day.periodListID = idProvider();
      for (var periodCount = 0; periodCount < 8; periodCount++) { //8 periods in a day
        var period = {};
        period.id = idProvider();
        period.periodID = dayCount * periodCount + periodCount;
        period.dayReference = day.id;
        var timeslot = {};
        if (dayCount === 0) {
          timeslot.id = idProvider();
          timeslot.timeslotID = periodCount;
          timeslot.timeslotIndex = periodCount;
          this.timeslotList.push(timeslot);
          period.timeslot = timeslot;
        } else {
          period.timeslotReference = this.timeslotList[periodCount].id;
        }
        day.periodList.push(period);
        this.periodList.push(period.id);
      }
      this.dayList.push(day);
    }
  };
  this.getDayListXMLContent = function (xmlwriter) {
    //<dayList id="29">
    //<Day id="30">
    //<id>0</id>
    //<dayIndex>0</dayIndex>
    //<periodList id="31">
    //<Period id="32">
    //<id>0</id>
    //<day reference="30"/>
    //<timeslot id="33">
    //<id>0</id>
    //<timeslotIndex>0</timeslotIndex>
    //</timeslot>
    //</Period>
    var xmlcontent = xmlwriter.startElement('dayList').writeAttribute('id', this.dayListID);
    for (var j = 0; j < this.dayList.length; j++) {
      xmlcontent.startElement('Day').writeAttribute('id', this.dayList[j].id);
      xmlcontent.writeElement('id', this.dayList[j].dayID);
      xmlcontent.writeElement('dayIndex', this.dayList[j].dayIndex);
      xmlcontent.startElement('periodList').writeAttribute('id', this.dayList[j].periodListID);
      for (var k = 0; k < this.dayList[j].periodList.length; k++) {
        xmlcontent.startElement('Period')
          .writeAttribute('id', this.dayList[j].periodList[k].id);
        xmlcontent.writeElement('id', this.dayList[j].periodList[k].periodID);
        xmlcontent.startElement('day').writeAttribute('reference', this.dayList[j].periodList[k].dayReference);
        xmlcontent.endElement(); //Day
        if (j === 0) {
          xmlcontent.startElement('timeslot')
            .writeAttribute('id', this.dayList[j].periodList[k].timeslot.id);
          xmlcontent.writeElement('id', this.dayList[j].periodList[k].timeslot.timeslotID);
          xmlcontent.writeElement('timeslotIndex', this.dayList[j].periodList[k].timeslot.timeslotIndex);
          xmlcontent.endElement();
        } else {
          xmlcontent.startElement('timeslot')
            .writeAttribute('reference', this.dayList[j].periodList[k].timeslotReference);
          xmlcontent.endElement(); //timeslot
        }
        xmlcontent.endElement(); //Period
      }
      xmlcontent.endElement(); //periodList
      xmlcontent.endElement(); //Day
    }
    xmlcontent.endElement(); //dayList
    return xmlcontent;
  };

  this.getTimeslotListXMLContent = function (xmlwriter) {
    //<timeslotList id="73">
    //  <Timeslot reference="33"/>
    //  <Timeslot reference="35"/>
    //</timeslotList>
    var xmlcontent = xmlwriter.startElement('timeslotList').writeAttribute('id', idProvider());
    for (var k = 0; k < this.timeslotList.length; k++) {
      xmlcontent.startElement('Timeslot').writeAttribute('reference', this.timeslotList[k].id);
      xmlcontent.endElement(); //Timeslot
    }
    xmlcontent.endElement(); //timeslotList
    return xmlcontent;
  };

  this.getPeriodListXMLContent = function (xmlwriter) {
    //<periodList id="74">
    //  <Period reference="72"/>
    //    ...
    //</periodList>
    var xmlcontent = xmlwriter.startElement('periodList').writeAttribute('id', idProvider());
    for (var l = 0; l < this.periodList.length; l++) {
      xmlcontent.startElement('Period').writeAttribute('reference', this.periodList[l]);
      xmlcontent.endElement(); //Period
    }
    xmlcontent.endElement(); //periodList
    return xmlcontent;
  };
};

exports.addRawData = function (row) {
  rawData.push(row);
};

exports.prepareXML = function (opfile) {
  var XMLWriter = require('xml-writer'),
    fs = require('fs');
  var ws = fs.createWriteStream(opfile);
  ws.on('close', function () {
    console.log(fs.readFileSync(opfile, 'UTF-8'));
  });
  var xw = new XMLWriter(true);
  xw.startDocument();
  xw.startElement('CourseSchedule').writeAttribute('id', idProvider());
  xw.writeElement('id', idProvider());
  xw.writeElement('name', 'Not Applicable');
  console.log('Length of Row Data ' + rawData.length);
  //Enough of fooling around and start with the real work...
  var rooms = new Rooms();
  var courses = new Courses();
  for (var rowCount = 0; rowCount < rawData.length; rowCount++) {
    curriculums.addCurriculum(rawData[rowCount].Class);
    teachers.addTeacher(rawData[rowCount].Teacher);
    rooms.addRoom(rawData[rowCount].Class); //Assuming 1 room for 1 class
    courses.addCourse(rawData[rowCount].Class, rawData[rowCount].Teacher,
      rawData[rowCount].Subject, rawData[rowCount].PeriodsInAWeek);

  }
  console.log('After adding all curriculums, list is ' + JSON.stringify(curriculums.curriculumList));
  console.log('list of Teachers ' + JSON.stringify(teachers.teacherList));

  //Prepare the XML for the items in the order present in the sample XMLs
  teachers.getTeacherListXMLContent(xw);
  curriculums.getCurriculumListXMLContent(xw);
  courses.getCourseXMLContent(xw);

  //Initialise the days/periods/timeslots based on hardcoded values
  //Values will be picked up from a preference.json file later
  var days = new Days();
  days.init();
  days.getDayListXMLContent(xw);
  days.getTimeslotListXMLContent(xw); //timeslots are contained inside dayList array
  days.getPeriodListXMLContent(xw); //periods are contained inside periodList array

  //unavailablePeriodPenalty is left empty for now. Feature will be added in next cut
  xw.startElement('unavailablePeriodPenaltyList').writeAttribute('id', idProvider());
  xw.endElement(); //unavailablePeriodPenaltyList

  rooms.getRoomListXMLContent(xw);
  lectures.getLectureListXMLContent(xw);

  xw.endElement(); //CourseSchedule
  xw.endDocument();

  //console.log("Final XML is : " + xw.toString());
  //Write to opfile
  ws.write(xw.toString(), 'UTF-8');
  ws.end();

};

//Parse Solved XML and upload the data to the database
exports.solvedXMLParser = function (specID, filename, callback) {

  //mongoose.connect('mongodb://localhost/timetable-dev');
  //mongoose.connect('mongodb://kollavarsham:kollavarsham@ds039281.mongolab.com:39281/heroku_app36869144');
  var saveCount = 0;
  //var specID = specID;

  var closeConnectionIfComplete = function () {
    saveCount--;
    if (saveCount === 0) {
      console.log('All Saves Complete. Closing Connection.');
      //mongoose.disconnect();
      callback();
    } else {
      console.log('Other Saves in progress... ' + saveCount);
    }
  };

  // Save callbacks

  var saveTimetableCallback = function (err) {
    closeConnectionIfComplete();
    if (err) {
      return console.error(err);
    } else {
      console.log('Saving timetable to DB');
      return;
    }
  };

  var saveCourseCallback = function (err /*, course */) {
    closeConnectionIfComplete();
    if (err) {
      return console.error(err);
    } else {
      console.log('saving course to DB');
      return;
    }
  };

  var savePeriodCallback = function (err /*, day */) {
    closeConnectionIfComplete();
    if (err) {
      return console.error(err);
    } else {
      console.log('saving period to DB');
      return;
    }
  };

  var saveLectureCallback = function (err /*, lecture */) {
    closeConnectionIfComplete();
    if (err) {
      return console.error(err);
    } else {
      console.log('saved lecture to DB');
      return;
    }
  };

  var saveCurriculumCallback = function (err /*, curriculum */) {
    closeConnectionIfComplete();
    if (err) {
      return console.error(err);
    } else {
      console.log('saved Curriculum to DB');
      return;
    }
  };

  var saveTeacherCallback = function (err /*, teacher */) {
    closeConnectionIfComplete();
    if (err) {
      return console.error(err);
    } else {
      console.log('saving teacher to DB');
      return;
    }
  };

  // To convert 'lectures' to a timetable to store in DB
  var EmptyTimeTableDays = function () {

    // new Array() is not recommended because of the ambiguity in the two types of parameters it takes
    // read more here: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
    // var timeTableData = new Array();
    var timeTableData = [];
    var dayName = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    //Initialise - Assuming hardcoded metadata (number of days, number of periods)
    // If we're anyway hard-coding what is the point of doing it two places?
    // Rather than the magic number 5 below, we could iterate through the dayName array above, right?
    for (var i = 0; i < 5; i++) {
      var allocationsForDayOfWeek = {};
      allocationsForDayOfWeek.dayOfWeek = dayName[i];
      allocationsForDayOfWeek.dayIndex = i;
      allocationsForDayOfWeek.periods = [];
      for (var k = 0; k < 8; k++) {
        var period = {};
        period.index = k;
        period.subject = '';
        period.teacher = '';
        period.clash = false;
        allocationsForDayOfWeek.periods.push(period);
      }
      timeTableData.push(allocationsForDayOfWeek);
    }
    return timeTableData;
  };

  console.log('You entered file: ' + filename);

  var parser = new xml2js.Parser({'explicitArray' : false});

  fs.readFile(filename, function (err, data) {
    parser.parseString(data, function (err, result) {

      // cache xml lists into variables to improve brevity
      var courseList = result.CourseSchedule.courseList.Course;
      var dayList = result.CourseSchedule.dayList.Day;
      var lectureList = result.CourseSchedule.lectureList.Lecture;
      var curriculumList = result.CourseSchedule.curriculumList.Curriculum;
      var teacherList = result.CourseSchedule.teacherList.Teacher;

      //Trick to close mongoose connections after all entities are saved
      saveCount = courseList.length + //Courses
      dayList.length * dayList[0].periodList.Period.length + //periods
      lectureList.length + //lectures
      (2 * curriculumList.length) + //Curriculums + corresponding timetables
      teacherList.length; //Teachers

      console.log('Total Number of Entities to Save: ' + saveCount);

      for (var i = 0; i < courseList.length; i++) {
        var course = new Course();
        course._id = parseInt(courseList[i].$.id);
        course.courseID = courseList[i].id;
        course.code = courseList[i].code;
        course.teacherID = courseList[i].teacher.$.reference;
        course.lectureSize = courseList[i].lectureSize;
        course.minWorkingDaySize = courseList[i].minWorkingDaySize;
        course.curriculumReference = courseList[i].curriculumList.Curriculum.$.reference;
        course.studentSize = courseList[i].studentSize;
        course.specReference = specID;

        //Teacher Reference
        for (var j = 0; j < teacherList.length; j++) {
          //item is teacher
          if (course.teacherID === teacherList[j].$.id) {
            //located the teacher
            course._teacher = teacherList[j].$.id;
            break;
          }
        }
        course.save(saveCourseCallback);
      }

      for (var k = 0; k < dayList.length; k++) {
        var dayIndex = dayList[k].dayIndex;
        var timeSlotIndex = 0;
        for (var l = 0; l < dayList[k].periodList.Period.length; l++) {
          var period = new Period();
          period._id = parseInt(dayList[k].periodList.Period[l].$.id);
          period.periodID = dayList[k].periodList.Period[l].id;
          period.dayIndex = dayIndex;
          period.timeslotIndex = timeSlotIndex++; //maintaining an incremented index instead of cross-referencing
          period.save(savePeriodCallback);
        }
      }

      //periods
      //Period list doesn't seem to carry any value, I am not taking it for now

      for (var m = 0; m < lectureList.length; m++) {
        var lecture = new Lecture();
        lecture.id = lectureList[m].$.id;
        lecture.lectureID = lectureList[m].id;
        lecture.lectureIndexInCourse = lectureList[m].lectureIndexInCourse;
        lecture.locked = lectureList[m].locked;
        lecture.roomReference = lectureList[m].room.$.reference;

        for (var a = 0; a < courseList.length; a++) {
          if (courseList[a].$.id ===
            lectureList[m].course.$.reference) {
            lecture._course = parseInt(courseList[a].$.id);
            break;
          }
        }

        for (var b = 0; b < dayList.length; b++) {
          for (var c = 0; c < dayList[b].periodList.Period.length; c++) {
            if (lectureList[m].period.$.reference ===
              dayList[b].periodList.Period[c].$.id) {
              lecture._period = parseInt(dayList[b].periodList.Period[c].$.id);
            }
          }
        }

        lecture.save(saveLectureCallback);
      }

      for (var n = 0; n < curriculumList.length; n++) {
        var curriculum = new Curriculum();
        curriculum.id = curriculumList[n].$.id;
        curriculum.curriculumID = curriculumList[n].id;
        curriculum.code = curriculumList[n].code;
        curriculum.specReference = specID;

        //Timetable for this curriculum
        var timetableForCurriculum = new Timetable();
        timetableForCurriculum.curriculumReference = curriculum.id;
        timetableForCurriculum.curriculumCode = curriculum.code;
        timetableForCurriculum.days = new EmptyTimeTableDays();
        timetableForCurriculum.specReference = specID;

        //Go through courses and find the ones for this curriculum
        for (var p = 0; p < courseList.length; p++){
          if (courseList[p].curriculumList.Curriculum.$.reference === curriculum.id){
            //Found a course belonging to this curriculum, find it's lectures
            for (var q = 0; q < lectureList.length; q++){
              if (lectureList[q].course.$.reference === courseList[p].$.id){
                //Got a lecture, find the period
                for (var r = 0; r < dayList.length; r++) {
                  for (var s = 0; s < dayList[r].periodList.Period.length; s++) {
                    if (lectureList[q].period.$.reference ===
                      dayList[r].periodList.Period[s].$.id) {
                      //Found it's period. Place in the right location in the placeholder
                      //timetableForCurriculum.days[r].periods[s].clash = false;
                      timetableForCurriculum.days[r].periods[s].subject = courseList[p].code;
                      for (var t = 0; t < teacherList.length; t++){
                        if (teacherList[t].$.id === courseList[p].teacher.$.reference){
                          timetableForCurriculum.days[r].periods[s].teacher =
                            teacherList[t].code;
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        //Save to MongoDB
        timetableForCurriculum.save(saveTimetableCallback);
        curriculum.save(saveCurriculumCallback);

      }

      for (var o = 0; o < teacherList.length; o++) {
        var teacher = new Teacher();
        teacher._id = teacherList[o].$.id;
        teacher.teacherID = teacherList[o].id;
        teacher.code = teacherList[o].code;
        teacher.specReference = specID;

        teacher.save(saveTeacherCallback);
      }
    });
  });

};
