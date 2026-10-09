#include <stdio.h>
#include <string.h>
#include "lv_i18n.h"

static int failures;

static void print_bytes(const char *label, const char *value)
{
    const unsigned char *bytes = (const unsigned char *)value;
    fprintf(stderr, "  %s bytes:", label);
    do {
        fprintf(stderr, " %02X", (unsigned int)*bytes);
    } while(*bytes++ != '\0');
    fputc('\n', stderr);
}

static void check(const char *actual, const char *expected, int line)
{
    if(strcmp(actual, expected) != 0) {
        fprintf(stderr, "Translation mismatch at fixture line %d\n", line);
        print_bytes("actual", actual);
        print_bytes("expected", expected);
        failures++;
    }
}

#define CHECK(actual, expected) check(actual, expected, __LINE__)
