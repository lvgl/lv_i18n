'use strict';


const { create_c_plural_fn } = require('./plurals');


// en-GB => en_gb
function to_c(locale) {
  return locale.toLowerCase().replace(/-/g, '_');
}

// escape C string to write all in one line.
function esc(str) {
  // TODO: simple & dirty, should be improved.
  return JSON.stringify(str).slice(1, -1);
}

const pf_enum = {
  zero:  'LV_I18N_PLURAL_TYPE_ZERO',
  one:   'LV_I18N_PLURAL_TYPE_ONE',
  two:   'LV_I18N_PLURAL_TYPE_TWO',
  few:   'LV_I18N_PLURAL_TYPE_FEW',
  many:  'LV_I18N_PLURAL_TYPE_MANY',
  other: 'LV_I18N_PLURAL_TYPE_OTHER'
};


const plural_helpers = `
////////////////////////////////////////////////////////////////////////////////
// Define plural operands
// http://unicode.org/reports/tr35/tr35-numbers.html#Operands

// Integer version, simplified

#define UNUSED(x) (void)(x)

static inline uint32_t op_n(int32_t val) { return (uint32_t)(val < 0 ? -val : val); }
static inline uint32_t op_i(uint32_t val) { return val; }
// always zero, when decimal part not exists.
static inline uint32_t op_v(uint32_t val) { UNUSED(val); return 0;}
static inline uint32_t op_w(uint32_t val) { UNUSED(val); return 0; }
static inline uint32_t op_f(uint32_t val) { UNUSED(val); return 0; }
static inline uint32_t op_t(uint32_t val) { UNUSED(val); return 0; }
static inline uint32_t op_e(uint32_t val) { UNUSED(val); return 0; }
`.trim();


function lang_plural_template(l, form, data) {
  const loc = to_c(l);
  let result = '';

  result = `
static const char * ${loc}_plurals_${form}[] = {
`;

  let index = 0;
  Object.values(data.pluralKeys).forEach(k => {
    if (!data[l].plural || !data[l].plural[form] || !data[l].plural[form][k]) {
      result += '  NULL, // ' + index + '=\"' + esc(k) + '\"\n';
    } else {
      result += '  \"' + esc(data[l].plural[form][k]) + '\", // ' + index + '=\"' + esc(k) + '\"\n';
    }
    index++;
  });

  result += `};`;

  return result.trim();

}

function lang_singular_template(l, data) {
  const loc = to_c(l);
  let result = '';

  result = `
static const char * ${loc}_singulars[] = {
`;

  let index = 0;
  Object.values(data.singularKeys).forEach(k => {
    if (!data[l].singular || !data[l].singular[k]) {
      result += '  NULL, // ' + index + '=\"' + esc(k) + '\"\n';
    } else {
      result += '  \"' + esc(data[l].singular[k]) + '\", // ' + index + '=\"' + esc(k) + '\"\n';
    }
    index++;
  });

  result += `};`;

  return result.trim();
}


function lang_template(args, l, data) {
  let pforms = Object.keys(data[l].plural);
  const loc = to_c(l);

  return `
${Object.keys(data[l].singular).length ? lang_singular_template(l, data) : ''}

${pforms.map(pf => lang_plural_template(l, pf, data)).join('\n\n')}

${create_c_plural_fn(l, `${loc}_plural_fn`)}

static const lv_i18n_lang_t ${loc}_lang = {
    .locale_name = "${l}",
${Object.keys(data[l].singular).length ? `    .singulars = ${loc}_singulars,` : ''}
${pforms.map(pf => `    .plurals[${pf_enum[pf]}] = ${loc}_plurals_${pf},`).join('\n')}
    .locale_plural_fn = ${loc}_plural_fn
};
`.trim();
}

function generate_idx(keys) {
  let result = '';
  Object.values(keys).forEach(k => {
    result += '\"' + esc(k) + '\",\n';
  });

  return result;
}

function getIDX2(keys, i) {
  let result = 'LV_I18N_ID_NOT_FOUND';

  let key = keys[i];
  if (key) {
    result = '(!strcmp(str, \"' + esc(key) + '\")?' + i + ':' + getIDX2(keys, i + 1) + ')';
  }
  return result;
}

module.exports.getIDX = function (data) {
  let result = '#define LV_I18N_IDX_s(str) ' + getIDX2(data.singularKeys, 0) + '\n';
  result += '#define LV_I18N_IDX_p(str) ' + getIDX2(data.pluralKeys, 0) + '\n';
  return result;
};

module.exports.getRAW = function (args, locales, data) {
  return `
${plural_helpers}

${locales.map(l => lang_template(args, l, data)).join('\n\n')}

const lv_i18n_language_pack_t lv_i18n_language_pack[] = {
${locales.map(l => `    &${to_c(l)}_lang,`).join('\n')}
    NULL // End mark
};

#ifndef LV_I18N_OPTIMIZE

static const char * singular_idx[] = {
${generate_idx(data.singularKeys)}
};

static const char * plural_idx[] = {
${generate_idx(data.pluralKeys)}
};

#endif

`;
};
