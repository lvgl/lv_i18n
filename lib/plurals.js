// Assorted plurals helpers
'use strict';


const plural_categories = require('make-plural/umd/pluralCategories');


module.exports.getPluralKeys = function (locale) {
  let lang = locale.toLowerCase().split(/[-_]/)[0];

  return plural_categories[lang]['cardinal'];
};
