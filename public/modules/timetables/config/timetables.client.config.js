'use strict';

// Timetables module config
angular.module('timetables').run(['Menus',
  function (Menus) {
    // Set top bar menu items
    Menus.addMenuItem('topbar', 'Timetables', 'timetables', 'item', '/timetables');
  }
]);
