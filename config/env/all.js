'use strict';

module.exports = {
  app               : {
    title       : 'Timetable Editor',
    description : 'An awesome web-app for creating/editing timetables that uses Apache OptaPlanner behind the scenes.',
    keywords    : 'timetable, optaplanner'
  },
  port              : process.env.PORT || 3000,
  templateEngine    : 'swig',
  sessionSecret     : 'MEAN',
  sessionCollection : 'sessions',
  assets            : {
    lib   : {
      css : [
        'public/lib/bootstrap/dist/css/bootstrap.css',
        'public/lib/bootstrap/dist/css/bootstrap-theme.css',
        'public/lib/isteven-angular-multiselect/angular-multi-select.css'
      ],
      js  : [
        'public/lib/angular/angular.js',
        'public/lib/angular-resource/angular-resource.js',
        'public/lib/angular-cookies/angular-cookies.js',
        'public/lib/angular-animate/angular-animate.js',
        'public/lib/angular-touch/angular-touch.js',
        'public/lib/angular-sanitize/angular-sanitize.js',
        'public/lib/angular-ui-router/release/angular-ui-router.js',
        'public/lib/angular-ui-utils/ui-utils.js',
        'public/lib/angular-bootstrap/ui-bootstrap-tpls.js',
        'public/lib/ngDraggable/ngDraggable.js',
        'public/lib/ng-table-to-csv/dist/ng-table-to-csv.js',
        'public/lib/angular-breadcrumb/release/angular-breadcrumb.js',
        'public/lib/ng-file-upload/ng-file-upload-all.js',
        'public/lib/isteven-angular-multiselect/angular-multi-select.js',
        'public/lib/spin.js/spin.js',
        'public/lib/angular-spinner/angular-spinner.js'

      ]
    },
    css   : [
      'public/modules/**/css/*.css'
    ],
    js    : [
      'public/config.js',
      'public/application.js',
      'public/modules/*/*.js',
      'public/modules/*/*[!tests]*/*.js'
    ],
    tests : [
      'public/lib/angular-mocks/angular-mocks.js',
      'public/modules/*/tests/*.js'
    ]
  }
};
