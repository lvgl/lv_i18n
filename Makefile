default: test
.PHONY: default test-coverage test test-deps clean

test-deps:
	cd test/c && $(MAKE) test-deps

test-js:
	npm test

test-deps:
	cd test/c && $(MAKE) test-deps

test-c:
	cd test/c && $(MAKE) test

test: test-js test-c

test-coverage:
	cd test/c && $(MAKE) test-coverage
