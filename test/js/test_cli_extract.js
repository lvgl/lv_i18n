'use strict';


const assert            = require('assert');
const shell             = require('shelljs');
const yaml              = require('js-yaml');
const { join }          = require('path');
const { readFileSync }  = require('fs');

const { run }           = require('../../lib/cli');

const fixtures_src_dir  = join(__dirname, 'fixtures/cli_extract');
const fixtures          = join(__dirname, 'fixtures/cli_extract.tmp');


describe('CLI extract', function () {
  beforeEach(function () {
    shell.rm('-rf', fixtures);
    shell.cp('-R', fixtures_src_dir, fixtures);
  });

  it('Should fail on missed sources', function () {
    assert.throws(
      () => {
        run([ 'extract', '-s', 'bad_path', '-t', 'anything' ]);
      },
      /Failed to find any source file/
    );
  });

  it('Should fail on missed locales', function () {
    assert.throws(
      () => {
        run([ 'extract', '-s', join(fixtures, 'src_*.c'), '-t', 'bad_path' ]);
      },
      /Failed to find any translation file/
    );
  });

  it('Should fails (with report) on orphaned phrases, --orphaned-fail', function () {
    assert.throws(
      () => {
        run([ 'extract', '-s', join(fixtures, 'src_*.c'), '-t', join(fixtures, 'orphaned_*.yml'), '--orphaned-fail' ]);
      },
      /Your translations have orphaned phrases/
    );
  });

  it('Should not fails on orphaned phrases, without --orphaned-fail', function () {
    run([ 'extract', '-s', join(fixtures, 'src_*.c'), '-t', join(fixtures, 'orphaned_*.yml') ]);
  });

  it('Should exit without error if no source phrases exist', function () {
    run([ 'extract', '-s', join(__dirname, 'fixtures/empty_src.c'), '-t', 'any-value' ]);
  });


  it('Should fill empty locales', function () {
    run([ 'extract', '-s', join(fixtures, 'src_*.c'), '-t', join(fixtures, 'empty_*.yml') ]);

    assert.deepStrictEqual(
      yaml.safeLoad(readFileSync(join(fixtures, 'empty_en-GB.yml'))),
      {
        'en-GB': {
          text1: null,
          text2: null,
          text3: {
            one: null,
            other: null
          }
        }
      }
    );
    assert.deepStrictEqual(
      yaml.safeLoad(readFileSync(join(fixtures, 'empty_ru-RU.yml'))),
      {
        'ru-RU': {
          text1: null,
          text2: null,
          text3: {
            one: null,
            few: null,
            many: null,
            other: null
          }
        }
      }
    );
  });

  it('Should add missed keys', function () {
    run([ 'extract', '-s', join(fixtures, 'src_1.c'), '-t', join(fixtures, 'partial_*.yml') ]);

    assert.deepStrictEqual(
      yaml.safeLoad(readFileSync(join(fixtures, 'partial_en-GB.yml'))),
      {
        'en-GB': {
          text1: null,
          text2: 'existing text'
        }
      }
    );
  });

  it('Should fail on singular/plural mix', function () {
    assert.throws(
      () => {
        run([ 'extract', '-s', join(fixtures, 'src_1.c'), '-t', join(fixtures, 'mixed_*.yml') ]);
      },
      /mixed singular\/plural/
    );
  });

  afterEach(function () {
    shell.rm('-rf', fixtures);
  });
});
