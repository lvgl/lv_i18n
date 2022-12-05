// "Compile" translations to C code.
'use strict';


const TranslationKeys = require('./translation_keys');
const AppError        = require('./app_error');
const shell           = require('shelljs');

const { join, dirname, basename, extname } = require('path');
const { getRAW, getIDX }         = require('./compiler_template');

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
      help:     'raw output file path for code containing language variables',
      metavar:  '<path>'
    }
  },
  {
    args:     [ '--optimize' ],
    options: {
      dest:     'optimize',
      help:     'Use integers as keys instead of strings to speed up lookup',
      action:   'store_true',
      default: false
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
  let data = {
    singularKeys: [],
    pluralKeys: []
  };

  // Pre-fill .singular & plural props for edge case - missed locale
  sorted_locales.forEach(l => {
    data[l] = { singular: {}, plural: {} };
  });

  translationKeys.phrases.forEach(p => {
    if (p.value?.constructor !== Object) {
      if (!data.singularKeys.includes(p.key)) {
        data.singularKeys.push(p.key);
      }
    } else if (!data.pluralKeys.includes(p.key)) {
      data.pluralKeys.push(p.key);
    }
  });
  data.singularKeys.sort();
  data.pluralKeys.sort();

  translationKeys.phrases.forEach(p => {
    if (p.value === null) return;

    // Singular
    if (p.value?.constructor !== Object) {
      Object.assign(data[p.locale]['singular'], { [p.key]: p.value });
      return;
    }

    // Plural
    Object.entries(p.value).forEach(([ form, val ]) => {
      if (val === null) return;

      if (!data[p.locale]['plural'][form]) data[p.locale]['plural'][form] = {};

      Object.assign(data[p.locale]['plural'][form], { [p.key]: val });
    });

  });

  let raw_idx = getIDX(data);
  let raw = getRAW(args, sorted_locales, data);

  if (args.output_raw) {
    writeFileSync(args.output_raw, raw);
    let output_raw_header = join(dirname(args.output_raw), basename(args.output_raw, extname(args.output_raw)) + '.h');
    writeFileSync(output_raw_header, raw_idx);
  }

  if (args.output) {
    if (!shell.test('-d', args.output)) {
      throw new AppError(`Output directory not exists (${args.output})`);
    }

    let txt_h = readFileSync(join(__dirname, '../src/lv_i18n.template.h'), 'utf-8');
    txt_h = txt_h.replace(/\/\*SAMPLE_START\*\/([\s\S]+)\/\*SAMPLE_END\*\//,
      `${raw_idx}
////////////////////////////////////////////////////////////////////////////////`);
    writeFileSync(join(args.output, 'lv_i18n.h'), txt_h);

    let txt = readFileSync(join(__dirname, '../src/lv_i18n.template.c'), 'utf-8');

    txt = txt.replace(/\/\*SAMPLE_START\*\/([\s\S]+)\/\*SAMPLE_END\*\//,
      `${raw}
////////////////////////////////////////////////////////////////////////////////`);

    writeFileSync(join(args.output, 'lv_i18n.c'), txt);
  }
};
