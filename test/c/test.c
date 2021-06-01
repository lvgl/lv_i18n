#include "unity.h"
#include <stdio.h>
#include "../../src/lv_i18n.h"

////////////////////////////////////////////////////////////////////////////////

void test_init_should_use_default_on_NULL_input(void)
{
    __lv_i18n_reset();

    TEST_ASSERT_EQUAL(lv_i18n_init(NULL), 0);
    TEST_ASSERT_EQUAL_STRING(lv_i18n_get_current_locale(), "en-GB");
}

void test_init_should_ignore_empty_language_pack(void)
{
    __lv_i18n_reset();

    const lv_i18n_lang_t * empty_language_pack[] = { NULL };

    TEST_ASSERT_EQUAL(lv_i18n_init(empty_language_pack), -1);
    TEST_ASSERT_NULL(lv_i18n_get_current_locale());
}

void test_init_should_work(void)
{
    __lv_i18n_reset();

    TEST_ASSERT_EQUAL(lv_i18n_init(lv_i18n_language_pack), 0);
    TEST_ASSERT_EQUAL_STRING(lv_i18n_get_current_locale(), "en-GB");
}

////////////////////////////////////////////////////////////////////////////////

void test_set_locale_should_fail_before_init(void)
{
    __lv_i18n_reset();

    TEST_ASSERT_EQUAL(lv_i18n_set_locale("ru-RU"), -1);
    TEST_ASSERT_NULL(lv_i18n_get_current_locale());
}

void test_set_locale_should_work(void)
{
    lv_i18n_init(lv_i18n_language_pack);

    TEST_ASSERT_EQUAL(lv_i18n_set_locale("ru-RU"), 0);
    TEST_ASSERT_EQUAL_STRING(lv_i18n_get_current_locale(), "ru-RU");
}

void test_set_locale_should_fail_not_existing(void)
{
    lv_i18n_init(lv_i18n_language_pack);

    TEST_ASSERT_EQUAL(lv_i18n_set_locale("invalid"), -1);
    TEST_ASSERT_EQUAL_STRING(lv_i18n_get_current_locale(), "en-GB");
}

////////////////////////////////////////////////////////////////////////////////

void test_get_text_should_work(void)
{
    lv_i18n_init(lv_i18n_language_pack);

    TEST_ASSERT_EQUAL_STRING(_("s_translated"), "s translated");
    lv_i18n_set_locale("ru-RU");
    TEST_ASSERT_EQUAL_STRING(_("s_translated"), "s переведено");
}

void test_get_text_should_fallback_to_base(void)
{
    lv_i18n_init(lv_i18n_language_pack);

    TEST_ASSERT_EQUAL_STRING(_("s_en_only"), "english only");
    lv_i18n_set_locale("ru-RU");
    TEST_ASSERT_EQUAL_STRING(_("s_en_only"), "english only");
}

void test_get_text_should_fallback_to_orig(void)
{
    lv_i18n_init(lv_i18n_language_pack);

    TEST_ASSERT_EQUAL_STRING(_("not existing"), "not existing");
    lv_i18n_set_locale("ru-RU");
    TEST_ASSERT_EQUAL_STRING(_("not existing"), "not existing");
}

////////////////////////////////////////////////////////////////////////////////

void test_get_text_plural_should_work(void)
{
    lv_i18n_init(lv_i18n_language_pack);

    TEST_ASSERT_EQUAL_STRING(_p("p_i_have_dogs", 1), "I have %d dog");
    TEST_ASSERT_EQUAL_STRING(_p("p_i_have_dogs", 2), "I have %d dogs");
    TEST_ASSERT_EQUAL_STRING(_p("p_i_have_dogs", 5), "I have %d dogs");
    lv_i18n_set_locale("ru-RU");
    TEST_ASSERT_EQUAL_STRING(_p("p_i_have_dogs", 1), "У меня %d собакен");
    TEST_ASSERT_EQUAL_STRING(_p("p_i_have_dogs", 2), "У меня %d собакена");
    TEST_ASSERT_EQUAL_STRING(_p("p_i_have_dogs", 5), "У меня %d собакенов");
}

void test_get_text_plural_should_fallback_to_base(void)
{
    lv_i18n_init(lv_i18n_language_pack);

    TEST_ASSERT_EQUAL_STRING(_p("p_i_have_dogs", 1), "I have %d dog");
    TEST_ASSERT_EQUAL_STRING(_p("p_i_have_dogs", 2), "I have %d dogs");
    TEST_ASSERT_EQUAL_STRING(_p("p_i_have_dogs", 5), "I have %d dogs");
    lv_i18n_set_locale("de-DE");
    TEST_ASSERT_EQUAL_STRING(_p("p_i_have_dogs", 1), "I have %d dog");
    TEST_ASSERT_EQUAL_STRING(_p("p_i_have_dogs", 2), "I have %d dogs");
    TEST_ASSERT_EQUAL_STRING(_p("p_i_have_dogs", 5), "I have %d dogs");
}

void test_get_text_plural_should_fallback_to_orig(void)
{
    lv_i18n_init(lv_i18n_language_pack);

    TEST_ASSERT_EQUAL_STRING(_p("not_existing", 1), "not_existing");
    TEST_ASSERT_EQUAL_STRING(_p("not_existing", 2), "not_existing");
    TEST_ASSERT_EQUAL_STRING(_p("not_existing", 5), "not_existing");
    lv_i18n_set_locale("ru-RU");
    TEST_ASSERT_EQUAL_STRING(_p("not_existing", 1), "not_existing");
    TEST_ASSERT_EQUAL_STRING(_p("not_existing", 2), "not_existing");
    TEST_ASSERT_EQUAL_STRING(_p("not_existing", 5), "not_existing");
    lv_i18n_set_locale("de-DE");
    TEST_ASSERT_EQUAL_STRING(_p("not_existing", 1), "not_existing");
    TEST_ASSERT_EQUAL_STRING(_p("not_existing", 2), "not_existing");
    TEST_ASSERT_EQUAL_STRING(_p("not_existing", 5), "not_existing");
}

