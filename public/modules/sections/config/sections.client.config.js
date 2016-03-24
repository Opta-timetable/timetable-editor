'use strict';

// Configuring the Articles module
angular.module('sections').run(['Menus',
	function(Menus) {
		// Set top bar menu items
    // I wanted to create a module called "class" but JS didn't allow that. Used "Sections" instead for the module.
    // However, let the end user see "Classes" itself as that would make more sense
		Menus.addMenuItem('topbar', 'Sections', 'sections', 'dropdown', '/sections(/create)?', null, null, 2);
		Menus.addSubMenuItem('topbar', 'sections', 'List Sections', 'sections');
		Menus.addSubMenuItem('topbar', 'sections', 'New Section', 'sections/create');
	}
]);
