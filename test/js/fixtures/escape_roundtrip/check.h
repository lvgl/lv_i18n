#include <stdio.h>
#include <string.h>
#include "lv_i18n.h"

static int failures;

static void check(const char *actual, const char *expected, int line)
{
    if(strcmp(actual, expected) != 0) {
        fprintf(stderr, "Translation mismatch at fixture line %d\n", line);
        failures++;
    }
}

#define CHECK(actual, expected) check(actual, expected, __LINE__)
