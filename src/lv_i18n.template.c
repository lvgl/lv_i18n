#include "./lv_i18n.h"

/*-LV_I18N_READL_DATA_INJECT-*/

/*-LV_I18N_SAMPLE_DATA_START-*/
static lv_i18n_phrase_t en_gb_singulars[] = {
    {"scr1_title", "Title of screen 1"},
    {"scr1_dsc",   "This is a text on the first screen..."},
    {NULL, NULL},       /*Mark that there is no more translations*/
};


static lv_i18n_phrase_t en_gb_plurals_one[] = {
    {"dog", "I have only one dog."},
    {"cat", "My friend has only one cat."},
    {NULL, NULL},       /*Mark that there is no more translations*/
};


static lv_i18n_phrase_t en_gb_plurals_many[] = {
    {"dog", "I already have %d dogs."},
    {"cat", "My friend already has %d cats."},
    {NULL, NULL},       /*Mark that there is no more translations*/
};


static uint8_t en_gb_plural_fn(int32_t num)
{
    if(num == 1) return LV_I18N_PLURAL_TYPE_ONE;
    else return LV_I18N_PLURAL_TYPE_MANY;
}

static const lv_i18n_lang_t en_gb_lang = {
    .locale_name = "en-GB",
    .singulars = en_gb_singulars,
    .plurals[LV_I18N_PLURAL_TYPE_ONE] = en_gb_plurals_one,
    .plurals[LV_I18N_PLURAL_TYPE_MANY] = en_gb_plurals_many,
    .locale_plural_fn = en_gb_plural_fn,
};

const lv_i18n_lang_t * language_pack[] = {
    &en_gb_lang,    /*The first language will be the default*/
    NULL,           /*Mark that there is no more languages*/
};

/*- LV_I18N_SAMPLE_DATA_END-*/


const lv_i18n_lang_t ** languages;
const lv_i18n_lang_t * local_lang;


/**
 * Set the languages for internationalization
 * @param langs pointer to the array of languages. (Last element has to be `NULL`)
 */
int lv_i18n_init(const lv_i18n_lang_t ** langs)
{
    if(langs == NULL) return -1;
    if(langs[0] == NULL) return -1;

    languages = langs;
    local_lang = langs[0];     /*Automatically select the first language*/
    return 0;
}

/**
 * Change the localization (language)
 * @param l_name name of the translation locale to use. E.g. "en-GB"
 */
int lv_i18n_set_locale(const char * l_name)
{
    if(languages == NULL) return -1;

    uint16_t i;

    for(i = 0; languages[i] != NULL; i++) {
        // Found -> finish
        if(strcmp(languages[i]->locale_name, l_name) == 0) {
            local_lang = languages[i];
            return 0;
        }
    }

    return -1;
}


const void * __lv_i18n_get_text_core(lv_i18n_phrase_t * trans, const char * msg_id)
{
    uint16_t i;
    for(i = 0; trans[i].msg_id != NULL; i++) {
        if(strcmp(trans[i].msg_id, msg_id) == 0) {
            /*The msg_id has found. Check the translation*/
            if(trans[i].translation) return trans[i].translation;
        }
    }

    return NULL;
}


/**
 * Get the translation from a message ID
 * @param msg_id message ID
 * @return the translation of `msg_id` on the set local
 */
const void * lv_i18n_get_text(const char * msg_id)
{
    if(local_lang == NULL) return msg_id;

    const lv_i18n_lang_t * lang = local_lang;

    if(lang->singulars == NULL) {
        if(lang == languages[0]) return msg_id;
        else lang = languages[0];

        if(lang->singulars == NULL) return msg_id;
    }

    /*Find the translation*/
    const void * txt = __lv_i18n_get_text_core(lang->singulars, msg_id);
    if(txt == NULL) {
        if(lang == languages[0]) return msg_id;
        else lang = languages[0];
    }

    /*Try again with the default language*/
    if(lang->singulars == NULL) return msg_id;

    txt = __lv_i18n_get_text_core(lang->singulars, msg_id);
    if(txt == NULL) return msg_id;

    return txt;
}

/**
 * Get the translation from a message ID and apply the language's plural rule to get correct form
 * @param msg_id message ID
 * @param num an integer to select the correct plural form
 * @return the translation of `msg_id` on the set local
 */
const void * lv_i18n_get_text_plural(const char * msg_id, int32_t num)
{
    if(local_lang == NULL) return msg_id;

    const lv_i18n_lang_t * lang = local_lang;
    if(lang->plurals == NULL || lang->locale_plural_fn == NULL) {
        if(lang == languages[0]) return msg_id;
        else lang = languages[0];

        if(lang->plurals == NULL) return msg_id;
    }

    lv_i18n_plural_type_t ptype = lang->locale_plural_fn(num);

    if(lang->plurals[ptype] == NULL) {
        if(lang == languages[0]) return msg_id;
        else lang = languages[0];
    }

    /*Find the translation*/
    const void * txt = __lv_i18n_get_text_core(lang->plurals[ptype], msg_id);
    if(txt == NULL) {
        if(lang == languages[0]) return msg_id;
        else lang = languages[0];
    }

    /*Try again with the default language*/
    if(lang->plurals == NULL || lang->locale_plural_fn == NULL) return msg_id;

    ptype = lang->locale_plural_fn(num);

    if(lang->plurals[ptype] == NULL) return msg_id;

    txt = __lv_i18n_get_text_core(lang->plurals[ptype], msg_id);

    if(txt == NULL) return msg_id;

    return txt;
}

/**
 * Get the name of the currently used locale.
 * @return name of the currently used locale. E.g. "en-GB"
 */
const void * lv_i18n_get_current_locale(void)
{
    if(!local_lang) return NULL;
    return local_lang->locale_name;
}
