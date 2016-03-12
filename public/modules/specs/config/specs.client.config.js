'use strict';

// Configuring the Articles module
angular.module('specs').run(['Menus',
  function(Menus) {
    // Set top bar menu items
    Menus.addMenuItem('topbar', 'Plans', 'specs', 'dropdown', '/specs(/create)?', null, null, 5);
    Menus.addSubMenuItem('topbar', 'specs', 'List Plans', 'specs');
    Menus.addSubMenuItem('topbar', 'specs', 'New Plan', 'specs/create');
    Menus.addSubMenuItem('topbar', 'specs', 'New Plan from Existing', 'specs/createFromExisting');
  }
]);
