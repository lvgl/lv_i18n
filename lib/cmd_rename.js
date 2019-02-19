// Rename translation key in all files.
'use strict';


const TranslationKeys = require('./translation_keys');
const AppError        = require('./app_error');


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
      metavar:  '<old_name>',
      required: true
    }
  },
  {
    args:     [ '--to' ],
    options: {
      dest:     'to',
      help:     'new translation key name',
      metavar:  '<new_name>',
      required: true
    }
  }
];


module.exports.execute = function (args) {
  let translationKeys = new TranslationKeys();

  translationKeys.loadFiles(args.translations);

  if (!translationKeys.filesCount) {
    throw new AppError ('Failed to find any translation file');
  }


  if (!translationKeys.phrases.find(p => p.key === args.from)) {
    throw new AppError(`Could not find key '${args.from}' in any translation`);
  }

  /* eslint-disable no-console */
  console.log('Renaming...');

  // Traverse locales
  Object.keys(translationKeys.localeDefaultFile).forEach(locale => {
    let obj = translationKeys.getPhraseObj(locale, args.from);

    // If key found in this locale - drop destination entry & rename
    if (obj) {
      translationKeys.removePhraseObj(locale, args.to);
      obj.key = args.to;
      console.log(obj.fileName);
    }
  });

  translationKeys.saveFiles();

  console.log('Done!');
};
