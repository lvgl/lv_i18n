'use strict';


const assert            = require('assert');
const shell             = require('shelljs');
const yaml              = require('js-yaml');
const { join }          = require('path');
const { readFileSync }  = require('fs');

const { run }           = require('../../lib/cli');

const fixtures_src_dir = join(__dirname, 'fixtures/newlines');
const fixtures_tmp_dir = join(__dirname, 'fixtures/newlines.tmp');


describe('newlines', function () {
  beforeEach(function () {
    shell.rm('-rf', fixtures_tmp_dir);
    shell.cp('-R', fixtures_src_dir, fixtures_tmp_dir);
  });

  it('Should extract escaped C literal', function () {
    run([ 'extract', '-s', join(fixtures_tmp_dir, 'src.c'), '-t', join(fixtures_tmp_dir, 'partial_*.yml') ]);

    assert.deepStrictEqual(
      yaml.load(readFileSync(join(fixtures_tmp_dir, 'partial_ru-RU.yml'))),
      {
        'ru-RU': {
          'line1\nline2\ttext\nline3': null
        }
      }
    );
  });

  it('Should compile template data (.c/.h)', function () {
    run([ 'compile', '-t', join(fixtures_tmp_dir, 'ru-RU.yml'), '-o', fixtures_tmp_dir, '-l', 'ru-RU' ]);

    let compiled_src = readFileSync(join(fixtures_tmp_dir, 'lv_i18n.c')).toString();

    assert.match(compiled_src, /"строка1\\nстрока2\\tтекст\\nстрока3",/);
  });

  afterEach(function () {
    shell.rm('-rf', fixtures_tmp_dir);
  });
});
