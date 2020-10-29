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


function getLine(text, offset) {
  return text.substring(0, offset).split('\n').length;
}


function extract(text, re) {
  let result = [];

  for (;;) {
    let match = re.exec(text);

    if (!match) break;

    result.push({
      key: match[1],
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
