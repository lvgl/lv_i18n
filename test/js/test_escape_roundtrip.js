'use strict';


const assert = require('assert');
const { spawnSync } = require('child_process');
const { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } = require('fs');
const { tmpdir } = require('os');
const { join } = require('path');
const yaml = require('js-yaml');
const { run } = require('../../lib/cli');
const AppError = require('../../lib/app_error');

const fixtures = join(__dirname, 'fixtures', 'escape_roundtrip');
const compiler = process.env.CC || 'cc';

// These are decoded strings, as seen by a YAML editor or the application at runtime.
// The C fixture supplies independent expectations; do not build it with the compiler's serializer.
const translations = {
  'line1\nline2': 'riga1\nriga2',
  'literal\\ntext': 'letterale\\ntesto',
  'literal\\0text': 'zero\\0testo',
  'quote " and slash \\': 'virgolette " e barra \\',
  'controls\t\r\b\f\x07\v\x1b': 'controlli\t\r\b\f\x07\v\x1b',
  'unicode café 日本語': 'traduzione è 日本語',
  'trigraph ??/n': 'traduzione ??/n',
  "tokens $& $$ $1 $` $'": "traduzione $& $$ $1 $` $'",
  'escaped ") terminator': 'virgolette ") conservate',
  'item\n"\\': { one: 'uno\n"\\', other: 'molti\n"\\' },
  'escaped ", comma': { one: 'uno ", conservato', other: 'molti ", conservati' }
};

function assertProcess(result, description) {
  const output = `${result.stdout || ''}${result.stderr || ''}`;
  if (result.error) assert.fail(`${description}: ${result.error.message}\n${output}`);
  assert.strictEqual(result.status, 0, `${description}\n${output}`);
}

function compileAndRun(directory, fixture) {
  copyFileSync(join(fixtures, fixture), join(directory, 'test.c'));
  copyFileSync(join(fixtures, 'check.h'), join(directory, 'check.h'));
  const executable = join(directory, process.platform === 'win32' ? 'test.exe' : 'test');
  assertProcess(spawnSync(compiler, [
    '-std=c99', '-Wall', '-Wextra', '-Werror',
    join(directory, 'test.c'), join(directory, 'lv_i18n.c'), '-o', executable
  ], { encoding: 'utf8', timeout: 10000 }), 'Generated C must compile');
  assertProcess(spawnSync(executable, [], { encoding: 'utf8', timeout: 10000 }),
    'Translations must match their runtime bytes');
}

describe('C / YAML escape round trip', function () {
  let directory;

  beforeEach(function () {
    directory = mkdtempSync(join(tmpdir(), 'lv-i18n-escapes-'));
  });

  afterEach(function () {
    rmSync(directory, { recursive: true, force: true });
  });

  function extractAndTranslate() {
    const translationFile = join(directory, 'en.yml');
    writeFileSync(translationFile, 'en: {}\n');
    run([ 'extract', '-s', join(fixtures, 'roundtrip.c'), '-t', translationFile ]);

    const extracted = yaml.load(readFileSync(translationFile, 'utf8'));
    const expected = {};
    Object.entries(translations).forEach(([ key, value ]) => {
      expected[key] = typeof value === 'string' ? null : { one: null, other: null };
    });
    assert.deepStrictEqual(extracted, { en: expected });

    Object.assign(extracted.en, translations);
    writeFileSync(translationFile, yaml.dump(extracted));
    return translationFile;
  }

  it('extracts decoded keys and preserves literal backslashes through YAML editing', function () {
    const translationFile = extractAndTranslate();
    assert.deepStrictEqual(yaml.load(readFileSync(translationFile, 'utf8')), { en: translations });
  });

  [ false, true ].forEach(optimize => {
    const mode = optimize ? 'optimized' : 'normal';

    const invalidCatalogs = [
      [ 'singular key', { 'prefix\x00suffix': 'translation', prefix: 'different translation' } ],
      [ 'plural key', { 'prefix\x00suffix': { one: 'one', other: 'many' } } ],
      [ 'singular value', { key: 'prefix\x00suffix' } ],
      [ 'plural value', { key: { one: 'one', other: 'prefix\x00suffix' } } ],
      [ 'leading NUL', { key: '\x00suffix' } ],
      [ 'trailing NUL', { key: 'prefix\x00' } ]
    ];

    invalidCatalogs.forEach(([ location, catalog ]) => {
      it(`rejects NUL in ${location} before writing ${mode} output`, function () {
        const translationFile = join(directory, 'en.yml');
        writeFileSync(translationFile, yaml.dump({ en: catalog }));
        const outputFiles = [ 'lv_i18n.c', 'lv_i18n.h', 'translations.raw', 'translations.h' ];
        outputFiles.forEach(file => writeFileSync(join(directory, file), 'existing output'));
        const args = [
          'compile', '-t', translationFile, '-l', 'en', '-o', directory,
          '--raw', join(directory, 'translations.raw')
        ];
        if (optimize) args.push('--optimize');

        assert.throws(() => run(args), error => {
          assert.ok(error instanceof AppError);
          assert.match(error.message, /NUL.*NUL-terminated/);
          assert.ok(error.message.includes('\\u0000'));
          return true;
        });
        outputFiles.forEach(file => {
          assert.strictEqual(readFileSync(join(directory, file), 'utf8'), 'existing output');
        });
      });
    });

    describe(`${mode} C runtime`, function () {
      // Cold compiler startup on CI can exceed Mocha's default two seconds.
      // Each child process still has its own timeout to catch hangs.
      this.timeout(30000);

      before(function () {
        const probe = spawnSync(compiler, [ '--version' ], { encoding: 'utf8', timeout: 10000 });
        // npm's JS-only tests remain usable without a C toolchain. An explicit CC must work.
        if (probe.error && probe.error.code === 'ENOENT' && !process.env.CC) this.skip();
        assertProcess(probe, 'C compiler must be available');
      });

      it('preserves extracted keys and edited translations, including plurals', function () {
        const translationFile = extractAndTranslate();
        const args = [ 'compile', '-t', translationFile, '-o', directory ];
        if (optimize) args.push('--optimize');
        run(args);
        compileAndRun(directory, 'roundtrip.c');
      });

      it('uses YAML scalar values without reinterpreting literal escape sequences', function () {
        const args = [ 'compile', '-t', join(fixtures, 'styles.yml'), '-o', directory ];
        if (optimize) args.push('--optimize');
        run(args);
        compileAndRun(directory, 'styles.c');
      });
    });
  });
});
