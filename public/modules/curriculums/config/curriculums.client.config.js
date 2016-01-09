'use strict';

// Configuring the Articles module
angular.module('curriculums').run(['Menus',
	function(Menus) {
		// Set top bar menu items
    //Hiding "Curriculums" as it is internal
		//Menus.addMenuItem('topbar', 'Curriculums', 'curriculums', 'dropdown', '/curriculums(/create)?');
		//Menus.addSubMenuItem('topbar', 'curriculums', 'List Curriculums', 'curriculums');
		//Menus.addSubMenuItem('topbar', 'curriculums', 'New Curriculum', 'curriculums/create');
	}
]);
