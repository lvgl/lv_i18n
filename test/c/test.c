#include "unity.h"
#include <stdio.h>
#include "../../src/lv_i18n.h"

////////////////////////////////////////////////////////////////////////////////

void test_init_should_ignore_NULL_input(void) {
    __lv_i18n_reset();

    TEST_ASSERT_EQUAL(lv_i18n_init(NULL), -1);
    TEST_ASSERT_NULL(lv_i18n_get_current_locale());
}

void test_init_should_ignore_empty_language_pack(void) {
    __lv_i18n_reset();

    const lv_i18n_lang_t * empty_language_pack[] = { NULL };

    TEST_ASSERT_EQUAL(lv_i18n_init(empty_language_pack), -1);
    TEST_ASSERT_NULL(lv_i18n_get_current_locale());
}

void test_init_should_work(void) {
    __lv_i18n_reset();

    TEST_ASSERT_EQUAL(lv_i18n_init(lv_i18n_language_pack), 0);
    TEST_ASSERT_EQUAL_STRING(lv_i18n_get_current_locale(), "en-GB");
}

////////////////////////////////////////////////////////////////////////////////

void test_set_locale_should_fail_before_init(void) {
    __lv_i18n_reset();

    TEST_ASSERT_EQUAL(lv_i18n_set_locale("en-GB"), -1);
    TEST_ASSERT_NULL(lv_i18n_get_current_locale());
}

void test_set_locale_should_work(void) {
    lv_i18n_init(lv_i18n_language_pack);

    TEST_ASSERT_EQUAL(lv_i18n_set_locale("en-GB"), 0);
    TEST_ASSERT_EQUAL_STRING(lv_i18n_get_current_locale(), "en-GB");
}

void test_set_locale_should_fail_not_existing(void) {
    lv_i18n_init(lv_i18n_language_pack);

    TEST_ASSERT_EQUAL(lv_i18n_set_locale("en-US"), -1);
    TEST_ASSERT_EQUAL_STRING(lv_i18n_get_current_locale(), "en-GB");
}

////////////////////////////////////////////////////////////////////////////////

void test_get_text_should_work(void) {
    lv_i18n_init(lv_i18n_language_pack);

    TEST_ASSERT_EQUAL_STRING(_("scr1_title"), "Title of screen 1");
    TEST_ASSERT_EQUAL_STRING(_("scr1_dsc"), "This is a text on the first screen...");
}

void test_get_text_plural_should_work(void) {
    lv_i18n_init(lv_i18n_language_pack);

    TEST_ASSERT_EQUAL_STRING(_p("cat", 1), "My friend has only one cat.");
    TEST_ASSERT_EQUAL_STRING(_p("dog", 5), "I already have %d dogs.");
}

////////////////////////////////////////////////////////////////////////////////


int main(void)
{
    UNITY_BEGIN();

    RUN_TEST(test_init_should_ignore_NULL_input);
    RUN_TEST(test_init_should_ignore_empty_language_pack);
    RUN_TEST(test_init_should_work);

    RUN_TEST(test_set_locale_should_fail_before_init);
    RUN_TEST(test_set_locale_should_work);
    RUN_TEST(test_set_locale_should_fail_not_existing);

    RUN_TEST(test_get_text_should_work);
    RUN_TEST(test_get_text_plural_should_work);

    return UNITY_END();
}
