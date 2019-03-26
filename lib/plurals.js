// Assorted plurals helpers
'use strict';


const _ = require('lodash');
const plural_categories = require('make-plural/umd/pluralCategories');


module.exports.getPluralKeys = function (locale) {
  let lang = locale.toLowerCase().split(/[-_]/)[0];

  return plural_categories[lang]['cardinal'];
};

////////////////////////////////////////////////////////////////////////////////

const cardinals = require('make-plural/data/plurals.json').supplemental['plurals-type-cardinal'];

// Strip key prefixes to get clear names: zero / one / two / few / many / other
function renameKeys(rules) {
  var result = {};
  Object.keys(rules).forEach(function (k) {
    result[k.match(/[^-]+$/)] = rules[k];
  });
  return result;
}


const pf_enum = {
  zero:  'LV_I18N_PLURAL_TYPE_ZERO',
  one:   'LV_I18N_PLURAL_TYPE_ONE',
  two:   'LV_I18N_PLURAL_TYPE_TWO',
  few:   'LV_I18N_PLURAL_TYPE_FEW',
  many:  'LV_I18N_PLURAL_TYPE_MANY',
  other: 'LV_I18N_PLURAL_TYPE_OTHER'
};

function toSingleRule(str) {
  // replace A or B or C => (A) or (B) or (C),
  // to suppress -Werror=parentheses warnings
  str = str.split('or').map(s => `(${s.trim()})`).join(' || ');

  return str
    // replace modulus with shortcuts
    .replace(/([nivwft]) % (\d+)/g, '$1$2')
    // replace ranges
    .replace(/([nivwft]\d*) (=|\!=) (\d+[.,][.,\d]+)/g, function (match, v, cond, range) {
      // range = 5,8,9 (simple set)
      if (range.indexOf('..') < 0 && range.indexOf(',') >= 0) {
        if (cond === '=') {
          return `(${range.split(',').map(r => `(${v} == ${r})`).join(' || ')})`;
        }
        return `(!(${range.split(',').map(r => `(${v} == ${r})`).join(' || ')}))`;
      }
      // range = 0..5 or 0..5,8..20 or 0..5,8
      var conditions = range.split(',').map(function (interval) {
        // simple value
        if (interval.indexOf('..') < 0) {
          return `(${v} ${cond} ${interval})`;
        }
        // range
        var start = interval.split('..')[0],
            end   = interval.split('..')[1];
        if (cond === '=') {
          return `(${start} <= ${v} && ${v} <= ${end})`;
        }
        return  `(!(${start} <= ${v} && ${v} <= ${end}))`;
      });

      var joined;
      if (conditions.length > 1) {
        joined =  '(' + conditions.join(cond === '=' ? ' || ' : ' && ') + ')';
      } else {
        joined = conditions[0];
      }
      return joined;
    })
    .replace(/ = /g, ' == ')
    //.replace(/ != /g, ' !== ')
    .replace(/ or /g, ' || ')
    .replace(/ and /g, ' && ');
}

module.exports.create_c_plural_fn = function (locale, fn_name) {
  let cldr_rules = renameKeys(cardinals[locale.toLowerCase().split('-')[0]]);

  let conditions = {};

  _.forEach(cldr_rules, (rule, form) => {
    if (form === 'other') return;

    conditions[form] = toSingleRule(rule.split('@')[0].trim());
  });

  let operands  = _.uniq(_.values(conditions).join(' ').match(/[nivwft]/g) || []);

  let shortcuts = _.uniq(_.values(conditions).join(' ').match(/[nivwft]\d+/g) || []);
  /*eslint-disable max-len*/
  return `
static uint8_t ${fn_name}(int32_t num)
{${operands.length ? '\n    uint32_t n = op_n(num); UNUSED(n);' : ''}
${operands.map(op => (op !== 'n' ? `    uint32_t ${op} = op_${op}(n); UNUSED(${op});` : '')).filter(Boolean).join('\n')}
${shortcuts.map(sh => `    uint32_t ${sh} = ${sh[0]} % ${sh.slice(1)};`).join('\n')}
${_.map(conditions, (cond, form) => `    if (${cond}) return ${pf_enum[form]};`).join('\n')}
    return ${pf_enum.other};
}
`.trim();
};
