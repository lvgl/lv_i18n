#include "./lv_i18n.h"

// Internal state
static const lv_i18n_language_pack_t * current_lang_pack;
static const lv_i18n_lang_t * current_lang;

/*SAMPLE_START*/

////////////////////////////////////////////////////////////////////////////////
// Define plural operands
// http://unicode.org/reports/tr35/tr35-numbers.html#Operands

// Integer version, simplified

#define UNUSED(x) (void)(x)

static inline uint32_t op_n(int32_t val) { return (uint32_t)(val < 0 ? -val : val); }
static inline uint32_t op_i(uint32_t val) { return val; }
// always zero, when decimal part not exists.
static inline uint32_t op_v(uint32_t val) { UNUSED(val); return 0; }
static inline uint32_t op_w(uint32_t val) { UNUSED(val); return 0; }
static inline uint32_t op_f(uint32_t val) { UNUSED(val); return 0; }
static inline uint32_t op_t(uint32_t val) { UNUSED(val); return 0; }
static inline uint32_t op_e(uint32_t val) { UNUSED(val); return 0; }

static const char * en_gb_singulars[] = {
  "english only", // 0="s_en_only"
  "s translated", // 1="s_translated"
  NULL, // 2="s_untranslated"
};

static const char * en_gb_plurals_one[] = {
  "I have %d dog", // 0="p_i_have_dogs"
};

static const char * en_gb_plurals_other[] = {
  "I have %d dogs", // 0="p_i_have_dogs"
};

static uint8_t en_gb_plural_fn(int32_t num)
{
    uint32_t n = op_n(num); UNUSED(n);
    uint32_t i = op_i(n); UNUSED(i);
    uint32_t v = op_v(n); UNUSED(v);

    if ((i == 1 && v == 0)) return LV_I18N_PLURAL_TYPE_ONE;
    return LV_I18N_PLURAL_TYPE_OTHER;
}

static const lv_i18n_lang_t en_gb_lang = {
    .locale_name = "en-GB",
    .singulars = en_gb_singulars,
    .plurals[LV_I18N_PLURAL_TYPE_ONE] = en_gb_plurals_one,
    .plurals[LV_I18N_PLURAL_TYPE_OTHER] = en_gb_plurals_other,
    .locale_plural_fn = en_gb_plural_fn
};

static const char * ru_ru_singulars[] = {
  NULL, // 0="s_en_only"
  "s переведено", // 1="s_translated"
  NULL, // 2="s_untranslated"
};

static const char * ru_ru_plurals_one[] = {
  "У меня %d собакен", // 0="p_i_have_dogs"
};

static const char * ru_ru_plurals_few[] = {
  "У меня %d собакена", // 0="p_i_have_dogs"
};

static const char * ru_ru_plurals_many[] = {
  "У меня %d собакенов", // 0="p_i_have_dogs"
};

static uint8_t ru_ru_plural_fn(int32_t num)
{
    uint32_t n = op_n(num); UNUSED(n);
    uint32_t v = op_v(n); UNUSED(v);
    uint32_t i = op_i(n); UNUSED(i);
    uint32_t i10 = i % 10;
    uint32_t i100 = i % 100;
    if ((v == 0 && i10 == 1 && i100 != 11)) return LV_I18N_PLURAL_TYPE_ONE;
    if ((v == 0 && (2 <= i10 && i10 <= 4) && (!(12 <= i100 && i100 <= 14)))) return LV_I18N_PLURAL_TYPE_FEW;
    if ((v == 0 && i10 == 0) || (v == 0 && (5 <= i10 && i10 <= 9)) || (v == 0 && (11 <= i100 && i100 <= 14))) return LV_I18N_PLURAL_TYPE_MANY;
    return LV_I18N_PLURAL_TYPE_OTHER;
}

static const lv_i18n_lang_t ru_ru_lang = {
    .locale_name = "ru-RU",
    .singulars = ru_ru_singulars,
    .plurals[LV_I18N_PLURAL_TYPE_ONE] = ru_ru_plurals_one,
    .plurals[LV_I18N_PLURAL_TYPE_FEW] = ru_ru_plurals_few,
    .plurals[LV_I18N_PLURAL_TYPE_MANY] = ru_ru_plurals_many,
    .locale_plural_fn = ru_ru_plural_fn
};

static uint8_t de_de_plural_fn(int32_t num)
{
    uint32_t n = op_n(num); UNUSED(n);
    uint32_t i = op_i(n); UNUSED(i);
    uint32_t v = op_v(n); UNUSED(v);

    if ((i == 1 && v == 0)) return LV_I18N_PLURAL_TYPE_ONE;
    return LV_I18N_PLURAL_TYPE_OTHER;
}

static const lv_i18n_lang_t de_de_lang = {
    .locale_name = "de-DE",


    .locale_plural_fn = de_de_plural_fn
};

const lv_i18n_language_pack_t lv_i18n_language_pack[] = {
    &en_gb_lang,
    &ru_ru_lang,
    &de_de_lang,
    NULL // End mark
};