////////////////////////////////////////////////////////////////////////////////

void test_should_fallback_without_langpack(void)
{
    __lv_i18n_reset();

    TEST_ASSERT_EQUAL_STRING(_("not existing"), "not existing");
    TEST_ASSERT_EQUAL_STRING(_p("not_existing", 1), "not_existing");
}


static uint8_t fake_plural_fn(int32_t num __attribute__((unused)))
{
    return LV_I18N_PLURAL_TYPE_OTHER;
}

void test_empty_base_tables_fallback(void)
{
    static const lv_i18n_lang_t en_gb_lang = {
        .locale_name = "en-GB",
        .locale_plural_fn = fake_plural_fn
    };

    static const lv_i18n_lang_t ru_ru_lang = {
        .locale_name = "ru-RU",
        .locale_plural_fn = fake_plural_fn
    };

    const lv_i18n_language_pack_t fake_language_pack[] = {
        &en_gb_lang,
        &ru_ru_lang,
        NULL
    };

    lv_i18n_init(fake_language_pack);
    TEST_ASSERT_EQUAL_STRING(_("not existing"), "not existing");
    lv_i18n_set_locale("ru-RU");
    TEST_ASSERT_EQUAL_STRING(_("not existing"), "not existing");

    lv_i18n_init(fake_language_pack);
    TEST_ASSERT_EQUAL_STRING(_p("not existing", 1), "not existing");
    TEST_ASSERT_EQUAL_STRING(_p("not existing", 2), "not existing");
    TEST_ASSERT_EQUAL_STRING(_p("not existing", 5), "not existing");
    lv_i18n_set_locale("ru-RU");
    TEST_ASSERT_EQUAL_STRING(_p("not existing", 1), "not existing");
    TEST_ASSERT_EQUAL_STRING(_p("not existing", 2), "not existing");
    TEST_ASSERT_EQUAL_STRING(_p("not existing", 5), "not existing");
}


void test_empty_plurals_fallback(void)
{
    static const lv_i18n_lang_t en_gb_lang = {
        .locale_name = "en-GB",
        .locale_plural_fn = NULL
    };

    static const lv_i18n_lang_t ru_ru_lang = {
        .locale_name = "ru-RU",
        .locale_plural_fn = NULL
    };

    const lv_i18n_language_pack_t fake_language_pack[] = {
        &en_gb_lang,
        &ru_ru_lang,
        NULL
    };

    lv_i18n_init(fake_language_pack);
    TEST_ASSERT_EQUAL_STRING(_("not existing"), "not existing");
    lv_i18n_set_locale("ru-RU");
    TEST_ASSERT_EQUAL_STRING(_("not existing"), "not existing");

    lv_i18n_init(fake_language_pack);
    TEST_ASSERT_EQUAL_STRING(_p("not existing", 1), "not existing");
    TEST_ASSERT_EQUAL_STRING(_p("not existing", 2), "not existing");
    TEST_ASSERT_EQUAL_STRING(_p("not existing", 5), "not existing");
    lv_i18n_set_locale("ru-RU");
    TEST_ASSERT_EQUAL_STRING(_p("not existing", 1), "not existing");
    TEST_ASSERT_EQUAL_STRING(_p("not existing", 2), "not existing");
    TEST_ASSERT_EQUAL_STRING(_p("not existing", 5), "not existing");
}

void test_empty_content_check(void)
{
    static lv_i18n_phrase_t en_gb_singulars[] = {
        {"s_empty", NULL},
        {NULL, NULL} // End mark
    };

    static const lv_i18n_lang_t en_gb_lang = {
        .locale_name = "en-GB",
        .singulars = en_gb_singulars,
        .locale_plural_fn = fake_plural_fn
    };

    const lv_i18n_language_pack_t fake_language_pack[] = {
        &en_gb_lang,
        NULL
    };

    lv_i18n_init(fake_language_pack);

    TEST_ASSERT_EQUAL_STRING(_("s_empty"), "s_empty");
}


////////////////////////////////////////////////////////////////////////////////


int main(void)
{
    UNITY_BEGIN();

    // lv_i18n_init
    RUN_TEST(test_init_should_use_default_on_NULL_input);
    RUN_TEST(test_init_should_ignore_empty_language_pack);
    RUN_TEST(test_init_should_work);

    // lv_i18n_set_locale
    RUN_TEST(test_set_locale_should_fail_before_init);
    RUN_TEST(test_set_locale_should_work);
    RUN_TEST(test_set_locale_should_fail_not_existing);

    // lv_i18n_get_text
    RUN_TEST(test_get_text_should_work);
    RUN_TEST(test_get_text_should_fallback_to_base);
    RUN_TEST(test_get_text_should_fallback_to_orig);

    // lv_i18n_get_plural_text
    RUN_TEST(test_get_text_plural_should_work);
    RUN_TEST(test_get_text_plural_should_fallback_to_base);
    RUN_TEST(test_get_text_plural_should_fallback_to_orig);

    // Other
    RUN_TEST(test_should_fallback_without_langpack);
    RUN_TEST(test_empty_base_tables_fallback);
    RUN_TEST(test_empty_plurals_fallback);
    RUN_TEST(test_empty_content_check);

    return UNITY_END();
}
