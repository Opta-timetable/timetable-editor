'use strict';

// Timetables module config
angular.module('timetables').run(['Menus',
	function(Menus) {
    // Set top bar menu items
    Menus.addMenuItem('topbar', 'Timetables', 'timetables', 'dropdown', '/timetables(/create)?');
    Menus.addSubMenuItem('topbar', 'timetables', 'List Timetables', 'timetables');
    Menus.addSubMenuItem('topbar', 'timetables', 'New Course', 'timetables/create');
	}
]);
