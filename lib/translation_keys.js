// Stuff to operate with translation (YAML) files
//
'use strict';


const glob      = require('glob').sync;
const yaml      = require('js-yaml');
const _         = require('lodash');
const debug     = require('debug')('translate_keys');
const AppError  = require('./app_error');

const { getPluralKeys }   = require('./plurals');
const { readFileSync, writeFileSync }  = require('fs');


function isValidSingularValue(val) {
  return val === null || _.isString(val);
}

function normalize_locale(l) {
  return l.toLowerCase().replace(/_/g, '-');
}


module.exports = class TranslationKeys {
  constructor() {
    this.filesCount = 0;
    // First occurence of locales, used to guess where to add
    // new phrases
    this.localeDefaultFile = {};

    this.phrases = [];
  }

  addPhrase(obj) {
    let { locale, key, value, fileName } = obj;
    // value can be:
    // - null (empty)
    // - string
    // - object (plural)
    if (!isValidSingularValue(value) && !_.isPlainObject(value)) {
      throw new AppError(`
Error in ${fileName}
Wrong value for '${key}', should be string, plural object or null ('~')
`);
    }

    // Additional check for plurals
    if (_.isPlainObject(value)) {
      let validKeys = getPluralKeys(locale);
      Object.keys(value).forEach(k => {
        if (!validKeys.includes(k)) {
          throw new AppError(`
Error in ${fileName}
Bad plural key name '${k}' in '${key}'
Allowed values are: ${validKeys.join(', ')}
`);
        }

        if (!isValidSingularValue(value[k])) {
          throw new AppError(`
Error in ${fileName}
Bad plural value for '${k}' in '${key}', should be string or null ('~')
`);
        }
      });
    }

    this.phrases.push({
      locale,
      key,
      value,
      fileName
    });
  }

  getPhraseObj(locale, key) {
    return this.phrases.find(p => p.locale === locale && p.key === key);
  }

  removePhraseObj(locale, key) {
    this.phrases = _.filter(this.phrases, p => !(p.locale === locale && p.key === key));
  }

  // convenient for testing, to inline content
  loadText(text, fileName) {
    debug(`Load: ${fileName}`);

    let obj = yaml.safeLoad(text, { filename: fileName });

    if (typeof obj === 'undefined') {
      throw new AppError(`
Error in ${fileName}
Empty file, should contain locale name entry at least:

en-GB: {}
`);
    }

    if (!_.isPlainObject(obj)) {
      throw new AppError(`
Error in ${fileName}
Can not recognize content. Should be locale with phrase keys (or empty locale):

en-GB: {}

ru-RU:
  foo: bar
`);
    }

    if (!Object.keys(obj).length) {
      throw new AppError(`
Error in ${fileName}
No locales found, should have at least one
`);
    }

    // Validate locales name
    Object.keys(obj).forEach(locale => {
      if (!/^[a-zA-Z]+([-_][a-zA-Z]+)*$/.test(locale)) {
        throw new AppError(`
Error in ${fileName}
Bad locale name '${locale}'. Only english letters, '-' and '_' allowed:

en-GB, ru-RU, en
`);
      }
    });

    // scan locales data
    _.forEach(obj, (content, locale) => {
      debug(`Scan locale ${locale}`);

      Object.keys(this.localeDefaultFile).forEach(l => {
        if ((normalize_locale(l) === normalize_locale(locale)) && (l !== locale)) {
          throw new AppError(`
  Error in ${fileName}
  Locale '${locale}' was already defined as '${l}' in ${this.localeDefaultFile[l]}.

  You should use the same name everywhere.
  `);
        }
      });


      // Store default file name for locale
      if (!this.localeDefaultFile.hasOwnProperty(locale)) {
        this.localeDefaultFile[locale] = fileName;
      }

      // Workaround for special case - empty file with `en-GB:` created manually
      if (content === null) content = {};

      if (!_.isPlainObject(content)) {
        throw new AppError(`
Error in ${fileName}
Locale '${locale}' content should be an object
`);
      }

      //
      // load phrases
      //
      _.forEach(content, (value, key) => {
        this.addPhrase({
          locale,
          key,
          value,
          fileName
        });
      });
    });

    this.filesCount++;
  }

  loadFile(name) {
    this.loadText(readFileSync(name, 'utf8'), name);
  }

  loadFiles(paths) {
    paths.forEach(p => {
      glob(p, { nodir: true }).forEach(name => this.loadFile(name));
    });
  }

  createFilesData() {
    let result = {};

    this.phrases.forEach(p => {
      _.set(result, [ p.fileName, p.locale, p.key ], p.value);
    });

    return result;
  }

  saveFiles() {
    let data = this.createFilesData();

    _.forEach(data, (content, fileName) => {
      writeFileSync(fileName, yaml.safeDump(content, {
        styles: {
          '!!null': 'canonical'
        }
      }));
    });
  }
};
