// Extract new texts & update translations.
'use strict';


module.exports.subparserInfo = {
  command:  'extract',
  options:  {
    description:  'Scan sources and update translations with missed keys'
  }
};


module.exports.subparserArgsList = [
  {
    args:     [ '-s' ],
    options: {
      dest:     'sources',
      help:     'source file(s) path (glob patterns allowed)',
      type:     'string',
      action:   'append',
      metavar:  '<path>',
      required: true
    }
  },
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
    args:     [ '-c' ],
    options: {
      dest:         'check_only',
      help:         "check only, don't update translations",
      type:         'string',
      action:       'storeTrue',
      defaultValue: false
    }
  },
  {
    args:     [ '-l' ],
    options: {
      dest:         'base_locale',
      help:         "base locale (default: '%(defaultValue)s')",
      metavar:      '<locale>',
      type:         'string',
      defaultValue: 'en-GB'
    }
  }
];


module.exports.execute = function (args) {
  /* eslint no-console: off */
  console.log('Not implemented yet');
  console.log(args);
};
