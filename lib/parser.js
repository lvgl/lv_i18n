// Parser to extract translateable texts from source string
//
// TODO: current implementation is very simplified.
//
'use strict';


const _ = require('lodash');


const defaults = {
  singularName: '_',
  pluralName: '_p'
};

function create_singular_re(fn_name) {
  return new RegExp(
    '(?:^|[ =+,;\(])' + _.escapeRegExp(fn_name) + '\\("(.*?)"\\)',
    'g'
  );
}

function create_plural_re(fn_name) {
  return new RegExp(
    '(?:^|[ =+,;\(])' + _.escapeRegExp(fn_name) + '\\("(.*?)",',
    'g'
  );
}

// unescape C/C++ literal
// https://en.wikipedia.org/wiki/Escape_sequences_in_C
// https://timsong-cpp.github.io/cppwp/n3337/lex.ccon
let unescape_c_table = {
  a: 0x07, b: 0x08, e: 0x1b, E: 0x1b, f: 0x0c,
  n: 0x0a, r: 0x0d, t: 0x09, v: 0x0b
};

function unescape_c(src) {
  return src.replace(/\\U([0-9A-Fa-f]{8})|\\u([0-9A-Fa-f]{4})|\\x([0-9A-Fa-f]{1,4})|\\([0-7]{1,3})|\\(.)/g,
    function (_, unicode32, unicode16, hex, octal, simple) {
      let code;
      if (unicode32) {
        code = parseInt(unicode32, 16);
      } else if (unicode16) {
        code = parseInt(unicode16, 16);
      } else if (hex) {
        code = parseInt(hex, 16);
      } else if (octal) {
        code = parseInt(octal, 8);
      } else {
        code = unescape_c_table[simple];
        if (typeof code === 'undefined') code = simple.codePointAt(0);
      }
      return String.fromCodePoint(code);
    });
}


function getLine(text, offset) {
  return text.substring(0, offset).split('\n').length;
}


function extract(text, re) {
  let result = [];

  for (;;) {
    let match = re.exec(text);

    if (!match) break;

    result.push({
      key: unescape_c(match[1]),
      line: getLine(text, match.index)
    });
  }

  return result;
}


module.exports = function parse(text, options) {
  let opts = Object.assign({}, defaults, options || {});

  let s_re = create_singular_re(opts.singularName);
  let p_re = create_plural_re(opts.pluralName);

  let singulars = extract(text, s_re).map(o => Object.assign(o, { plural:  false }));
  let plurals = extract(text, p_re).map(o => Object.assign(o, { plural:  true }));

  return _.sortBy(singulars.concat(plurals), 'line');
};

module.exports._unescape_c = unescape_c;
