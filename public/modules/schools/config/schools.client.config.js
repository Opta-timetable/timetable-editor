'use strict';

// Configuring the Articles module
angular.module('schools').run(['Menus',
	function(Menus) {
		// Set top bar menu items
		Menus.addMenuItem('topbar', 'Schools', 'schools', 'dropdown', '/schools(/create)?');
		Menus.addSubMenuItem('topbar', 'schools', 'List Schools', 'schools');
		Menus.addSubMenuItem('topbar', 'schools', 'New School', 'schools/create');
	}
]);