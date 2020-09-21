lv_i18n - Internationalization for LittlevGL
============================================

[![Build Status](https://img.shields.io/travis/lvgl/lv_i18n/master.svg?style=flat)](https://travis-ci.org/lvgl/lv_i18n)
[![NPM version](https://img.shields.io/npm/v/lv_i18n.svg?style=flat)](https://www.npmjs.org/package/lv_i18n)

Lightweight [gettext](https://www.gnu.org/software/gettext/) replacement
tools for C. Add multi-language support to your embedded projects with ease.


## Quick overview

1. Mark up the text in your C files as `_("some text")` (singular) and `_p("%d item", item_cnt)` (plural)
2. Create template `yml` files for the translations you are interested in
3. Run `extract` to fill the `yml` files with the texts in `_()` and `_p()`
4. Add the translations into the `yml` files
5. Run `compile` to convert the `yml` files to a C and H file. They will contain the translations and all the background functions you need.
6. Be sure your fonts contain the required characters. See [the docs here](https://docs.lvgl.io/latest/en/html/overview/font.html) for more details.

## Install/run the script

[node.js](https://nodejs.org/en/download/) required.

Global install of the last version, execute as "lv_i18n"

```sh
npm i lv_i18n -g
```

**Alternatives:**

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

**run via [npx](https://www.npmjs.com/package/npx)**

`node.js` has built-in [npx](https://www.npmjs.com/package/npx) utility to
execute packages "without install":

```sh
# run from github master
npx github:littlevgl/lv_i18n -h
# run from npm registry
npx lv_i18n -h
```


## Mark up the text in your code

```c
#include "lv_i18n/lv_i18n.h"  /*Assuming you have the translations here. (See below)*/

/* Load translations & default locale (usually, done once) */
lv_i18n_init(lv_i18n_language_pack);

/* Set active locale (can be switched anytime) */
lv_i18n_set_locale("ru-RU");

/* The translation of "title1" will be returned according to the selected locale.
 * ("title1" is only a unique ID of the text.) Example:
 * en-GB: "Main menu"
 * ru_RU: "Главное меню"
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

Rules of getting the translation:
- If the translation is not available on the selected locale then the default language will be used instead
- If the translation is not available on the default locale the text ID ("title1" in the example) will be returned


## Create template yml files for the translations

For each translation, you need to create a `yml` file with "language code" name. For example:

- en-GB.yml
- ru-RU.yml

Here is a [list](https://www.andiamo.co.uk/resources/iso-language-codes/) of the language and locale codes.

Add the `locale-name: ~` line to the `yml` files. Replace "language-code" with the actual language code.   
E.g.: `en-GB: ~` or simply `en: ~`

Technically you can have one `yml` file where you list all language codes you need but its more modular to separate them.


## Run extract to fill the yml files

Run `extract` like this (assuming your source files are in the `src` folder an the `yml` files in the translations folder):

```sh
lv_i18n extract -s 'src/**/*.+(c|cpp|h|hpp)' -t 'translations/*.yml'
```

It will fill the `yml` files the texts marked with `_` and  `_p`.
For example:

```yml
en-GB:
  title1: ~
  user_logged_in:
    one: ~
    other: ~
```


## Add the translations into the yml files

The naming conventions in the `yml` files follow the rules of [CLDR](http://cldr.unicode.org/translation/language-names) so most of the translation offices will know them.

Example:

```yml
'en-GB':
  title1: Main menu
  user_logged_in:
    one: One user is logged in
    other: %d users are logged in
```
## Run compile to convert the yml files to a C and H file

Once you have the translations in the `yml` files you only need to run the `compile` to generate a C and H files from the `yml` files. No other library will be required to get the translation with `_()` and `_p`.

Running `compile`:

```sh
lv_i18n compile -t 'translations/*.yml' -o 'src/lv_i18n'
```

The deafult locale is `en-GB` but you change it with `-l 'language-code'`.

## Follow modifications in the source code
To change a text id in the `yml` files use:
```sh
lv_i18n rename -t src/i18n/*.yml --from 'Hillo wold' --to 'Hello world!'
```

## C API

#### int lv_i18n_init(const lv_i18n_language_pack_t * langs)
Attach generated translations to be used by `lv_i18n_get_text()`.

- _return_ - 0 on success, -1 on fail.

___

#### int lv_i18n_set_locale(const char * l_name)
Set locale to be used by `lv_i18n_get_text()`.  

- _l_name_ - locale name (`en-GB`, `ru-RU`).
- _returns_ - 0 on success, -1 if locale not found.

___

#### const char * lv_i18n_get_text(const char * msg_id)
Mapped to `_(...)` or `_t(...)` via `#define`  

Get translated text. If not translated, return fallback (try default locale
first, then input param if default not exists)  
- _msg_id_ - The ID of a text to translate (e.g. `"title1"`)  
- _return_ - pointer to the traslation  

___

#### char* lv_i18n_get_text_plural(char* msg_id, int32_t plural)
Mapped to `_p(...)` or `_tp(...)` via `#define`

Get the plural form of translated text. Use current locale to select plural
algorithm. If not translated, fallback to default locale first, then to input
param.

- _msg_id_ - The ID of a text to translate (e.g. `"title1"`)  
- _plural_ - number of items to decide which plural for to use  
- _return_ - pointer to the traslation  

## References:

To understand i18n principles better, you may find useful links below:

- [gettext](https://www.gnu.org/software/gettext/)
- [Rails Internationalization (I18n) API](https://guides.rubyonrails.org/i18n.html)
