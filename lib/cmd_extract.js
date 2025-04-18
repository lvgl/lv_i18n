// Extract new texts & update translations.
'use strict';


const SourceKeys      = require('./source_keys');
const TranslationKeys = require('./translation_keys');
const AppError        = require('./app_error');

const { getPluralKeys }  = require('./plurals');


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
      type:     'str',
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
      action:       'store_true',
      default: false
    }
  },
  {
    args:     [ '--orphaned-fail' ],
    options: {
      dest:         'orphaned_fail',
      help:         'stop with error on orphaner phrases',
      action:       'store_true',
      default: false
    }
  },
  {
    args:     [ '--dump-sourceref' ],
    options: {
      dest:         'dump_sourceref',
      help:         'dump the location of the extracted message keys to the given file',
      metavar:  '<filename>'
    }
  }
];


module.exports.execute = function (args) {
  /* eslint no-console: off */
  let sourceKeys = new SourceKeys();
  let translationKeys = new TranslationKeys();

  sourceKeys.loadFiles(args.sources);

  if (!sourceKeys.filesCount) {
    throw new AppError ('Failed to find any source file');
  }

  if (!sourceKeys.keys.length) {
    console.log('No phrases to translate');
    return;
  }

  translationKeys.loadFiles(args.translations);

  // We should have locales to fill with keys. Those may be missed only
  // when no files found at all (file without locale will fail to load).
  if (!translationKeys.filesCount) {
    throw new AppError (`
Failed to find any translation file. Create empty templates with locale names
to start. Example:

File "en-EN.yml", content - "en-GB: ~"
`);
  }

  //
  // Check orphaned phrases
  //
  let orphaned = {};

  translationKeys.phrases.forEach(p => {
    if (!sourceKeys.uniques.hasOwnProperty(p.key)) {
      if (!orphaned[p.fileName]) orphaned[p.fileName] = [];

      orphaned[p.fileName].push(p.key);
    }
  });

  if (Object.keys(orphaned).length) {
    let msg_orphaned = 'Your translations have orphaned phrases:\n\n';

    Object.entries(orphaned).forEach(([ file, keys ]) => {
      msg_orphaned += `  ${file}\n`;
      msg_orphaned += keys.map(k => `    ${k}\n`).join('');
    });

    if (args.orphaned_fail) throw new AppError(msg_orphaned);
    else console.log(msg_orphaned);
  }

  //
  // fill missed phrases
  //
  Object.entries(translationKeys.localeDefaultFile).forEach(([ locale, fileName ]) => {
    Object.entries(sourceKeys.uniques).forEach(([ keyName, keyObj ]) => {
      let phraseObj = translationKeys.getPhraseObj(locale, keyName);

      if (!phraseObj) {
        // Not exists -> add new one
        translationKeys.addPhrase({
          locale,
          key: keyName,
          value: !keyObj.plural ? null : Object.fromEntries(getPluralKeys(locale).map(k => [ k, null ])),
          fileName
        });
      } else if (!(phraseObj.value?.constructor === Object) !== !keyObj.plural) {
        // Translation already exists -> check type (singular/plural)
        // and throw on mismatch
        throw new AppError(`
"${keyName}" - mixed singular/plural in source and translation

${keyObj.fileName}
${phraseObj.fileName}
`);
      }
    });
  });

  translationKeys.saveFiles();

  if (args.dump_sourceref) {
    sourceKeys.dumpSourceRef(args.dump_sourceref);
  }
};
