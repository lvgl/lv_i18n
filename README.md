lv_i18n - Internationalization for LittlevGL
============================================

[![Build Status](https://img.shields.io/travis/littlevgl/lv_i18n/master.svg?style=flat)](https://travis-ci.org/littlevgl/lv_i18n)
[![NPM version](https://img.shields.io/npm/v/lv_i18n.svg?style=flat)](https://www.npmjs.org/package/lv_i18n)

Lightweighted internationalization (text translation) tool for C applications. It extracts the texts to translate from the C source files into `yml` files where you can add the translations and generate a C file with the translations. Language-specific plural forms are supported.  

## Quick overview
1. Mark up the text in your C files as `_("some text")` (singular) and `_p("%d item", item_cnt)` (plural)
2. Create template `yml` files for the translations you are interested in
3. Run the `extract` script to fill the `yml` files with the texts in `_()` and `_p()`
4. Add the translations into the `yml` files
5. Run the `compile` script to convert the `yml` files to a C and H file. They will contain the translations and all the background functions you need.

## Install the script

[node.js](https://nodejs.org/en/download/) required.

Global install of the last version, execute as "lv_i18n"
```sh
npm i lv_i18n -g
```

**Alternatives**

Install from github's repo, master branch
```sh
npm i littlevgl/lv_i18n -g
```

If you wish local install for your project, do in project root:

```sh
npm init private
npm i lv_i18n -s
# now available at ./node_modules/.bin/lv_i18n
```

Then commit `package.json` & put `/node_modules` into `.gitignore`. Next time
use just `npm i` to install.



## Mark up the text in your code
```c
#include "translations.h"

/* Load translations & default locale (usually, done once) */
lv_i18n_init(lv_i18n_lang_pack);

/* Set active locale (can be switched anytime) */
lv_i18n_set_locale("ru-RU");

/* The translation of "title1" will be read returned according to the selected local.
 * ("title1" is only a uniqu ID of the text.) Example:
 * en-GB: "Main menu"
 * ru_RU: "главное меню"
 */
gui_set_text(label, _("title1"));

/* According to `user_cnt` different text can be returned
 * en-GB `user_cnt == 1` : "One user is logged in"
 *        `user_cnt == 6` : "%d users are logged in"  
 */
char buf[64];
sprintf(buf, _p("user_logged_in", user_cnt)), user_cnt);  /*E.g. buf == "7 users are logged in"*/
gui_set_text(label, buf);
```

`_` and `_p` are normal functions. They just have this short name to enable fast typing of texts.

**Rules of getting the translation**
- If the translation is not available on the selected local then the default language will be used instead
- If the translation is not available on the default local the text ID ("title1" in the example) will be returned

## Create template yml files for the translations
For each translation, you need to create a `yml` file with "language code" name. For example:
- en-GB.yml
- ru-RU.yml
TODO link to the language code list

Add the `'language-code': ~` line to the `yml` files. Replace "language-code" with the actual language code. E.g.: `'en-GB': ~`

Technically you can have one `yml` file where you list all language codes you need but its more modular to separate them. 

## Run the extract script to fill the yml files
Run the `extract` script like this (assuming your source files are in the `src` folder an the `yml` files in the translatiosn folder): 
```sh
lv_i18n extract -s 'src/**/*.+(c|cpp|h|hpp)' -t 'translations/*.yml'
```

It will fill the `yml` files the texts marked with `_` and  `_p`.
For example:
```yml
'en-GB':
  title1: Main menu
  user_logged_in:
    one: One user is logged in
    other: %d users are logged in
```

## Add the translations into the yml files

The naming conventions in the `yml` files follow the rules of [CLDR](http://cldr.unicode.org/translation/language-names) so most of the translation offices will know them.

Example:
```yml
en-GB:
  title1: ~
  user_logged_in:
    one: ~
    other: ~
```

## Run the compile script to convert the yml files to a C and H file

Once you have the translations in the `yml` files you only need to run the `compile` script to generate a C and H files from the `yml` files. No other library will be required to get the translation with `_()` and `_p`.

Running the `compile` script
```sh
lv_i18n compile -t 'translations/*.yml' -o src/translations.c
```

## Follow modifications in the source code
TODO

## C API

### int lv_i18n_init(const lv_i18n_lang_pack_t * langs)

Attach generated translations to be used by `lv_i18n_get_text()`. Return 0
on success, -1 on fail.


### int lv_i18n_set_locale(const char * l_name)

Set locale to be used by `lv_i18n_get_text()`.

- _l_name_ - locale name (`en-GB`, `ru-RU`).
  - Locale names are not restricted to standard list, but only ASCII chars
    allowed (for simple normalization).

Returns 0 on success, -1 if locale not found.


### const char * lv_i18n_get_text(const char * msg_id)

Mapped to `_(...)` or `_t(...)` via `#define`

Get translated text. If not translated, return fallback (try default locale
first, then input param if default not exists)


### char* lv_i18n_get_text_plural(char* text, int32_t plural)

Mapped to `_p(...)` or `_tp(...)` via `#define`

Get the plural form of translated text. Use current local to select proper plural
algorithm. If not translated, fallback to default locale first, then to input
param.

## References:

To understand i18n principles better, you may find useful links below:

- [gettext](https://www.gnu.org/software/gettext/)
- [Rails Internationalization (I18n) API](https://guides.rubyonrails.org/i18n.html)
