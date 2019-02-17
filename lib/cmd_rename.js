// Rename translation key in all files.
'use strict';


module.exports.subparserInfo = {
  command:  'rename',
  options:  {
    description:  'Rename key in all translation files'
  }
};


module.exports.subparserArgsList = [
  {
    args:     [ '-t' ],
    options: {
      dest:     'translations',
      help:     'translation file(s) path (glob patterns allowed)',
      type:     'string',
      action:   'append',
      metavar:  '<path>',
      required: true
    }
  },
  {
    args:     [ '--from' ],
    options: {
      dest:     'from',
      help:     'old translation key name',
      type:     'string',
      metavar:  '<old_name>',
      required: true
    }
  },
  {
    args:     [ '--to' ],
    options: {
      dest:     'to',
      help:     'new translation key name',
      type:     'string',
      metavar:  '<new_name>',
      required: true
    }
  }
];


module.exports.execute = function (args) {
  /* eslint no-console: off */
  console.log('Not implemented yet');
  console.log(args);
};
