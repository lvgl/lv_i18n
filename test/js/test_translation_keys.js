'use strict';


const assert = require('assert');
const { join } = require('path');


const TranslationKeys = require('../../lib/translation_keys');


describe('TranslationKeys', function () {

  describe('Files', function () {
    it('Should find source files', function () {
      let tk = new TranslationKeys();

      tk.loadFiles([ join(__dirname, 'fixtures/file_load/*.yml') ]);
      assert.equal(tk.filesCount, 1);
    });

    it('Should fail on empty file', function () {
      let tk = new TranslationKeys();

      assert.throws(() => tk.loadText('', 'test.yml'), /Empty file/);
    });

    it('Should fail on bad top struct', function () {
      let tk = new TranslationKeys();

      assert.throws(() => tk.loadText('[]', 'test.yml'), /Can not recognize content/);
    });

    it('Should fail on no locales', function () {
      let tk = new TranslationKeys();

      assert.throws(() => tk.loadText('{}', 'test.yml'), /No locales found/);
    });

    it('Should fail on bad local name', function () {
      let tk = new TranslationKeys();

      assert.throws(() => tk.loadText('{ foo#bar: {} }', 'test.yml'), /Bad locale name/);
    });

    it('Should fail if locale data is not object', function () {
      let tk = new TranslationKeys();

      assert.throws(() => tk.loadText('en-GB: []', 'test.yml'), /Locale .* content should be an object/);
    });

    it('Should allow locale with null value (special case)', function () {
      let tk = new TranslationKeys();

      tk.loadText('en-GB:', 'test.yml');
    });

    it('Should remember first locale occurence', function () {
      let tk = new TranslationKeys();

      tk.loadText('en-GB:', 'test1.yml');
      tk.loadText('en-GB:', 'test2.yml');

      assert.equal(tk.localeDefaultFile['en-GB'], 'test1.yml');
    });

    it('Should create files data', function () {
      let tk = new TranslationKeys();

      tk.loadText("{ 'en-GB': { 'foo': null, 'bar': null } }", 'test.yml');
      tk.removePhraseObj('en-GB', 'foo');
      assert.deepStrictEqual(tk.createFilesData(), {
        'test.yml': {
          'en-GB': {
            bar: null
          }
        }
      });
    });

    it('Should throw on homoglyph locales occurence', function () {
      let tk = new TranslationKeys();

      assert.throws(
        () => tk.loadText("{ 'en-GB': {}, 'en-gb': {} }", 'test.yml'),
        /was already defined/
      );

      assert.throws(
        () => tk.loadText("{ 'en-GB': {}, 'en_GB': {} }", 'test.yml'),
        /was already defined/
      );

    });
  });

  describe('Phrases', function () {
    it('Should accept empty singular', function () {
      let tk = new TranslationKeys();

      tk.loadText("{ 'en-GB': { 'foo': null } }", 'test.yml');
      assert.strictEqual(tk.getPhraseObj('en-GB', 'foo').value, null);
    });

    it('Should accept string singular', function () {
      let tk = new TranslationKeys();

      tk.loadText("{ 'en-GB': { 'foo': 'bar' } }", 'test.yml');
      assert.equal(tk.getPhraseObj('en-GB', 'foo').value, 'bar');
    });

    it('Should accept plural', function () {
      let tk = new TranslationKeys();

      tk.loadText("{ 'en-GB': { 'foo': { 'one': 'nail', 'other': 'nails'} } }", 'test.yml');
      assert.equal(tk.getPhraseObj('en-GB', 'foo').value.other, 'nails');
    });

    it('Should fail on bad singular', function () {
      let tk = new TranslationKeys();

      assert.throws(
        () => tk.loadText("{ 'en-GB': { 'foo': [] } }", 'test.yml'),
        /Wrong value for/
      );
    });

    it('Should fail on bad plural key', function () {
      let tk = new TranslationKeys();

      assert.throws(
        () => tk.loadText("{ 'en-GB': { 'foo': { 'few': 'nail' } } }", 'test.yml'),
        /Bad plural key name/
      );
    });

    it('Should fail on bad conten of plural key', function () {
      let tk = new TranslationKeys();

      assert.throws(
        () => tk.loadText("{ 'en-GB': { 'foo': { 'one': [] } } }", 'test.yml'),
        /Bad plural value for/
      );
    });

    it('Should remove phrase', function () {
      let tk = new TranslationKeys();

      tk.loadText("{ 'en-GB': { 'foo': null, 'bar': null } }", 'test.yml');
      assert.equal(tk.phrases.length, 2);

      tk.removePhraseObj('ru-RU', 'foo');
      assert.equal(tk.phrases.length, 2);

      tk.removePhraseObj('en-GB', 'foo');
      assert.equal(tk.phrases.length, 1);
      assert.equal(tk.phrases[0].key, 'bar');
    });
  });

});
