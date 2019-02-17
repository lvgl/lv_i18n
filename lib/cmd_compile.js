// "Compile" translations to C code.
'use strict';


module.exports.subparserInfo = {
  command:  'compile',
  options:  {
    description:  'Generate compiled translations'
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
    args:     [ '-o' ],
    options: {
      dest:     'output',
      help:     'output file path',
      type:     'string',
      metavar:  '<path>',
      required: true
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
