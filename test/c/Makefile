CC = gcc
ifeq ($(shell uname -s), Darwin)
CC = clang
endif
ifeq ($(findstring clang, $(CC)), clang)
E = -Weverything
CFLAGS += $E -Wno-unknown-warning-option -Wno-missing-prototypes
CFLAGS += -Wno-unused-macros -Wno-padded -Wno-missing-noreturn
endif
CFLAGS += -std=c99 -pedantic -Wall -Wextra -Wconversion -Werror
CFLAGS += -Wno-switch-enum -Wno-double-promotion
CFLAGS += -Wbad-function-cast -Wcast-qual -Wold-style-definition -Wshadow -Wstrict-overflow \
          -Wstrict-prototypes -Wswitch-default -Wundef
#DEBUG = -O0 -g
CFLAGS += $(DEBUG)
SRC = unity/src/unity.c ../../src/lv_i18n.template.c test.c
INC_DIR = -I unity/src -I $(BUILD_DIR)
COV_FLAGS = -fprofile-arcs -ftest-coverage
BUILD_DIR = build
TARGET = build/test.exe

default: test
.PHONY: default test-coverage test test-deps clean

test: test_optimized
	mkdir -p $(BUILD_DIR)
	../../lv_i18n.js compile -t ../../support/template_data.yml -o $(BUILD_DIR) -l en-GB
	$(CC) $(CFLAGS) $(DEFINES) $(INC_DIR) $(SRC) -o $(TARGET)
	./$(TARGET)

test-coverage:
	mkdir -p $(BUILD_DIR)
	$(CC) $(CFLAGS) $(DEFINES) $(INC_DIR) $(SRC) $(COV_FLAGS) -o $(TARGET)
	./$(TARGET)
	rm -rf coverage
	mkdir -p coverage
	~/.local/bin/gcovr --html-details --filter '../../src' -o coverage/index.html
	rm -rf *.gc*

test-deps:
	mkdir unity
	cd ./unity; \
		git init; \
		git remote add origin https://github.com/ThrowTheSwitch/Unity.git; \
		git fetch origin; \
		git checkout v2.4.3 -- src
	# This fails in Travis, install manually
	#pip install gcovr

clean:
	rm -f $(TARGET) $(BUILD_DIR)/*.gc* $(BUILD_DIR)/lv_i18n.h $(BUILD_DIR)/lv_i18n.c

test:

test_optimized:
	mkdir -p $(BUILD_DIR)
	../../lv_i18n.js compile -t ../../support/template_data.yml --optimize -o $(BUILD_DIR) -l en-GB
	$(CC) $(CFLAGS) $(DEFINES) $(INC_DIR) unity/src/unity.c build/lv_i18n.c test.c -o $(TARGET)
	./$(TARGET)


c:
	$(CC) $(CFLAGS) $(DEFINES) -I combined-sample-2 $(INC_DIR) unity/src/unity.c combined-sample-2/lv_i18n.c test.c -o $(TARGET)
	./$(TARGET)
	$(CC) $(CFLAGS) -DLV_I18N_OPTIMIZE $(DEFINES) -I combined-sample-2 $(INC_DIR) unity/src/unity.c combined-sample-2/lv_i18n.c test.c -o $(TARGET)
	./$(TARGET)

