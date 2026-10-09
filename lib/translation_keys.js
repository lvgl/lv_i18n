// Stuff to operate with translation (YAML) files
//
'use strict';


const glob      = require('glob').sync;
const yaml      = require('yaml');
const debug     = require('debug')('translate_keys');
const AppError  = require('./app_error');

const { getPluralKeys }   = require('./plurals');
const { readFileSync, writeFileSync }  = require('fs');


function isValidSingularValue(val) {
  return val === null || typeof val === 'string';
}

function normalize_locale(l) {
  return l.toLowerCase().replace(/_/g, '-');
}


function keyOf(pair) {
  return yaml.isScalar(pair.key) ? pair.key.value : pair.key;
}

// Update YAML map node in place to match `data`, keeping nodes (and their
// comments) for entries with unchanged values. Keys absent in `data` are
// removed, except at the top level (locales without phrases are kept).
function syncMap(doc, map, data, isRoot = true) {
  if (!isRoot) {
    map.items = map.items.filter(pair => data.hasOwnProperty(keyOf(pair)));
  }

  Object.entries(data).forEach(([ key, value ]) => {
    let node = map.get(key, true);

    if (value?.constructor === Object) {
      if (!yaml.isMap(node)) {
        // Replace `~` (or anything else) with an empty map, but keep
        // comments attached to the old value
        let newNode = doc.createNode({});
        if (node) {
          newNode.comment = node.comment;
          newNode.commentBefore = node.commentBefore;
        }
        map.set(key, newNode);
        node = newNode;
      }
      // Avoid growing `{}` into a long single-line flow mapping
      if (Object.keys(value).some(k => !node.has(k))) node.flow = false;
      syncMap(doc, node, value, false);
      return;
    }

    if (yaml.isScalar(node) && node.value === value) return;

    if (yaml.isScalar(node)) {
      // Keep the node itself to preserve its comments
      node.value = value;
      delete node.source;
      delete node.type;
    } else {
      map.set(key, doc.createNode(value));
    }
  });
}


module.exports = class TranslationKeys {
  constructor() {
    this.filesCount = 0;
    // First occurence of locales, used to guess where to add
    // new phrases
    this.localeDefaultFile = {};

    this.phrases = [];

    // Parsed YAML documents by file name, kept to preserve comments
    // and formatting on save
    this.documents = {};
  }

  addPhrase(obj) {
    let { locale, key, value, fileName } = obj;
    // value can be:
    // - null (empty)
    // - string
    // - object (plural)
    if (!isValidSingularValue(value) && (value?.constructor !== Object)) {
      throw new AppError(`
Error in ${fileName}
Wrong value for '${key}', should be string, plural object or null ('~')
`);
    }

    // Additional check for plurals
    if (value?.constructor === Object) {
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
    this.phrases = this.phrases.filter(p => !(p.locale === locale && p.key === key));
  }

  // Rename phrase key, keeping its position & comments in the source file
  renamePhrase(locale, from, to) {
    let obj = this.getPhraseObj(locale, from);

    if (!obj) return null;

    this.removePhraseObj(locale, to);
    obj.key = to;

    let map = this.documents[obj.fileName]?.contents?.get(locale, true);

    if (yaml.isMap(map)) {
      map.delete(to);
      let pair = map.items.find(p => keyOf(p) === from);

      if (pair) {
        if (yaml.isScalar(pair.key)) {
          pair.key.value = to;
          delete pair.key.source;
          delete pair.key.type;
        } else {
          pair.key = to;
        }
      }
    }

    return obj;
  }

  // convenient for testing, to inline content
  loadText(text, fileName) {
    debug(`Load: ${fileName}`);

    let doc = yaml.parseDocument(text);

    if (doc.errors.length) {
      let err = doc.errors[0];
      err.message = `${fileName}: ${err.message}`;
      throw err;
    }

    if (doc.contents === null) {
      throw new AppError(`
Error in ${fileName}
Empty file, should contain locale name entry at least:

en-GB: {}
`);
    }

    let obj = doc.toJS();

    if (obj?.constructor !== Object) {
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
    Object.entries(obj).forEach(([ locale, content ]) => {
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

      if (content?.constructor !== Object) {
        throw new AppError(`
Error in ${fileName}
Locale '${locale}' content should be an object
`);
      }

      //
      // load phrases
      //
      Object.entries(content).forEach(([ key, value ]) => {
        this.addPhrase({
          locale,
          key,
          value,
          fileName
        });
      });
    });

    this.documents[fileName] = doc;
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

    this.phrases.forEach(({ fileName, locale, key, value }) => {
      if (!result[fileName]) result[fileName] = {};
      if (!result[fileName][locale]) result[fileName][locale] = {};
      result[fileName][locale][key] = value;
    });

    return result;
  }

  saveFiles() {
    let data = this.createFilesData();

    Object.entries(data).forEach(([ fileName, content ]) => {
      let doc = this.documents[fileName];

      if (doc) {
        syncMap(doc, doc.contents, content);
      } else {
        doc = new yaml.Document(content);
        this.documents[fileName] = doc;
      }

      writeFileSync(fileName, doc.toString({ nullStr: '~' }));
    });
  }
};

