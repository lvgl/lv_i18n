Example for lv_i18n
===================

This directory contains a small example to demonstrate the use of
lv_i18n. The source code of the C program using translated text with
lv_i18n is "main.c" and the translations can be found in
"translations/".

## Create the lv_i18n library

There are two versions: standard and optimized (using lv_i18n with
--optimize). First create the lv_i18n library by using the available
translations with::

```sh
make compile
```

This will create lv_i18n.h and lv_i18n.c in the current directory
containing the library code and the translations. For the optimized
case, use::

```sh
make compile-optimized
```

## Compile the sample program

Then use the following command to compile your application in main.c
together with the created lv_i18n library and translations::

```sh
make main
```

## Execute the application

Execute your application with

```sh
./main
```

It will use lv_i18n to printf various strings and their associated
translations. It will do this for the language pack "en-GB" (default)
and "ru-RU". So you should see, which key gets translated and how the
fallback to the default language works.

## Extending the application

The text "This is a new text" in main.c is not yet part of the
translation and is an example on how to extend your program with new
texts. Without the follwing work, this text is not found in the
translation table, and therefore used unchanged/untranslated.

If you added new texts to your application, you muste execute

```sh
make extract
```

to extract new texts from your main.c and add it to the translation
files. Please the edit translations/*.yml to see, that the new key was
added and implement a proper translation for "en-GB" and "ru-RU".

Then follow above to "make compile" and "make main" to compile the
library and application and see the new key being translated.