#ifndef LV_I18N_OPTIMIZE

static const char * singular_idx[] = {
"s_en_only",
"s_translated",
"s_untranslated",

};

static const char * plural_idx[] = {
"p_i_have_dogs",

};

#endif


/*SAMPLE_END*/

/**
 * Get the translation from a message ID
 * @param msg_id message ID
 * @param msg_index the index of the msg_id
 * @return the translation of `msg_id` on the set local
 */
const char * lv_i18n_get_singular_by_idx(const char *msg_id, int msg_index)
{
    if(current_lang == NULL || msg_index == LV_I18N_ID_NOT_FOUND) return msg_id;

    const lv_i18n_lang_t * lang = current_lang;
    const char * txt;

    // Search in current locale
    if(lang->singulars != NULL) {
        txt = lang->singulars[msg_index];
        if (txt != NULL) return txt;
    }

    // Try to fallback
    if(lang == current_lang_pack[0]) return msg_id;
    lang = current_lang_pack[0];

    // Repeat search for default locale
    if(lang->singulars != NULL) {
        txt = lang->singulars[msg_index];
        if (txt != NULL) return txt;
    }

    return msg_id;
}

/**
 * Get the translation from a message ID and apply the language's plural rule to get correct form
 * @param msg_id message ID
 * @param msg_index the index of the msg_id
 * @param num an integer to select the correct plural form
 * @return the translation of `msg_id` on the set local
 */
const char * lv_i18n_get_plural_by_idx(const char * msg_id, int msg_index, int32_t num)
{
    if(current_lang == NULL || msg_index == LV_I18N_ID_NOT_FOUND) return msg_id;

    const lv_i18n_lang_t * lang = current_lang;
    const char * txt;
    lv_i18n_plural_type_t ptype;

    // Search in current locale
    if(lang->locale_plural_fn != NULL) {
        ptype = lang->locale_plural_fn(num);

        if(lang->plurals[ptype] != NULL) {
            txt = lang->plurals[ptype][msg_index];
            if (txt != NULL) return txt;
        }
    }

    // Try to fallback
    if(lang == current_lang_pack[0]) return msg_id;
    lang = current_lang_pack[0];

    // Repeat search for default locale
    if(lang->locale_plural_fn != NULL) {
        ptype = lang->locale_plural_fn(num);

        if(lang->plurals[ptype] != NULL) {
            txt = lang->plurals[ptype][msg_index];
            if (txt != NULL) return txt;
        }
    }

    return msg_id;
}

#ifdef LV_I18N_OPTIMIZE
// Modern compilers calculate phrase IDs at compile time

#else
// Fallback for ancient compilers, search phrase IDs in runtime (slow)

static int __lv_i18n_get_id(const char * phrase, const char * * list, int len)
{
    uint16_t i;
    for(i = 0; i < len; i++) {
        if(strcmp(list[i], phrase) == 0) return i;
    }
    return LV_I18N_ID_NOT_FOUND;
}

int lv_i18n_get_singular_id(const char * phrase)
{
    return __lv_i18n_get_id(phrase, singular_idx, sizeof(singular_idx) / sizeof(singular_idx[0]));
}

int lv_i18n_get_plural_id(const char * phrase)
{
    return __lv_i18n_get_id(phrase, plural_idx, sizeof(plural_idx) / sizeof(plural_idx[0]));
}

#endif


////////////////////////////////////////////////////////////////////////////////



/**
 * Reset internal state. For testing.
 */
void __lv_i18n_reset(void)
{
    current_lang_pack = NULL;
    current_lang = NULL;
}

/**
 * Set the languages for internationalization
 * @param langs pointer to the array of languages. (Last element has to be `NULL`)
 */
int lv_i18n_init(const lv_i18n_language_pack_t * langs)
{
    if(langs == NULL) return -1;
    if(langs[0] == NULL) return -1;

    current_lang_pack = langs;
    current_lang = langs[0];     /*Automatically select the first language*/
    return 0;
}

/**
 * Sugar for simplified `lv_i18n_init` call
 */
int lv_i18n_init_default(void)
{
    return lv_i18n_init(lv_i18n_language_pack);
}

/**
 * Change the localization (language)
 * @param l_name name of the translation locale to use. E.g. "en-GB"
 */
int lv_i18n_set_locale(const char * l_name)
{
    if(current_lang_pack == NULL) return -1;

    uint16_t i;

    for(i = 0; current_lang_pack[i] != NULL; i++) {
        // Found -> finish
        if(strcmp(current_lang_pack[i]->locale_name, l_name) == 0) {
            current_lang = current_lang_pack[i];
            return 0;
        }
    }

    return -1;
}

/**
 * Get the name of the currently used locale.
 * @return name of the currently used locale. E.g. "en-GB"
 */
const char * lv_i18n_get_current_locale(void)
{
    if(!current_lang) return NULL;
    return current_lang->locale_name;
}
