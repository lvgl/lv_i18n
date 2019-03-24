// "Compile" translations to C code.
'use strict';


const _               = require('lodash');
const TranslationKeys = require('./translation_keys');
const AppError        = require('./app_error');
const shell           = require('shelljs');

const { join }           = require('path');
const compiler_template  = require('./compiler_template');

const { readFileSync, writeFileSync }  = require('fs');


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
      action:   'append',
      metavar:  '<path>',
      required: true
    }
  },
  {
    args:     [ '-o' ],
    options: {
      dest:     'output',
      help:     'output folder path',
      metavar:  '<path>'
    }
  },
  {
    args:     [ '--raw' ],
    options: {
      dest:     'output_raw',
      help:     'raw output file path',
      metavar:  '<path>'
    }
  },
  {
    args:     [ '-l' ],
    options: {
      dest:         'base_locale',
      help:         'base locale (default: en/en-GB/en-US)',
      metavar:      '<locale>'
    }
  }
];


module.exports.execute = function (args) {
  let translationKeys = new TranslationKeys();

  translationKeys.loadFiles(args.translations);

  if (!translationKeys.filesCount) {
    throw new AppError ('Failed to find any translation file.');
  }

  if (args.base_locale && !translationKeys.localeDefaultFile[args.base_locale]) {
    throw new AppError(`
You specified base locale "${args.base_locale}", but it was not found in loaded translations.
Found locales are {${Object.keys(translationKeys.localeDefaultFile).join(',')}}.
`);
  }

  if (!args.base_locale) {
    // Try to guess locale (en / en-GB / en-US)
    for (let guess of [ 'en', 'en-GB', 'en-US' ]) {
      /*eslint-disable max-depth*/
      for (let l of Object.keys(translationKeys.localeDefaultFile)) {
        if ((l.toLowerCase().replace(/_/g, '-') === guess.toLowerCase()) &&
            !args.base_locale) {
          args.base_locale = l;
        }
      }
    }

    if (!args.base_locale) {
      throw new AppError(`
You did not specified locale and we could not autodetect it. Use '-l' option.
`);
    }

    /*eslint-disable no-console*/
    console.log(`Base locale '${args.base_locale}' (autodetected)`);
  }

  if (!args.output && !args.output_raw) {
    throw new AppError('You should specify output folder or raw output file option');
  }

  //
  // Create sorted locales, with default one first.
  //
  let sorted_locales = [ args.base_locale ];

  Object.keys(translationKeys.localeDefaultFile).forEach(locale => {
    if (locale !== args.base_locale) sorted_locales.push(locale);
  });

  //
  // Fill data
  //
  let data = {};

  // Pre-fill .singular & plural props for edge case - missed locale
  sorted_locales.forEach(l => {
    _.set(data, [ l, 'singular' ], {});
    _.set(data, [ l, 'plural' ], {});
  });


  translationKeys.phrases.forEach(p => {
    if (p.value === null) return;

    // Singular
    if (!_.isPlainObject(p.value)) {
      _.set(data, [ p.locale, 'singular', p.key ], p.value);
      return;
    }

    // Plural
    _.forEach(p.value, (val, form) => {
      if (val === null) return;

      _.set(data, [ p.locale, 'plural', form, p.key ], val);
    });

  });

  let raw = compiler_template(sorted_locales, data);

  if (args.output_raw) {
    writeFileSync(args.output_raw, raw);
  }

  if (args.output) {
    if (!shell.test('-d', args.output)) {
      throw new AppError(`Output directory not exists (${args.output})`);
    }

    shell.cp(join(__dirname, '../src/lv_i18n.h'), join(args.output, 'lv_i18n.h'));

    let txt = readFileSync(join(__dirname, '../src/lv_i18n.template.c'), 'utf-8');

    txt = txt.replace(/\/\*SAMPLE_START\*\/([\s\S]+)\/\*SAMPLE_END\*\//,
      `${raw}
////////////////////////////////////////////////////////////////////////////////`);

    writeFileSync(join(args.output, 'lv_i18n.c'), txt);
  }
};
