'use strict';


const assert            = require('assert');
const shell             = require('shelljs');
const yaml              = require('js-yaml');
const { join }          = require('path');
const { readFileSync }  = require('fs');

const { run }           = require('../../lib/cli');

const fixtures_src_dir = join(__dirname, 'fixtures/cli_rename');
const fixtures_tmp_dir = join(__dirname, 'fixtures/cli_rename.tmp');
const fixtures_yaml_path = join(fixtures_tmp_dir, '*.yml');


describe('CLI rename', function () {
  beforeEach(function () {
    shell.rm('-rf', fixtures_tmp_dir);
    shell.cp('-R', fixtures_src_dir, fixtures_tmp_dir);
  });

  it('Should rename singulars', function () {
    run([ 'rename', '-t', `${fixtures_yaml_path}`, '--from', 'foo', '--to', 'new_foo' ]);

    assert.deepStrictEqual(
      yaml.safeLoad(readFileSync(join(fixtures_tmp_dir, 'en-GB.yml'))),
      {
        'en-GB': {
          new_foo: null,
          nail: {
            one: 'nail',
            other: 'nails'
          }
        }
      }
    );

    assert.deepStrictEqual(
      yaml.safeLoad(readFileSync(join(fixtures_tmp_dir, 'ru-RU.yml'))),
      {
        'ru-RU': {
          new_foo: 'фуу',
          nail: {
            one: 'гвоздь',
            few: 'гвоздя',
            many: 'гвоздей'
          }
        }
      }
    );
  });

  it('Should rename plurals', function () {
    run([ 'rename', '-t', `${fixtures_yaml_path}`, '--from', 'nail', '--to', 'new_nail' ]);

    assert.deepStrictEqual(
      yaml.safeLoad(readFileSync(join(fixtures_tmp_dir, 'en-GB.yml'))),
      {
        'en-GB': {
          foo: null,
          new_nail: {
            one: 'nail',
            other: 'nails'
          }
        }
      }
    );

    assert.deepStrictEqual(
      yaml.safeLoad(readFileSync(join(fixtures_tmp_dir, 'ru-RU.yml'))),
      {
        'ru-RU': {
          foo: 'фуу',
          new_nail: {
            one: 'гвоздь',
            few: 'гвоздя',
            many: 'гвоздей'
          }
        }
      }
    );
  });

  it('Should override existing keys', function () {
    run([ 'rename', '-t', `${fixtures_yaml_path}`, '--from', 'nail', '--to', 'foo' ]);

    assert.deepStrictEqual(
      yaml.safeLoad(readFileSync(join(fixtures_tmp_dir, 'en-GB.yml'))),
      {
        'en-GB': {
          foo: {
            one: 'nail',
            other: 'nails'
          }
        }
      }
    );

    assert.deepStrictEqual(
      yaml.safeLoad(readFileSync(join(fixtures_tmp_dir, 'ru-RU.yml'))),
      {
        'ru-RU': {
          foo: {
            one: 'гвоздь',
            few: 'гвоздя',
            many: 'гвоздей'
          }
        }
      }
    );
  });

  it('Should fail on missed files', function () {
    assert.throws(
      () => {
        run([ 'rename', '-t', 'bad_path', '--from', 'foo', '--to', 'new_foo' ]);
      },
      /Failed to find any translation file/
    );
  });

  it('Should fail on wrong key name ', function () {
    assert.throws(
      () => {
        run([ 'rename', '-t', `${fixtures_yaml_path}`, '--from', 'bad-key', '--to', 'new_foo' ]);
      },
      /Could not find key/
    );
  });

  afterEach(function () {
    shell.rm('-rf', fixtures_tmp_dir);
  });
});
