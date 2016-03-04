'use strict';

// Configuring the Articles module
angular.module('specs').run(['Menus',
  function(Menus) {
    // Set top bar menu items
    Menus.addMenuItem('topbar', 'Specs', 'specs', 'dropdown', '/specs(/create)?', null, null, 5);
    Menus.addSubMenuItem('topbar', 'specs', 'List Specs', 'specs');
    Menus.addSubMenuItem('topbar', 'specs', 'New Spec', 'specs/create');
  }
]);
