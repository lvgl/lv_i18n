// Stuff to operate with source (C/CPP) files
//
'use strict';


const glob      = require('glob').sync;
const debug     = require('debug')('sourcee_keys');
const AppError  = require('./app_error');
const parse     = require('./parser');

const { readFileSync } = require('fs');


module.exports = class SourceKeys {
  constructor() {
    this.filesCount = 0;

    this.keys = [];

    // Used to check conflicts, when key is used as both singular and plural
    // Contain first entry of key.
    this.uniques = {};
  }

  addKey(obj) {
    let { key, line, plural, fileName } = obj;

    if (!this.uniques.hasOwnProperty(key)) {
      this.uniques[key] = obj;
    } else if (this.uniques[key].plural !== plural) {
      throw new AppError (`
Conflicting key '${key}' - should not be used as singular and plural at once.

Files:

${fileName}, line ${line}
${this.uniques[key].fileName}, line ${this.uniques[key].line}
`);
    }

    this.keys.push(obj);
  }

  // convenient for testing, to inline content
  loadText(text, fileName) {
    debug(`Load: ${fileName}`);

    let result = parse(text).map(k => Object.assign(k, { fileName }));

    result.forEach(k => this.addKey(k));

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
};
