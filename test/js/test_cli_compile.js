'use strict';


const assert            = require('assert');
const shell             = require('shelljs');
const { join }          = require('path');
const { run }           = require('../../lib/cli');

const fixtures_src_dir  = join(__dirname, 'fixtures/cli_compile');
const fixtures_tmp_dir  = join(__dirname, 'fixtures/cli_compile.tmp');
const demo_data_path    = join(__dirname, '../../support/template_data.yml');


describe('CLI compile', function () {
  beforeEach(function () {
    shell.rm('-rf', fixtures_tmp_dir);
    shell.cp('-R', fixtures_src_dir, fixtures_tmp_dir);
  });

  it('Should compile template data (raw)', function () {
    run([ 'compile', '-t', demo_data_path, '--raw', join(fixtures_tmp_dir, 'out.raw') ]);

    assert.ok(shell.test('-f', join(fixtures_tmp_dir, 'out.raw')));
  });

  it('Should compile template data (.c/.h)', function () {
    run([ 'compile', '-t', demo_data_path, '-o', fixtures_tmp_dir ]);

    assert.ok(shell.test('-f', join(fixtures_tmp_dir, 'lv_i18n.h')));
    assert.ok(shell.test('-f', join(fixtures_tmp_dir, 'lv_i18n.c')));
  });

  it('Should fail on missed files', function () {
    assert.throws(
      () => {
        run([ 'compile', '-t', 'bad_path', '--raw', '123' ]);
      },
      /Failed to find any translation file/
    );
  });

  it('Should fail on not specified and not autodetected base locale', function () {
    assert.throws(
      () => {
        run([ 'compile', '-t', join(fixtures_tmp_dir, 'no_base.yml'), '--raw', '123' ]);
      },
      /You did not specified locale/
    );
  });

  it('Should fail on missed base locale', function () {
    assert.throws(
      () => {
        run([ 'compile', '-t', join(fixtures_tmp_dir, 'no_base.yml'), '-l', 'en', '--raw', '123' ]);
      },
      /You specified base locale .* but it was not found in loaded translations/
    );
  });

  it('Should be ok with non-standard locale', function () {
    run([
      'compile',
      '-t', join(fixtures_tmp_dir, 'no_base.yml'),
      '-l', 'ru-RU',
      '--raw', join(fixtures_tmp_dir, '123')
    ]);
  });


  it('Should fail on missed output options', function () {
    assert.throws(
      () => {
        run([ 'compile', '-t', demo_data_path ]);
      },
      /You should specify output folder or raw output file option/
    );
  });

  it('Should fail on missed output dir', function () {
    assert.throws(
      () => {
        run([ 'compile', '-t', demo_data_path, '-o', 'bad_dir' ]);
      },
      /Output directory not exists/
    );
  });

  afterEach(function () {
    shell.rm('-rf', fixtures_tmp_dir);
  });
});
