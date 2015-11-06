'use strict';

// Configuring the Articles module
angular.module('subjects').run(['Menus',
	function(Menus) {
		// Set top bar menu items
		Menus.addMenuItem('topbar', 'Subjects', 'subjects', 'dropdown', '/subjects(/create)?');
		Menus.addSubMenuItem('topbar', 'subjects', 'List Subjects', 'subjects');
		Menus.addSubMenuItem('topbar', 'subjects', 'New Subject', 'subjects/create');
	}
]);