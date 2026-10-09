'use strict';


const assert            = require('assert');
const shell             = require('shelljs');
const yaml              = require('yaml');
const { join }          = require('path');
const { readFileSync, writeFileSync } = require('fs');

const { run }           = require('../../lib/cli');

const fixtures_src_dir = join(__dirname, 'fixtures', 'cli_rename');
const fixtures_tmp_dir = join(__dirname, 'fixtures', 'cli_rename.tmp');
const fixtures_yaml_path = join(fixtures_tmp_dir, '*.yml');


describe('CLI rename', function () {
  beforeEach(function () {
    shell.rm('-rf', fixtures_tmp_dir);
    shell.cp('-R', fixtures_src_dir, fixtures_tmp_dir);
  });

  it('Should rename singulars', function () {
    run([ 'rename', '-t', `${fixtures_yaml_path}`, '--from', 'foo', '--to', 'new_foo' ]);

    assert.deepStrictEqual(
      yaml.parse(readFileSync(join(fixtures_tmp_dir, 'en-GB.yml'), 'utf8')),
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
      yaml.parse(readFileSync(join(fixtures_tmp_dir, 'ru-RU.yml'), 'utf8')),
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
      yaml.parse(readFileSync(join(fixtures_tmp_dir, 'en-GB.yml'), 'utf8')),
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
      yaml.parse(readFileSync(join(fixtures_tmp_dir, 'ru-RU.yml'), 'utf8')),
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
      yaml.parse(readFileSync(join(fixtures_tmp_dir, 'en-GB.yml'), 'utf8')),
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
      yaml.parse(readFileSync(join(fixtures_tmp_dir, 'ru-RU.yml'), 'utf8')),
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

  it('Should keep key position & comments', function () {
    let file = join(fixtures_tmp_dir, 'comments.yml');

    writeFileSync(file, `de-DE:
  # First
  foo: Foo # foo
  # Second
  bar: Bar
  baz: Baz
`);

    run([ 'rename', '-t', file, '--from', 'foo', '--to', 'baz' ]);

    assert.strictEqual(readFileSync(file, 'utf8'), `de-DE:
  # First
  baz: Foo # foo
  # Second
  bar: Bar
`);
  });

  afterEach(function () {
    shell.rm('-rf', fixtures_tmp_dir);
  });
});
