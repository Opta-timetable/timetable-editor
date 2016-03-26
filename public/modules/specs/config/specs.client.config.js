'use strict';

// Configuring the Articles module
angular.module('specs').run(['Menus',
  function(Menus) {
    // Set top bar menu items
    Menus.addMenuItem('topbar', 'Allocations', 'specs', 'dropdown', '/specs(/create)?', null, null, 5);
    Menus.addSubMenuItem('topbar', 'specs', 'List Allocations', 'specs');
    Menus.addSubMenuItem('topbar', 'specs', 'New Allocation', 'specs/create');
    Menus.addSubMenuItem('topbar', 'specs', 'New Allocation from Existing', 'specs/createFromExisting');
  }
]);
